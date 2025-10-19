import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// Helper function to calculate cart totals
const calculateCartTotals = (items: any[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

// GET /api/v1/cart - Get user's cart
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
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

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
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
    }

    const totals = calculateCartTotals(cart.items);

    res.json({
      success: true,
      message: "Cart retrieved successfully",
      data: {
        cart,
        ...totals,
      },
    });
  })
);

// POST /api/v1/cart/items - Add item to cart
router.post(
  "/items",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    if (quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    // Check if product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.stock < quantity) {
      throw new ApiError(400, `Only ${product.stock} items available in stock`);
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new ApiError(
          400,
          `Cannot add more items. Only ${product.stock} available in stock`
        );
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      return res.json({
        success: true,
        message: "Cart item quantity updated",
        data: updatedItem,
      });
    }

    // Add new item to cart
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
      },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      data: cartItem,
    });
  })
);

// PATCH /api/v1/cart/items/:id - Update cart item quantity
router.patch(
  "/items/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Cart item ID is required");
    }

    if (!quantity || quantity < 1) {
      throw new ApiError(400, "Valid quantity is required");
    }

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: { userId },
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new ApiError(404, "Cart item not found");
    }

    // Check stock availability
    if (cartItem.product.stock < quantity) {
      throw new ApiError(
        400,
        `Only ${cartItem.product.stock} items available in stock`
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Cart item updated successfully",
      data: updatedItem,
    });
  })
);

// DELETE /api/v1/cart/items/:id - Remove item from cart
router.delete(
  "/items/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Cart item ID is required");
    }

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new ApiError(404, "Cart item not found");
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  })
);

// DELETE /api/v1/cart - Clear entire cart
router.delete(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  })
);

// POST /api/v1/cart/apply-coupon - Apply coupon code
router.post(
  "/apply-coupon",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { couponCode } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!couponCode?.trim()) {
      throw new ApiError(400, "Coupon code is required");
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      throw new ApiError(404, "Invalid coupon code");
    }

    // Validate coupon
    const now = new Date();
    if (!coupon.isActive) {
      throw new ApiError(400, "Coupon is no longer active");
    }

    if (coupon.validFrom > now) {
      throw new ApiError(400, "Coupon is not yet valid");
    }

    if (coupon.validUntil < now) {
      throw new ApiError(400, "Coupon has expired");
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new ApiError(400, "Coupon usage limit reached");
    }

    // Get cart to check minimum order amount
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const cartTotal = calculateCartTotals(cart.items);

    if (coupon.minOrderAmount && cartTotal.subtotal < coupon.minOrderAmount) {
      throw new ApiError(
        400,
        `Minimum order amount of ₹${coupon.minOrderAmount} required`
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = (cartTotal.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === "FIXED") {
      discount = coupon.value;
    }

    // Apply coupon to cart
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: coupon.code },
    });

    res.json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discount,
        },
        cartTotal: cartTotal.subtotal,
        discountAmount: discount,
        finalTotal: cartTotal.subtotal - discount,
      },
    });
  })
);

export default router;