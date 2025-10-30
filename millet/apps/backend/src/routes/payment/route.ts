import { Router, Request, Response } from "express";
import { Order, OrderStatus, PaymentMethod, prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";
import multer from "multer";
import path from "path";
import Stripe from "stripe";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/payment-screenshots/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "payment-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

interface OrderCalculation {
  cart: any;
  address: any;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  couponData: any;
}

async function calculateOrderTotals(
  userId: string,
  addressId: string,
  paymentMethod: string
): Promise<OrderCalculation> {
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
      throw new ApiError(400, `Insufficient stock for ${item.product.name}`);
    }
  }

  // Calculate subtotal
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
  
  // Shipping calculation based on payment method
  let shippingFee = 0;
  if (paymentMethod === "COD") {
    shippingFee = 40; // COD handling fee
  } else if (subtotal <= 500) {
    shippingFee = 50; // Standard shipping
  }

  const total = subtotal + tax + shippingFee - discount;

  return {
    cart,
    address,
    subtotal,
    discount,
    tax,
    shippingFee,
    total,
    couponData,
  };
}

async function createOrder(
  userId: string,
  addressId: string,
  calculation: OrderCalculation,
  paymentMethod: PaymentMethod,
  paymentStatus: "PENDING" | "PROCESSING" | "COMPLETED" = "PENDING",
  orderStatus: OrderStatus = "PENDING"
) {
  const orderNumber = `ORD${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 6)
    .toUpperCase()}`;

    if(!userId){
      throw new ApiError(400, "User ID is required");
    }

    if(!addressId){
      throw new ApiError(400, "Address ID is required");
    }
  

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      shippingAddressId: addressId,
      billingAddressId: addressId,
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      shippingFee: calculation.shippingFee,
      discount: calculation.discount,
      total: calculation.total,
      paymentMethod,
      paymentStatus,
      status: orderStatus,
      items: {
        create: calculation.cart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.product.name,  // ✅ ADD THIS LINE
          total: item.price * item.quantity,
          price: item.price,
        })),
      },
      addressId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Update coupon usage if applied
  if (calculation.couponData) {
    await prisma.coupon.update({
      where: { code: calculation.couponData.code },
      data: { usageCount: { increment: 1 } },
    });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({
    where: { cartId: calculation.cart.id },
  });

  await prisma.cart.update({
    where: { id: calculation.cart.id },
    data: { couponCode: null },
  });

  return order;
}

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/v1/payments/config - Get payment configuration
router.get(
  "/config",
  asyncHandler(async (req: Request, res: Response) => {
    const config = await prisma.paymentConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return res.json({
        success: true,
        message: "No payment configuration found",
        data: {},
      });
    }

    res.json({
      success: true,
      message: "Payment configuration retrieved",
      data: {
        upiId: config.upiId,
        upiQrCodeUrl: config.upiQrCodeUrl,
        accountNumber: config.accountNumber,
        ifscCode: config.ifscCode,
        accountHolderName: config.accountHolderName,
        bankName: config.bankName,
      },
    });
  })
);

// ============================================
// STRIPE CARD PAYMENT FLOW
// ============================================

// POST /api/v1/payments/create-payment-intent
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

    const calculation = await calculateOrderTotals(userId, addressId, paymentMethod);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(calculation.total * 100), // Convert to paise
      currency: "inr",
      metadata: {
        userId,
        addressId,
        subtotal: calculation.subtotal.toString(),
        tax: calculation.tax.toString(),
        shippingFee: calculation.shippingFee.toString(),
        discount: calculation.discount.toString(),
        total: calculation.total.toString(),
        couponCode: calculation.cart.couponCode || "",
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
        amount: calculation.total,
        breakdown: {
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          shippingFee: calculation.shippingFee,
          discount: calculation.discount,
          total: calculation.total,
        },
      },
    });
  })
);

// POST /api/v1/payments/confirm-payment - Confirm Stripe payment and create order
router.post(
  "/confirm-payment",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { paymentIntentId, addressId } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!paymentIntentId || !addressId) {
      throw new ApiError(400, "Payment intent ID and address ID are required");
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment not completed");
    }

    // Check if order already exists for this payment
    const existingTransaction = await prisma.transaction.findUnique({
      where: { transactionId: paymentIntentId },
      include: { order: true },
    });

    if (existingTransaction) {
      return res.json({
        success: true,
        message: "Order already created",
        data: {
          orderNumber: existingTransaction.order.orderNumber,
          orderId: existingTransaction.order.id,
        },
      });
    }

    const calculation = await calculateOrderTotals(userId, addressId, "CARD");

    // Create order
    const order = await createOrder(
      userId,
      addressId,
      calculation,
      "CARD",
      "COMPLETED",
      "PROCESSING"
    );

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId,
        amount: calculation.total,
        type: "PAYMENT",
        status: "COMPLETED",
        method: "CARD",
        transactionId: paymentIntentId,
      },
    });

    res.json({
      success: true,
      message: "Order created successfully",
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        transaction,
      },
    });
  })
);

