import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/admin/orders - Get all orders with pagination
router.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "10",
      status,
      paymentStatus,
      search,
      sortBy = "createdAt",
      order = "desc",
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: "insensitive" } },
        {
          user: {
            OR: [
              { email: { contains: search as string, mode: "insensitive" } },
              {
                username: { contains: search as string, mode: "insensitive" },
              },
            ],
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: order === "asc" ? "asc" : "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              price: true,
            },
          },
          shippingAddress: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  })
);

// GET /api/v1/admin/orders/stats - Get order statistics
router.get(
  "/stats",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const [totalOrders, ordersByStatus, revenueStats] = await Promise.all([
      prisma.order.count(),

      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.order.aggregate({
        where: {
          status: { in: ["DELIVERED", "SHIPPED"] },
        },
        _sum: {
          total: true,
        },
        _avg: {
          total: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    ordersByStatus.forEach((item) => {
      statusMap[item.status] = item._count;
    });

    res.json({
      success: true,
      message: "Order statistics retrieved successfully",
      data: {
        totalOrders,
        pendingOrders: statusMap.PENDING || 0,
        processingOrders: statusMap.PROCESSING || 0,
        shippedOrders: statusMap.SHIPPED || 0,
        deliveredOrders: statusMap.DELIVERED || 0,
        cancelledOrders: statusMap.CANCELLED || 0,
        refundedOrders: statusMap.REFUNDED || 0,
        totalRevenue: revenueStats._sum.total || 0,
        averageOrderValue: revenueStats._avg.total || 0,
      },
    });
  })
);

// PATCH /api/v1/admin/orders/bulk-status - Bulk update order status
router.patch(
  "/bulk-status",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new ApiError(400, "Order IDs array is required");
    }

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const updateData: any = { status };

    if (status === "SHIPPED") {
      updateData.shippedAt = new Date();
    } else if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = "COMPLETED";
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
    }

    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: updateData,
    });

    res.json({
      success: true,
      message: `${orderIds.length} orders updated successfully`,
    });
  })
);

export default router;