import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

/**
 * USER ROUTES
 */

// GET /api/v1/shipments/track/:trackingNumber - Track shipment by tracking number
router.get(
  "/track/:trackingNumber",
  asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      throw new ApiError(400, "Tracking number is required");
    }

    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        order: {
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
          },
        },
      },
    });

    if (!shipment) {
      throw new ApiError(404, "Shipment not found with this tracking number");
    }

    res.json({
      success: true,
      message: "Shipment details retrieved successfully",
      data: shipment,
    });
  })
);

// GET /api/v1/orders/:orderId/shipments - Get all shipments for an order
router.get(
  "/orders/:orderId/shipments",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const shipments = await prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Shipments retrieved successfully",
      data: shipments,
    });
  })
);

/**
 * ADMIN ROUTES
 */

// GET /api/v1/shipments - Get all shipments (Admin)
router.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, carrier } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (carrier) {
      where.carrier = carrier;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Shipments retrieved successfully",
      data: shipments,
    });
  })
);

// GET /api/v1/shipments/:id - Get single shipment (Admin)
router.get(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Shipment ID is required");
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            shippingAddress: true,
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    res.json({
      success: true,
      message: "Shipment retrieved successfully",
      data: shipment,
    });
  })
);

// POST /api/v1/shipments - Create shipment (Admin)
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      orderId,
      carrier,
      trackingNumber,
      trackingUrl,
      status,
      estimatedDelivery,
    } = req.body;

    // Validation
    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    if (!carrier?.trim()) {
      throw new ApiError(400, "Carrier is required");
    }

    if (!trackingNumber?.trim()) {
      throw new ApiError(400, "Tracking number is required");
    }

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Check if tracking number already exists
    const existingShipment = await prisma.shipment.findFirst({
      where: { trackingNumber: trackingNumber.trim() },
    });

    if (existingShipment) {
      throw new ApiError(400, "Tracking number already exists");
    }

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl?.trim() || null,
        status,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        shippedAt: new Date(),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
          },
        },
      },
    });

    // Update order status to SHIPPED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingNumber: trackingNumber.trim(),
        shippedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: shipment,
    });
  })
);

// PATCH /api/v1/shipments/:id - Update shipment (Admin)
router.patch(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      carrier,
      trackingNumber,
      trackingUrl,
      status,
      estimatedDelivery,
      deliveredAt,
    } = req.body;

    if (!id) {
      throw new ApiError(400, "Shipment ID is required");
    }

    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existingShipment) {
      throw new ApiError(404, "Shipment not found");
    }

    const updateData: any = {};

    if (carrier !== undefined) updateData.carrier = carrier.trim();
    if (trackingNumber !== undefined) {
      // Check if new tracking number already exists
      const trackingExists = await prisma.shipment.findFirst({
        where: {
          trackingNumber: trackingNumber.trim(),
          id: { not: id },
        },
      });

      if (trackingExists) {
        throw new ApiError(400, "Tracking number already exists");
      }

      updateData.trackingNumber = trackingNumber.trim();
    }
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = estimatedDelivery
        ? new Date(estimatedDelivery)
        : null;
    }
    if (deliveredAt !== undefined) {
      updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    // If shipment is delivered, update order status
    if (status === "DELIVERED" || deliveredAt) {
      await prisma.order.update({
        where: { id: existingShipment.orderId },
        data: {
          status: "DELIVERED",
          deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
          paymentStatus: "COMPLETED",
        },
      });
    }

    res.json({
      success: true,
      message: "Shipment updated successfully",
      data: updated,
    });
  })
);

// DELETE /api/v1/shipments/:id - Delete shipment (Admin)
router.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Shipment ID is required");
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    await prisma.shipment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Shipment deleted successfully",
    });
  })
);

export default router;