import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware"; // ← Add this import

const router = Router({ mergeParams: true });

/** Async handler to simplify try/catch */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/* ------------------------------------------------------------------
   VALIDATION SCHEMAS
------------------------------------------------------------------ */

const createImageSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional().default(0),
});

const updateImageSchema = z.object({
  url: z.string().url("Must be a valid URL").optional(),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

/* ------------------------------------------------------------------
   ROUTES
------------------------------------------------------------------ */

/**
 * POST /api/v1/products/:productId/images
 * Add a new image to a product
 */
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const productId = req.params.productId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Validate request body
    const validated = createImageSchema.parse(req.body);

    // Build image data with proper relation syntax
    const imageData: any = {
      url: validated.url,
      isPrimary: validated.isPrimary,
      order: validated.order,
      product: {
        connect: { id: productId },
      },
    };

    // Add alt if provided
    if (validated.alt !== undefined) {
      imageData.alt = validated.alt;
    }

    const image = await prisma.productImage.create({
      data: imageData,
    });

    res.status(201).json({
      success: true,
      message: "Image added successfully",
      data: image,
    });
  })
);

/**
 * PATCH /api/v1/products/:productId/images/:imageId
 * Update an image
 */
router.patch(
  "/:imageId",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { productId, imageId } = req.params;

    if (!productId || !imageId) {
      return res.status(400).json({
        success: false,
        message: "Product ID and Image ID are required",
      });
    }

    // Validate request body
    const validated = updateImageSchema.parse(req.body);

    // Build update data
    const updateData: any = {};

    if (validated.url !== undefined) updateData.url = validated.url;
    if (validated.alt !== undefined) updateData.alt = validated.alt;
    if (validated.isPrimary !== undefined) updateData.isPrimary = validated.isPrimary;
    if (validated.order !== undefined) updateData.order = validated.order;

    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Image updated successfully",
      data: image,
    });
  })
);

/**
 * DELETE /api/v1/products/:productId/images/:imageId
 * Delete an image
 */
router.delete(
  "/:imageId",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { productId, imageId } = req.params;

    if (!productId || !imageId) {
      return res.status(400).json({
        success: false,
        message: "Product ID and Image ID are required",
      });
    }

    await prisma.productImage.delete({
      where: { id: imageId },
    });

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  })
);

export default router;