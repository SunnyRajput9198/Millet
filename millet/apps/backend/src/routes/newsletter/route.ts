import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// POST /api/v1/newsletter/subscribe - Subscribe to newsletter (public route)
router.post(
  "/subscribe",
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    // Check if email already exists
    const existing = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ApiError(400, "Email already subscribed to newsletter");
      } else {
        // Reactivate if previously unsubscribed
        const updated = await prisma.newsletter.update({
          where: { email: email.toLowerCase() },
          data: { isActive: true },
        });

        return res.status(200).json({
          success: true,
          message: "Successfully resubscribed to newsletter",
          data: updated,
        });
      }
    }

    // Create new subscription
    const subscription = await prisma.newsletter.create({
      data: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to newsletter",
      data: subscription,
    });
  })
);

// POST /api/v1/newsletter/unsubscribe - Unsubscribe from newsletter (public route)
router.post(
  "/unsubscribe",
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const subscription = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscription) {
      throw new ApiError(404, "Email not found in newsletter list");
    }

    if (!subscription.isActive) {
      throw new ApiError(400, "Email already unsubscribed");
    }

    // Soft delete - set isActive to false
    const updated = await prisma.newsletter.update({
      where: { email: email.toLowerCase() },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Successfully unsubscribed from newsletter",
      data: updated,
    });
  })
);

// GET /api/v1/newsletter - Get all newsletter subscribers (protected - admin only)
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;

    // Build filter based on status query param
    const whereClause: any = {};
    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    const subscribers = await prisma.newsletter.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Newsletter subscribers retrieved successfully",
      data: {
        subscribers,
        count: subscribers.length,
        activeCount: subscribers.filter((s) => s.isActive).length,
        inactiveCount: subscribers.filter((s) => !s.isActive).length,
      },
    });
  })
);

// GET /api/v1/newsletter/:id - Get newsletter subscriber by ID (protected)
router.get(
  "/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Subscriber ID is required");
    }

    const subscriber = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }

    res.json({
      success: true,
      message: "Subscriber retrieved successfully",
      data: subscriber,
    });
  })
);

// GET /api/v1/newsletter/email/:email - Check subscription status by email (public)
router.get(
  "/email/:email",
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const subscriber = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscriber) {
      return res.json({
        success: true,
        message: "Email not found",
        data: {
          subscribed: false,
          isActive: false,
        },
      });
    }

    res.json({
      success: true,
      message: "Subscription status retrieved",
      data: {
        subscribed: true,
        isActive: subscriber.isActive,
        subscribedAt: subscriber.createdAt,
      },
    });
  })
);

// DELETE /api/v1/newsletter/:id - Permanently delete subscriber (protected - admin only)
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Subscriber ID is required");
    }

    const subscriber = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }

    await prisma.newsletter.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Subscriber permanently deleted",
    });
  })
);

// PATCH /api/v1/newsletter/:id/toggle - Toggle subscriber status (protected)
router.patch(
  "/:id/toggle",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Subscriber ID is required");
    }

    const subscriber = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }

    const updated = await prisma.newsletter.update({
      where: { id },
      data: { isActive: !subscriber.isActive },
    });

    res.json({
      success: true,
      message: `Subscriber ${updated.isActive ? "activated" : "deactivated"} successfully`,
      data: updated,
    });
  })
);

export default router;