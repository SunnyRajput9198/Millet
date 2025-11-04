import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/admin/stats - Get dashboard statistics
router.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Previous period for comparison
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime());

    // Fetch all data in parallel
    const [
      currentOrders,
      previousOrders,
      totalProducts,
      totalCategories,
      totalUsers,
      previousUsers,
      ordersByStatus,
      recentOrders,
      topProducts,
      lowStockProducts,
      revenueByDay,
    ] = await Promise.all([
      // Current period orders
      prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          total: true,
          status: true,
        },
      }),

      // Previous period orders
      prisma.order.findMany({
        where: {
          createdAt: { gte: prevStart, lt: prevEnd },
        },
        select: {
          total: true,
        },
      }),

      // Total products
      prisma.product.count(),

      // Total categories
      prisma.category.count(),

      // Current users
      prisma.user.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),

      // Previous users
      prisma.user.count({
        where: {
          createdAt: { gte: prevStart, lt: prevEnd },
        },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      }),

      // Top products
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
          total: true,
        },
        orderBy: {
          _sum: {
            total: "desc",
          },
        },
        take: 5,
      }),

      // Low stock products
      prisma.product.findMany({
        where: {
          stock: {
            lt: 20,
          },
        },
        take: 10,
        orderBy: {
          stock: "asc",
        },
        select: {
          id: true,
          name: true,
          stock: true,
          sku: true,
        },
      }),

      // Revenue by day
      prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ["DELIVERED", "SHIPPED"] },
        },
        select: {
          createdAt: true,
          total: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    // Calculate current revenue and orders
    const currentRevenue = currentOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const currentOrderCount = currentOrders.length;

    // Calculate previous revenue
    const previousRevenue = previousOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const previousOrderCount = previousOrders.length;

    // Calculate percentage changes
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const ordersChange =
      previousOrderCount > 0
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
        : 0;

    const usersChange =
      previousUsers > 0
        ? ((totalUsers - previousUsers) / previousUsers) * 100
        : 0;

    // Format orders by status
    const orderStatusMap: Record<string, number> = {};
    ordersByStatus.forEach((item) => {
      orderStatusMap[item.status] = item._count;
    });

    // Get product details for top products
    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: {
        id: true,
        name: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    const topProductsWithDetails = topProducts.map((product) => {
      const details = topProductDetails.find((p) => p.id === product.productId);
      const previousSales = 0; // Could calculate from previous period
      const currentSales = product._sum.quantity || 0;
      const trend =
        previousSales > 0
          ? ((currentSales - previousSales) / previousSales) * 100
          : 0;

      return {
        id: product.productId,
        name: details?.name || "Unknown",
        image: details?.images[0]?.url || null,
        sales: product._sum.quantity || 0,
        revenue: product._sum.total || 0,
        trend: Math.round(trend * 10) / 10,
      };
    });

    // Format recent orders
    const recentOrdersFormatted = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.username || order.user.email.split("@")[0],
      customerEmail: order.user.email,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    }));

    // Group revenue by day
    const revenueChartData: Record<string, number> = {};
    revenueByDay.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      revenueChartData[date!] = (revenueChartData[date!] || 0) + order.total;
    });

    const revenueChart = Object.entries(revenueChartData).map(
      ([date, revenue]) => ({
        date,
        revenue: Math.round(revenue),
      })
    );

    res.json({
      success: true,
      message: "Admin statistics retrieved successfully",
      data: {
        overview: {
          totalRevenue: Math.round(currentRevenue),
          revenueChange: Math.round(revenueChange * 10) / 10,
          totalOrders: currentOrderCount,
          ordersChange: Math.round(ordersChange * 10) / 10,
          totalProducts,
          productsChange: 0, // Could calculate from previous period
          totalUsers,
          usersChange: Math.round(usersChange * 10) / 10,
          totalCategories,
        },
        ordersByStatus: {
          PENDING: orderStatusMap.PENDING || 0,
          PROCESSING: orderStatusMap.PROCESSING || 0,
          SHIPPED: orderStatusMap.SHIPPED || 0,
          DELIVERED: orderStatusMap.DELIVERED || 0,
          CANCELLED: orderStatusMap.CANCELLED || 0,
          REFUNDED: orderStatusMap.REFUNDED || 0,
        },
        topProducts: topProductsWithDetails,
        recentOrders: recentOrdersFormatted,
        lowStockProducts,
        revenueChart,
      },
    });
  })
);

export default router;