import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// POST /api/v1/payments/create-payment-intent - Create Stripe Payment Intent
router.post(
  "/create-payment-intent",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { addressId, paymentMethod = "CARD" } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!addressId) {
      throw new ApiError(400, "Address ID is required");
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    // Verify address ownership
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${item.product.name}`
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discount = 0;
    let couponData = null;

    // Apply coupon if exists
    if (cart.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: cart.couponCode },
      });

      if (coupon && coupon.isActive) {
        const now = new Date();
        if (
          coupon.validFrom <= now &&
          coupon.validUntil >= now &&
          (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
          (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)
        ) {
          if (coupon.type === "PERCENTAGE") {
            discount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else if (coupon.type === "FIXED") {
            discount = coupon.value;
          }
          couponData = coupon;
        }
      }
    }

    const tax = subtotal * 0.18; // 18% GST
    const shippingFee = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const total = subtotal + tax + shippingFee - discount;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to paise
      currency: "inr",
      metadata: {
        userId,
        cartId: cart.id,
        addressId,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shippingFee: shippingFee.toString(),
        discount: discount.toString(),
        total: total.toString(),
        couponCode: cart.couponCode || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: total,
        breakdown: {
          subtotal,
          tax,
          shippingFee,
          discount,
          total,
        },
      },
    });
  })
);

// POST /api/v1/payments/confirm-payment - Confirm payment and create order
router.post(
  "/confirm-payment",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { paymentIntentId, addressId } = req.body;

    console.log("Confirm payment request:", { userId, paymentIntentId, addressId });

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!paymentIntentId || !addressId) {
      throw new ApiError(400, "Payment intent ID and address ID are required");
    }

    try {
      // Check if order already exists for this payment intent (idempotency)
      const existingOrder = await prisma.order.findFirst({
        where: { paymentId: paymentIntentId },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      if (existingOrder) {
        console.log("Order already exists:", existingOrder.orderNumber);
        return res.json({
          success: true,
          message: "Order already exists",
          data: {
            order: existingOrder,
            orderNumber: existingOrder.orderNumber,
          },
        });
      }

      // Retrieve payment intent from Stripe
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log("Payment intent status:", paymentIntent.status);
      } catch (error: any) {
        console.error("Error retrieving payment intent:", error);
        throw new ApiError(400, "Invalid payment intent ID");
      }

      // Check payment status
      if (paymentIntent.status !== "succeeded") {
        throw new ApiError(400, `Payment not completed. Status: ${paymentIntent.status}`);
      }

      // Verify user ownership
      if (paymentIntent.metadata.userId !== userId) {
        throw new ApiError(403, "Unauthorized payment access");
      }

      // Get cart with fresh connection
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Cart is empty");
      }

      // Verify stock again before creating order
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available.`
          );
        }
      }

      // Get address
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        throw new ApiError(404, "Address not found");
      }

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Extract values from metadata
      const subtotal = parseFloat(paymentIntent.metadata.subtotal!);
      const tax = parseFloat(paymentIntent.metadata.tax!);
      const shippingFee = parseFloat(paymentIntent.metadata.shippingFee!);
      const discount = parseFloat(paymentIntent.metadata.discount!);
      const total = parseFloat(paymentIntent.metadata.total!);

      // Create order items data
      const orderItems = cart.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url || null,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));

      // Create order in transaction with smaller chunks
      const order = await prisma.$transaction(
        async (tx) => {
          // 1. Create order
          const newOrder = await tx.order.create({
            data: {
              orderNumber,
              userId,
              subtotal,
              tax,
              shippingFee,
              discount,
              total,
              status: "PROCESSING",
              paymentStatus: "COMPLETED",
              paymentMethod: "CARD",
              paymentId: paymentIntentId,
              shippingAddressId: addressId,
              billingAddressId: addressId,
              items: {
                create: orderItems,
              },
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
              shippingAddress: true,
            },
          });

          // 2. Update product stock
          for (const item of cart.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }

          // 3. Update coupon usage if applicable
          if (cart.couponCode) {
            await tx.coupon.updateMany({
              where: { code: cart.couponCode },
              data: {
                usageCount: {
                  increment: 1,
                },
              },
            });
          }

          // 4. Create transaction record
          await tx.transaction.create({
            data: {
              orderId: newOrder.id,
              amount: total,
              type: "PAYMENT",
              status: "COMPLETED",
              method: "CARD",
              transactionId: paymentIntentId,
              metadata: {
                stripePaymentIntent: paymentIntentId,
              },
            },
          });

          // 5. Clear cart items first
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });

          // 6. Update cart
          await tx.cart.update({
            where: { id: cart.id },
            data: { couponCode: null },
          });

          return newOrder;
        },
        {
          maxWait: 10000, // 10 seconds max wait time
          timeout: 20000, // 20 seconds timeout
        }
      );

      // Create notification outside transaction (non-critical operation)
      try {
        await prisma.notification.create({
          data: {
            userId,
            title: "Order Placed Successfully",
            message: `Your order ${orderNumber} has been placed successfully`,
            type: "ORDER",
            data: {
              orderId: order.id,
              orderNumber,
              total,
            },
          },
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't fail the order if notification fails
      }

      console.log("Order created successfully:", orderNumber);

      res.json({
        success: true,
        message: "Order created successfully",
        data: {
          order,
          orderNumber: order.orderNumber,
        },
      });
    } catch (error: any) {
      console.error("Error in confirm-payment:", error);
      
      // Provide more specific error messages
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle Prisma errors
      if (error.code === "P2034") {
        throw new ApiError(500, "Database transaction failed. Please try again.");
      }
      
      if (error.code === "P2028") {
        throw new ApiError(500, "Database connection lost. Please try again.");
      }
      
      throw new ApiError(500, "Failed to create order. Please contact support.");
    }
  })
);

// POST /api/v1/payments/webhook - Stripe webhook handler
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      throw new ApiError(400, `Webhook Error: ${err.message}`);
    }

    console.log("Webhook event received:", event.type);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        
        // Update transaction status if needed
        try {
          await prisma.transaction.updateMany({
            where: { transactionId: paymentIntent.id },
            data: { status: "COMPLETED" },
          });
        } catch (error) {
          console.error("Error updating transaction:", error);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent failed: ${failedPayment.id}`);
        
        // Update transaction status
        try {
          await prisma.transaction.updateMany({
            where: { transactionId: failedPayment.id },
            data: { status: "FAILED" },
          });
        } catch (error) {
          console.error("Error updating transaction:", error);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  })
);

// GET /api/v1/payments/payment-methods - Get saved payment methods
router.get(
  "/payment-methods",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    res.json({
      success: true,
      message: "Payment methods retrieved",
      data: {
        methods: [],
      },
    });
  })
);

export default router;