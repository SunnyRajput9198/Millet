import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// Helper function to generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
};

// GET /api/v1/orders - Get all orders for user
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
    });
  })
);

// GET /api/v1/orders/:id - Get single order details
router.get(
  "/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Order ID is required");
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId, // Ensure user can only view their own orders
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        transactions: true,
        shipments: true,
        refunds: true,
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    res.json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  })
);

// POST /api/v1/orders - Create order (checkout)
router.post(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      notes,
    } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    // Validation
    if (!shippingAddressId) {
      throw new ApiError(400, "Shipping address is required");
    }
    if (!billingAddressId) {
      throw new ApiError(400, "Billing address is required");
    }
    if (!paymentMethod) {
      throw new ApiError(400, "Payment method is required");
    }

    // Validate payment method
    const validPaymentMethods = ["CARD", "PAYPAL", "COD", "BANK_TRANSFER", "WALLET"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new ApiError(400, "Invalid payment method");
    }

    // Verify addresses exist and belong to user
    const [shippingAddress, billingAddress] = await Promise.all([
      prisma.address.findFirst({
        where: { id: shippingAddressId, userId },
      }),
      prisma.address.findFirst({
        where: { id: billingAddressId, userId },
      }),
    ]);

    if (!shippingAddress) {
      throw new ApiError(404, "Shipping address not found");
    }
    if (!billingAddress) {
      throw new ApiError(404, "Billing address not found");
    }

    // Get user's cart
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

    // Validate stock availability for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available.`
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.18; // 18% GST
    const shippingFee = subtotal > 50000 ? 0 : 500; // Free shipping above ₹50,000
    
    // Apply coupon discount if exists
    let discount = 0;
    if (cart.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: cart.couponCode },
      });

      if (coupon && coupon.isActive) {
        if (coupon.type === "PERCENTAGE") {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else if (coupon.type === "FIXED") {
          discount = coupon.value;
        }
      }
    }

    const total = subtotal + tax + shippingFee - discount;

    // Generate unique order number
    const orderNumber = generateOrderNumber();
    const addressId = shippingAddressId; // Assuming primary address is shipping address
    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId,
          billingAddressId,
          addressId,
          paymentMethod,
          subtotal,
          tax,
          shippingFee,
          discount,
          total,
          notes: notes || null,
          status: "PENDING",
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
        },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Create order items separately
      await tx.orderItem.createMany({
        data: cart.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.images[0]?.url??null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          commission: 0,
        })),
      });

      // Update product stock
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

      // Update coupon usage if applied
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

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });

      return newOrder;
    });

    // Fetch complete order with items after transaction
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: completeOrder,
    });
  })
);

// PATCH /api/v1/orders/:id/cancel - Cancel order
router.patch(
  "/:id/cancel",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Order ID is required");
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Check if order can be cancelled
    if (order.status === "CANCELLED") {
      throw new ApiError(400, "Order is already cancelled");
    }

    if (order.status === "DELIVERED") {
      throw new ApiError(400, "Cannot cancel delivered order");
    }

    if (order.status === "SHIPPED") {
      throw new ApiError(400, "Cannot cancel shipped order. Please contact support.");
    }

    // Cancel order and restore stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          notes: reason ? `Cancellation reason: ${reason}` : order.notes,
        },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return cancelled;
    });

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: updatedOrder,
    });
  })
);

// PATCH /api/v1/orders/:id/status - Update order status (Admin only)
router.patch(
  "/:id/status",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    if (!id) {
      throw new ApiError(400, "Order ID is required");
    }

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updateData: any = { status };

    if (status === "SHIPPED") {
      updateData.shippedAt = new Date();
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
    }

    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = "COMPLETED";
    }

    if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
    }

    if (status === "REFUNDED") {
      updateData.refundedAt = new Date();
      updateData.paymentStatus = "REFUNDED";
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  })
);

// PATCH /api/v1/orders/:id/payment - Update payment status
router.patch(
  "/:id/payment",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentStatus, paymentId } = req.body;

    if (!id) {
      throw new ApiError(400, "Order ID is required");
    }

    if (!paymentStatus) {
      throw new ApiError(400, "Payment status is required");
    }

    const validPaymentStatuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new ApiError(400, "Invalid payment status");
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        paymentId: paymentId || order.paymentId,
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: updatedOrder,
    });
  })
);

export default router;