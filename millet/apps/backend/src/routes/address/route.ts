import { Router, Request, Response } from "express";
import { Prisma, prisma } from "@repo/db";
import { protect } from "../../middleware/authmiddleware";
import { asyncHandler, ApiError } from "../../utils/Api";

const router = Router();

// GET /api/v1/addresses - Get all addresses for authenticated user
router.get(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      success: true,
      message: "Addresses retrieved successfully",
      data: addresses,
    });
  })
);

// POST /api/v1/addresses - Create new address
router.post(
  "/",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      isDefault,
      type,
    } = req.body;

    // Validation
    if (!name?.trim()) throw new ApiError(400, "Name is required");
    if (!phone?.trim()) throw new ApiError(400, "Phone is required");
    if (!addressLine1?.trim()) throw new ApiError(400, "Address is required");
    if (!city?.trim()) throw new ApiError(400, "City is required");
    if (!state?.trim()) throw new ApiError(400, "State is required");
    if (!country?.trim()) throw new ApiError(400, "Country is required");
    if (!postalCode?.trim()) throw new ApiError(400, "Postal code is required");

    // If setting as default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
        isDefault: isDefault || false,
        type: type || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  })
);

// PATCH /api/v1/addresses/:id - Update address
router.patch(
  "/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
    if (!id) {
      throw new ApiError(400, "Address ID is required");
    }
    // Check if address exists and belongs to user
    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new ApiError(404, "Address not found");
    }

    const { isDefault, ...otherFields } = req.body;

    // If setting as default, unset others
    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
        if (!id) {
      throw new ApiError(400, "Address ID is required");
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...otherFields,
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
      },
    });

    res.json({
      success: true,
      message: "Address updated successfully",
      data: updated,
    });
  })
);

// DELETE /api/v1/addresses/:id - Delete address
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
    if (!id) {
      throw new ApiError(400, "Address ID is required");
    }
    const address = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }
    if (!id) {
      throw new ApiError(400, "Address ID is required");
    }
    await prisma.address.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  })
);

export default router;