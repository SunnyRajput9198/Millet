import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/wishlist - Get user's wishlist
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform products for frontend
    const items = wishlist.map((item) => ({
      id: item.id,
      addedAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        description: item.product.description,
        price: item.product.price,
        comparePrice: item.product.comparePrice,
        image: item.product.images[0]?.url || "/placeholder.svg",
        inStock: item.product.stock > 0,
        stock: item.product.stock,
        category: item.product.category?.name,
        rating:
          item.product.reviews.length > 0
            ? item.product.reviews.reduce((acc, r) => acc + r.rating, 0) /
              item.product.reviews.length
            : 0,
        reviewCount: item.product.reviews.length,
      },
    }));

    res.json({
      success: true,
      message: "Wishlist retrieved successfully",
      data: {
        items,
        count: items.length,
      },
    });
  })
);

// POST /api/v1/wishlist - Add product to wishlist
router.post(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, "Product already in wishlist");
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlistItem,
    });
  })
);

// DELETE /api/v1/wishlist/:id - Remove product from wishlist
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Wishlist item ID is required");
    }

    // Find wishlist item and verify ownership
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!wishlistItem) {
      throw new ApiError(404, "Wishlist item not found");
    }

    await prisma.wishlist.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Product removed from wishlist",
    });
  })
);

// DELETE /api/v1/wishlist/product/:productId - Remove by product ID
router.delete(
  "/product/:productId",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    // Find and delete wishlist item
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      throw new ApiError(404, "Product not in wishlist");
    }

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.json({
      success: true,
      message: "Product removed from wishlist",
    });
  })
);

// DELETE /api/v1/wishlist - Clear entire wishlist
router.delete(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    await prisma.wishlist.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  })
);

export default router;