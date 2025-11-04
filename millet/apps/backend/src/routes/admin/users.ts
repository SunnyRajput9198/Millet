import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/admin/users - Get all users with pagination
router.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "10",
      search,
      role,
      isActive,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: "insensitive" } },
        { username: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Get users with order statistics
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: order === "asc" ? "asc" : "desc",
        },
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get total spent for each user
    const userIds = users.map((u) => u.id);
    const orderTotals = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        status: "DELIVERED",
      },
      _sum: {
        total: true,
      },
    });

    const usersWithStats = users.map((user) => {
      const orderTotal = orderTotals.find((o) => o.userId === user.id);
      return {
        ...user,
        totalOrders: user._count.orders,
        totalSpent: orderTotal?._sum.total || 0,
      };
    });

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users: usersWithStats,
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

// GET /api/v1/admin/users/:id - Get user details
router.get(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "User ID is required");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatarUrl: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        addresses: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Get total spent
    const orderStats = await prisma.order.aggregate({
      where: {
        userId: id,
        status: "DELIVERED",
      },
      _sum: {
        total: true,
      },
      _avg: {
        total: true,
      },
    });

    res.json({
      success: true,
      message: "User details retrieved successfully",
      data: {
        ...user,
        stats: {
          totalOrders: user._count.orders,
          totalSpent: orderStats._sum.total || 0,
          averageOrderValue: orderStats._avg.total || 0,
          totalReviews: user._count.reviews,
          wishlistItems: user._count.wishlist,
        },
      },
    });
  })
);

// PATCH /api/v1/admin/users/:id/role - Update user role
router.patch(
  "/:id/role",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
      throw new ApiError(400, "User ID is required");
    }

    if (!role) {
      throw new ApiError(400, "Role is required");
    }

    const validRoles = ["USER", "ADMIN"];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  })
);

// PATCH /api/v1/admin/users/:id/status - Activate/Deactivate user
router.patch(
  "/:id/status",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id) {
      throw new ApiError(400, "User ID is required");
    }

    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be a boolean");
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: updatedUser,
    });
  })
);

// DELETE /api/v1/admin/users/:id - Delete user
router.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "User ID is required");
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Prevent deleting yourself
    if (id === req.user?.id) {
      throw new ApiError(400, "You cannot delete your own account");
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  })
);

export default router;