// ============================================
// UPI PAYMENT
// ============================================

// POST /api/v1/payments/create-upi-payment
router.post(
  "/create-upi-payment",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { addressId, paymentMethod = "UPI", upiId } = req.body;

    console.log("=== UPI Payment Debug ===");
    console.log("userId:", userId);
    console.log("addressId:", addressId);
    console.log("paymentMethod:", paymentMethod);
    console.log("upiId:", upiId);

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!addressId) {
      throw new ApiError(400, "Address ID is required");
    }

    // For UPI ID payment, validate UPI ID
    if (paymentMethod === "UPI" && upiId) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
      if (!upiRegex.test(upiId)) {
        throw new ApiError(400, "Invalid UPI ID format");
      }
    }

    // For UPI QR, check if config exists
    if (paymentMethod === "UPI_QR") {
      const config = await prisma.paymentConfig.findFirst({
        where: { isActive: true },
      });

      if (!config?.upiId) {
        throw new ApiError(500, "UPI payment not configured");
      }
    }

    try {
      const calculation = await calculateOrderTotals(userId, addressId, "UPI");
      console.log("Calculation successful:", calculation);

      // Always use "UPI" for database - UPI_QR is just a frontend distinction
      const order = await createOrder(
        userId,
        addressId,
        calculation,
        "UPI" as PaymentMethod,  // Always use UPI
        "PENDING",
        "PENDING"
      );
      console.log("Order created:", order.id);

      // Generate transaction ID
      const transactionId = `UPI${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          orderId: order.id,
          userId,
          amount: calculation.total,
          type: "PAYMENT",
          status: "PENDING",
          method: "UPI" as PaymentMethod,  // Always use UPI
          transactionId,
          upiTransactionId: upiId || null,
          metadata: {
            paymentType: paymentMethod, // Store whether it was UPI or UPI_QR
          }
        },
      });
      console.log("Transaction created:", transaction.id);

      res.json({
        success: true,
        message: "Order created. Please complete the payment.",
        data: {
          orderNumber: order.orderNumber,
          orderId: order.id,
          paymentId: transactionId,
          total: calculation.total,
        },
      });
    } catch (error) {
      console.error("=== UPI Payment Error ===");
      console.error("Error details:", error);
      throw error;
    }
  })
);

// ============================================
// NET BANKING PAYMENT
// ============================================

// POST /api/v1/payments/create-netbanking-payment
router.post(
  "/create-netbanking-payment",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { addressId, paymentMethod = "NETBANKING", bankCode } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!addressId || !bankCode) {
      throw new ApiError(400, "Address ID and bank code are required");
    }

    const calculation = await calculateOrderTotals(userId, addressId, paymentMethod);

    // Create order
    const order = await createOrder(
      userId,
      addressId,
      calculation,
      paymentMethod,
      "PENDING",
      "PENDING"
    );

    const transactionId = `NB${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create transaction
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId,
        amount: calculation.total,
        type: "PAYMENT",
        status: "PENDING",
        method: paymentMethod,
        transactionId,
        metadata: { bankCode },
      },
    });

    // In production, integrate with actual payment gateway
    const redirectUrl = `https://bank-gateway.example.com/pay?ref=${transactionId}&amount=${calculation.total}`;

    res.json({
      success: true,
      message: "Order created. Redirecting to bank...",
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        redirectUrl,
        transactionId,
      },
    });
  })
);

// ============================================
// WALLET PAYMENT
// ============================================

// POST /api/v1/payments/create-wallet-payment
router.post(
  "/create-wallet-payment",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { addressId, paymentMethod = "WALLET", walletProvider } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!addressId || !walletProvider) {
      throw new ApiError(400, "Address ID and wallet provider are required");
    }

    const calculation = await calculateOrderTotals(userId, addressId, paymentMethod);

    // Create order
    const order = await createOrder(
      userId,
      addressId,
      calculation,
      paymentMethod,
      "PENDING",
      "PENDING"
    );

    const transactionId = `WALLET${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create transaction
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId,
        amount: calculation.total,
        type: "PAYMENT",
        status: "PENDING",
        method: paymentMethod,
        transactionId,
        metadata: { walletProvider },
      },
    });

    // In production, integrate with actual wallet gateway
    const redirectUrl = `https://${walletProvider}-gateway.example.com/pay?ref=${transactionId}&amount=${calculation.total}`;

    res.json({
      success: true,
      message: "Order created. Redirecting to wallet...",
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        redirectUrl,
        transactionId,
      },
    });
  })
);

// ============================================
// CASH ON DELIVERY
// ============================================

