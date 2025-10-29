import { Router, Request, Response } from "express";
import { prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/settings - Get all settings (optionally filter by group)
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { group } = req.query;

    const settings = await prisma.setting.findMany({
      where: group ? { group: group as string } : {},
      orderBy: { group: "asc" },
    });

    res.json({
      success: true,
      message: "Settings retrieved successfully",
      data: {
        settings,
        count: settings.length,
      },
    });
  })
);

// ⚠️ IMPORTANT: This must come BEFORE /:key route
// GET /api/v1/settings/group/:group - Get all settings by group
router.get(
  "/group/:group",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { group } = req.params;

    if (!group) {
      throw new ApiError(400, "Setting group is required");
    }

    // Validate group
    const validGroups = ["GENERAL", "PAYMENT", "SHIPPING", "EMAIL"];
    if (!validGroups.includes(group.toUpperCase())) {
      throw new ApiError(
        400,
        `Invalid group. Must be one of: ${validGroups.join(", ")}`
      );
    }

    const settings = await prisma.setting.findMany({
      where: { group: group.toUpperCase() },
      orderBy: { key: "asc" },
    });

    res.json({
      success: true,
      message: `${group} settings retrieved successfully`,
      data: {
        settings,
        count: settings.length,
      },
    });
  })
);

// GET /api/v1/settings/:key - Get setting by key
router.get(
  "/:key",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;

    if (!key) {
      throw new ApiError(400, "Setting key is required");
    }

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new ApiError(404, "Setting not found");
    }

    res.json({
      success: true,
      message: "Setting retrieved successfully",
      data: setting,
    });
  })
);

// POST /api/v1/settings - Create a new setting
router.post(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { key, value, group } = req.body;

    if (!key) {
      throw new ApiError(400, "Setting key is required");
    }

    if (!value) {
      throw new ApiError(400, "Setting value is required");
    }

    if (!group) {
      throw new ApiError(400, "Setting group is required");
    }

    // Validate group value
    const validGroups = ["GENERAL", "PAYMENT", "SHIPPING", "EMAIL"];
    if (!validGroups.includes(group)) {
      throw new ApiError(
        400,
        `Invalid group. Must be one of: ${validGroups.join(", ")}`
      );
    }

    // Check if setting with this key already exists
    const existing = await prisma.setting.findUnique({
      where: { key },
    });

    if (existing) {
      throw new ApiError(400, "Setting with this key already exists");
    }

    // Create setting
    const setting = await prisma.setting.create({
      data: {
        key,
        value,
        group,
      },
    });

    res.status(201).json({
      success: true,
      message: "Setting created successfully",
      data: setting,
    });
  })
);

// PUT /api/v1/settings/:key - Update setting by key
router.put(
  "/:key",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value, group } = req.body;

    if (!key) {
      throw new ApiError(400, "Setting key is required");
    }

    // Check if setting exists
    const existing = await prisma.setting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new ApiError(404, "Setting not found");
    }

    // Validate group if provided
    if (group) {
      const validGroups = ["GENERAL", "PAYMENT", "SHIPPING", "EMAIL"];
      if (!validGroups.includes(group)) {
        throw new ApiError(
          400,
          `Invalid group. Must be one of: ${validGroups.join(", ")}`
        );
      }
    }

    // Update setting
    const setting = await prisma.setting.update({
      where: { key },
      data: {
        ...(value !== undefined && { value }),
        ...(group && { group }),
      },
    });

    res.json({
      success: true,
      message: "Setting updated successfully",
      data: setting,
    });
  })
);

// DELETE /api/v1/settings/:key - Delete setting by key
router.delete(
  "/:key",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;

    if (!key) {
      throw new ApiError(400, "Setting key is required");
    }

    // Check if setting exists
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new ApiError(404, "Setting not found");
    }

    await prisma.setting.delete({
      where: { key },
    });

    res.json({
      success: true,
      message: "Setting deleted successfully",
    });
  })
);

export default router;