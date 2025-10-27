import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@repo/db";
import { protect, admin } from "../../middleware/authmiddleware"; // ← Add this import
const router = Router({ mergeParams: true });

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const variantSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.any()).optional()
});

// POST /api/v1/products/:productId/variants
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const productId = req.params.productId;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const validated = variantSchema.parse(req.body);

    const variantData: any = {
      product: { connect: { id: productId } },
    };

    if (validated.name !== undefined) variantData.name = validated.name;
    if (validated.sku !== undefined) variantData.sku = validated.sku;
    if (validated.price !== undefined) variantData.price = validated.price;
    if (validated.stock !== undefined) variantData.stock = validated.stock;
    if (validated.attributes !== undefined) variantData.attributes = validated.attributes;

    const variant = await prisma.productVariant.create({ data: variantData });

    res.status(201).json({
      success: true,
      message: "Variant added successfully",
      data: variant,
    });
  })
);

// PATCH /api/v1/products/:productId/variants/:variantId
router.patch(
  "/:variantId",

  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    if (!variantId) {
      return res.status(400).json({ success: false, message: "Variant ID is required" });
    }

    const validated = variantSchema.partial().parse(req.body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.sku !== undefined) updateData.sku = validated.sku;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.stock !== undefined) updateData.stock = validated.stock;
    if (validated.attributes !== undefined) updateData.attributes = validated.attributes;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Variant updated successfully",
      data: variant,
    });
  })
);

// DELETE /api/v1/products/:productId/variants/:variantId
router.delete(
  "/:variantId",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    if (!variantId) {
      return res.status(400).json({ success: false, message: "Variant ID is required" });
    }

    await prisma.productVariant.delete({ where: { id: variantId } });

    res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  })
);

export default router;