// POST /api/v1/payments/create-cod-order
router.post(
  "/create-cod-order",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { addressId, paymentMethod = "COD" } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!addressId) {
      throw new ApiError(400, "Address ID is required");
    }

    const calculation = await calculateOrderTotals(userId, addressId, paymentMethod);

    // Check COD limit
    const COD_LIMIT = 50000;
    if (calculation.total > COD_LIMIT) {
      throw new ApiError(
        400,
        `COD not available for orders above ₹${COD_LIMIT}`
      );
    }

    // Create order with PROCESSING status (COD orders are confirmed immediately)
    const order = await createOrder(
      userId,
      addressId,
      calculation,
      paymentMethod,
      "PENDING",
      "PROCESSING"
    );

    const transactionId = `COD${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create transaction
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId,
        amount: calculation.total,
        type: "PAYMENT",
        status: "PENDING",
        method: paymentMethod,
        transactionId,
        metadata: {
          note: "Payment will be collected on delivery",
        },
      },
    });

    res.json({
      success: true,
      message: "Order placed successfully. Pay cash on delivery.",
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        total: calculation.total,
        note: "Please keep exact cash ready for delivery",
      },
    });
  })
);

// ============================================
// PAYMENT STATUS & VERIFICATION
// ============================================

// GET /api/v1/payments/check-status/:paymentId
router.get(
  "/check-status/:paymentId",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
if(!paymentId){
      throw new ApiError(400, "Payment ID is required");
    }
    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionId: paymentId,
        userId,
      },
      include: {
        order: true,
      },
    });

    if (!transaction) {
      throw new ApiError(404, "Payment not found");
    }

    res.json({
      success: true,
      data: {
        status: transaction.status,
        orderNumber: transaction.order.orderNumber,
        orderId: transaction.order.id,
        paymentMethod: transaction.method,
        amount: transaction.amount,
      },
    });
  })
);

// GET /api/v1/payments/verify/:transactionId
router.get(
  "/verify/:transactionId",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { transactionId } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
if(!transactionId){
      throw new ApiError(400, "Transaction ID is required");
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionId,
        userId,
      },
      include: {
        order: true,
      },
    });

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    res.json({
      success: true,
      message: "Transaction status retrieved",
      data: transaction,
    });
  })
);

// GET /api/v1/payments/history
router.get(
  "/history",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      message: "Payment history retrieved",
      data: {
        transactions,
        count: transactions.length,
      },
    });
  })
);

// ============================================
// STRIPE WEBHOOK
// ============================================

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

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);

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

// ============================================
// ADMIN ROUTES
// ============================================

// POST /api/v1/payments/admin/payment-config
router.post(
  "/admin/payment-config",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      upiId,
      upiQrCodeUrl,
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
    } = req.body;

    // Deactivate existing configs
    await prisma.paymentConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new config
    const config = await prisma.paymentConfig.create({
      data: {
        upiId,
        upiQrCodeUrl,
        accountNumber,
        ifscCode,
        accountHolderName,
        bankName,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: "Payment configuration updated successfully",
      data: config,
    });
  })
);

// GET /api/v1/payments/admin/payments/pending
router.get(
  "/admin/payments/pending",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: { in: ["PENDING", "PROCESSING"] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      message: "Pending transactions retrieved",
      data: {
        transactions: pendingTransactions,
        count: pendingTransactions.length,
      },
    });
  })
);

// PATCH /api/v1/payments/admin/payments/:transactionId/verify
router.patch(
  "/admin/payments/:transactionId/verify",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminUserId = req.user?.id;

    if (!["COMPLETED", "REJECTED"].includes(status)) {
      throw new ApiError(400, "Status must be either COMPLETED or REJECTED");
    }

    if (!adminUserId) {
      throw new ApiError(401, "Admin not authenticated");
    }
if(!transactionId){
      throw new ApiError(400, "Transaction ID is required");
    }
    const transaction = await prisma.transaction.findUnique({
      where: { transactionId },
      include: { order: true },
    });

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    if (
      transaction.status !== "PENDING" &&
      transaction.status !== "PROCESSING"
    ) {
      throw new ApiError(400, "Transaction has already been processed");
    }
if(!transactionId){
      throw new ApiError(400, "Transaction ID is required");
    }
    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { transactionId },
      data: {
        status,
        verifiedAt: status === "COMPLETED" ? new Date() : null,
        verifiedBy: status === "COMPLETED" ? adminUserId : null,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    // Update order status
    if (status === "COMPLETED") {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: "COMPLETED",
          status: "PROCESSING",
        },
      });
    } else if (status === "REJECTED") {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
        },
      });
    }

    res.json({
      success: true,
      message: `Payment ${
        status === "COMPLETED" ? "verified" : "rejected"
      } successfully`,
      data: updatedTransaction,
    });
  })
);

export default router;