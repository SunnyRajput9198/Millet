import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/notifications - Get all notifications for user
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { type, isRead } = req.query;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === "true";
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
        unreadCount,
      },
    });
  })
);

// GET /api/v1/notifications/:id - Get single notification
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
      throw new ApiError(400, "Notification ID is required");
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    // Mark as read when fetched
    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }

    res.json({
      success: true,
      message: "Notification retrieved successfully",
      data: { ...notification, isRead: true },
    });
  })
);

// PATCH /api/v1/notifications/:id/read - Mark notification as read
router.patch(
  "/:id/read",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!id) {
      throw new ApiError(400, "Notification ID is required");
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: "Notification marked as read",
      data: updated,
    });
  })
);

// PATCH /api/v1/notifications/mark-all-read - Mark all as read
router.patch(
  "/mark-all-read",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  })
);

// DELETE /api/v1/notifications/:id - Delete notification
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
      throw new ApiError(400, "Notification ID is required");
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  })
);

// DELETE /api/v1/notifications - Delete all notifications
router.delete(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: "All notifications deleted successfully",
    });
  })
);

// POST /api/v1/notifications/send - Send notification (Admin/System use)
router.post(
  "/send",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, title, message, type, data } = req.body;

    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    if (!title?.trim()) {
      throw new ApiError(400, "Title is required");
    }

    if (!message?.trim()) {
      throw new ApiError(400, "Message is required");
    }

    if (!type) {
      throw new ApiError(400, "Type is required");
    }

    const validTypes = ["ORDER", "PROMOTION", "SYSTEM"];
    if (!validTypes.includes(type)) {
      throw new ApiError(400, "Invalid notification type");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        data: data || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
    });
  })
);

export default router;