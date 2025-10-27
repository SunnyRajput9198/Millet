import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/recently-viewed - Get user's recently viewed products
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { limit = 20 } = req.query;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const recentlyViewed = await prisma.recentlyViewed.findMany({
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
      orderBy: { viewedAt: "desc" },
      take: parseInt(limit as string),
    });

    // Transform products for frontend
    const products = recentlyViewed.map((item) => ({
      viewedAt: item.viewedAt,
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
      message: "Recently viewed products retrieved successfully",
      data: {
        products,
        count: products.length,
      },
    });
  })
);

// POST /api/v1/recently-viewed - Add product to recently viewed
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

    // Check if already exists
    const existing = await prisma.recentlyViewed.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // Update viewedAt timestamp
      const updated = await prisma.recentlyViewed.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          viewedAt: new Date(),
        },
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
        message: "Recently viewed updated",
        data: updated,
      });
    }

    // Add new entry
    const recentlyViewed = await prisma.recentlyViewed.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    // Keep only last 50 items per user (cleanup old ones)
    const allViewed = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      select: { id: true },
    });

    if (allViewed.length > 50) {
      const toDelete = allViewed.slice(50).map((item) => item.id);
      await prisma.recentlyViewed.deleteMany({
        where: {
          id: { in: toDelete },
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Product added to recently viewed",
      data: recentlyViewed,
    });
  })
);

// DELETE /api/v1/recently-viewed/:productId - Remove product from recently viewed
router.delete(
  "/:productId",
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

    const recentlyViewed = await prisma.recentlyViewed.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!recentlyViewed) {
      throw new ApiError(404, "Product not in recently viewed");
    }

    await prisma.recentlyViewed.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.json({
      success: true,
      message: "Product removed from recently viewed",
    });
  })
);

// DELETE /api/v1/recently-viewed - Clear all recently viewed
router.delete(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    await prisma.recentlyViewed.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: "Recently viewed history cleared",
    });
  })
);

export default router;