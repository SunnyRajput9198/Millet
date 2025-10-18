import { Router, Request, Response } from "express";
import { Prisma, prisma } from "@repo/db";
import slugify from "slugify";
import { protect, admin } from "../../middleware/authmiddleware";
import { asyncHandler } from "../../utils/Api";
import { ApiError } from "../../utils/Api";

const router = Router();

/**
 * ✅ PUBLIC ROUTES - No authentication required
 */

// GET /api/v1/categories - Get all categories
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        parent: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  })
);

// GET /api/v1/categories/:id - Get single category by ID or slug
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Category ID is required");
    }

    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        parent: true,
        children: true,
        products: { take: 10 },
      },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    res.json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  })
);

/**
 * 🔒 PROTECTED ROUTES - Authentication required (Admin only)
 */

// POST /api/v1/categories - Create new category
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, parentId, image } = req.body;

    if (!name?.trim()) {
      throw new ApiError(400, "Name is required");
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ApiError(400, "Category name already exists");
    }

    // Check if parent exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new ApiError(400, "Invalid parent category");
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        parentId: parentId || null,
        image: image || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  })
);

// PATCH /api/v1/categories/:id - Update category
router.patch(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Category ID is required");
    }

    const { name, description, parentId, image } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!existing) {
      throw new ApiError(404, "Category not found");
    }

    const updateData: Prisma.CategoryUpdateInput = {};

    if (name !== undefined) {
      if (!name.trim()) {
        throw new ApiError(400, "Name cannot be empty");
      }

      const newSlug = slugify(name, { lower: true, strict: true });

      // Check if new slug conflicts with another category
      if (newSlug !== existing.slug) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: newSlug },
        });

        if (slugExists && slugExists.id !== id) {
          throw new ApiError(400, "A category with this name already exists");
        }

        updateData.slug = newSlug;
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (image !== undefined) {
      updateData.image = image || null;
    }

    // Validate parent change
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new ApiError(400, "Category cannot be its own parent");
      }

      if (parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          throw new ApiError(400, "Invalid parent category");
        }
      }

      if (parentId) {
        updateData.parent = {
          connect: { id: parentId }, // Connect to parent
        };
      } else {
        updateData.parent = {
          disconnect: true, // Disconnect from parent
        };
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  })
);

// DELETE /api/v1/categories/:id - Delete category
router.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Category ID is required");
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    if (category.children.length > 0) {
      throw new ApiError(400, "Cannot delete category with subcategories");
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  })
);

export default router;
