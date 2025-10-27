import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

/**
 * PUBLIC ROUTES
 */

// POST /api/v1/coupons/validate - Validate a coupon code
router.post(
  "/validate",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { code, cartTotal } = req.body;

    if (!code?.trim()) {
      throw new ApiError(400, "Coupon code is required");
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new ApiError(404, "Invalid coupon code");
    }

    // Validate coupon
    const now = new Date();
    const errors: string[] = [];

    if (!coupon.isActive) {
      errors.push("Coupon is no longer active");
    }

    if (coupon.validFrom > now) {
      errors.push("Coupon is not yet valid");
    }

    if (coupon.validUntil < now) {
      errors.push("Coupon has expired");
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      errors.push("Coupon usage limit reached");
    }

    if (cartTotal && coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      errors.push(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = cartTotal ? (cartTotal * coupon.value) / 100 : 0;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === "FIXED") {
      discount = coupon.value;
    }

    res.json({
      success: true,
      message: "Coupon is valid",
      data: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        discount,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
      },
    });
  })
);

/**
 * ADMIN ROUTES
 */

// GET /api/v1/coupons - Get all coupons (Admin)
router.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, type } = req.query;

    const where: any = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (type) {
      where.type = type;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Coupons retrieved successfully",
      data: coupons,
    });
  })
);

// GET /api/v1/coupons/:id - Get single coupon (Admin)
router.get(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Coupon ID is required");
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    res.json({
      success: true,
      message: "Coupon retrieved successfully",
      data: coupon,
    });
  })
);

// POST /api/v1/coupons - Create coupon (Admin)
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      userLimit,
      validFrom,
      validUntil,
      applicableProducts,
      applicableCategories,
      excludedProducts,
    } = req.body;

    // Validation
    if (!code?.trim()) {
      throw new ApiError(400, "Coupon code is required");
    }

    if (!type) {
      throw new ApiError(400, "Coupon type is required");
    }

    if (!["PERCENTAGE", "FIXED"].includes(type)) {
      throw new ApiError(400, "Coupon type must be PERCENTAGE or FIXED");
    }

    if (!value || value <= 0) {
      throw new ApiError(400, "Coupon value must be greater than 0");
    }

    if (type === "PERCENTAGE" && value > 100) {
      throw new ApiError(400, "Percentage value cannot exceed 100");
    }

    if (!validFrom) {
      throw new ApiError(400, "Valid from date is required");
    }

    if (!validUntil) {
      throw new ApiError(400, "Valid until date is required");
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      throw new ApiError(400, "Coupon code already exists");
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description?.trim() || null,
        type,
        value,
        minOrderAmount: minOrderAmount || null,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        userLimit: userLimit || null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicableProducts: applicableProducts || [],
        applicableCategories: applicableCategories || [],
        excludedProducts: excludedProducts || [],
      },
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  })
);

// PATCH /api/v1/coupons/:id - Update coupon (Admin)
router.patch(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      userLimit,
      validFrom,
      validUntil,
      isActive,
      applicableProducts,
      applicableCategories,
      excludedProducts,
    } = req.body;

    if (!id) {
      throw new ApiError(400, "Coupon ID is required");
    }

    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, "Coupon not found");
    }

    const updateData: any = {};

    if (code !== undefined) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (codeExists && codeExists.id !== id) {
        throw new ApiError(400, "Coupon code already exists");
      }

      updateData.code = code.toUpperCase();
    }

    if (description !== undefined) updateData.description = description?.trim() || null;
    if (type !== undefined) {
      if (!["PERCENTAGE", "FIXED"].includes(type)) {
        throw new ApiError(400, "Invalid coupon type");
      }
      updateData.type = type;
    }
    if (value !== undefined) {
      if (value <= 0) {
        throw new ApiError(400, "Value must be greater than 0");
      }
      if (type === "PERCENTAGE" && value > 100) {
        throw new ApiError(400, "Percentage cannot exceed 100");
      }
      updateData.value = value;
    }
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount || null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount || null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit || null;
    if (userLimit !== undefined) updateData.userLimit = userLimit || null;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (applicableProducts !== undefined) updateData.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) updateData.applicableCategories = applicableCategories;
    if (excludedProducts !== undefined) updateData.excludedProducts = excludedProducts;

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: updated,
    });
  })
);

// DELETE /api/v1/coupons/:id - Delete coupon (Admin)
router.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Coupon ID is required");
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    await prisma.coupon.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  })
);

export default router;