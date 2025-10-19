import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/products/:productId/reviews - Get all reviews for a product
router.get(
  "/products/:productId/reviews",
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

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

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    res.json({
      success: true,
      message: "Reviews retrieved successfully",
      data: {
        reviews,
        stats: {
          totalReviews: reviews.length,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
        },
      },
    });
  })
);

// POST /api/v1/products/:productId/reviews - Create a review
router.post(
  "/products/:productId/reviews",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const userId = req.user?.id;
    const { rating, comment } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    if (!rating) {
      throw new ApiError(400, "Rating is required");
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    if (!comment?.trim()) {
      throw new ApiError(400, "Comment is required");
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId,
      },
    });

    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    // Optional: Check if user has purchased this product
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId,
        items: {
          some: {
            productId,
          },
        },
        status: "DELIVERED",
      },
    });

    if (!hasPurchased) {
      throw new ApiError(
        400,
        "You can only review products you have purchased and received"
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment: comment.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  })
);

// GET /api/v1/reviews/my-reviews - Get all reviews by current user
router.get(
  "/reviews/my-reviews",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const reviews = await prisma.review.findMany({
      where: { userId },
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
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Your reviews retrieved successfully",
      data: reviews,
    });
  })
);

// PATCH /api/v1/reviews/:id - Update a review
router.patch(
  "/reviews/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { rating, comment } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Review ID is required");
    }

    // Find review and verify ownership
    const existingReview = await prisma.review.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingReview) {
      throw new ApiError(404, "Review not found or you don't have permission");
    }

    const updateData: any = {};

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
      }
      updateData.rating = rating;
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        throw new ApiError(400, "Comment cannot be empty");
      }
      updateData.comment = comment.trim();
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  })
);

// DELETE /api/v1/reviews/:id - Delete a review
router.delete(
  "/reviews/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Review ID is required");
    }

    // Find review and verify ownership
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!review) {
      throw new ApiError(404, "Review not found or you don't have permission");
    }

    await prisma.review.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  })
);

export default router;