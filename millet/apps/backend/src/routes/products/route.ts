import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@repo/db";
import imageRouter from "./image";
import variantRouter from "./varient";
import { protect, admin } from "../../middleware/authmiddleware"; // ← Add this import
const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const transformProductForFrontend = (product: any) => {
  if (!product) return null;
  const primaryImage =
    product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

  const rating = product.reviews?.length > 0
    ? product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / product.reviews.length
    : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: `₹${Math.round(product.price)}`,
    comparePrice: product.comparePrice
      ? `₹${Math.round(product.comparePrice)}`
      : undefined,
    image: primaryImage ? primaryImage.url : "/placeholder.svg",
    rating: Math.round(rating * 10) / 10,
    reviews: product.reviews?.length || 0,
    category: product.category?.name ?? "Uncategorized",
    tags: product.tags,
    inStock: product.stock > 0,
    sku: product.sku,
  };
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  comparePrice: z.number().positive("Compare price must be positive").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial();

// GET /api/v1/products/search?q=term
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const query = req.query.q?.toString().trim();

    if (!query)
      return res.status(400).json({ success: false, message: "Missing search query" });

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: [query] } },
        ],
      },
      include: { 
        images: { orderBy: { order: "asc" } },
        category: true,
        reviews: true,
      },
    });

    res.json({
      success: true,
      message: "Search results fetched successfully",
      data: products.map(transformProductForFrontend),
    });
  })
);

// GET /api/v1/products/category/:slug
router.get(
  "/category/:slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
   if (!slug) {
      return res.status(400).json({ success: false, message: "Category slug is required" });
    }
    const products = await prisma.product.findMany({
      where: { 
        category: { slug: slug }
      },
      include: { 
        images: { orderBy: { order: "asc" } },
        category: true,
        reviews: true,
      },
    });

    if (products.length === 0)
      return res.status(404).json({ success: false, message: "No products found in this category" });

    res.json({
      success: true,
      message: "Category products fetched successfully",
      data: products.map(transformProductForFrontend),
    });
  })
);

// GET /api/v1/products
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, minPrice, maxPrice, tag } = req.query;

    const where: any = {};

    if (category) {
      where.category = { slug: category.toString() };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice.toString());
      if (maxPrice) where.price.lte = parseFloat(maxPrice.toString());
    }
    if (tag) {
      where.tags = { has: tag.toString() };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Products retrieved successfully",
      data: products.map(transformProductForFrontend),
    });
  })
);

// POST /api/v1/products
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const validated = createProductSchema.parse(req.body);
    const slug = generateSlug(validated.name);

    const productData: any = {
      name: validated.name,
      slug,
    };

    if (validated.description !== undefined) productData.description = validated.description;
    if (validated.price !== undefined) productData.price = validated.price;
    if (validated.comparePrice !== undefined) productData.comparePrice = validated.comparePrice;
    if (validated.stock !== undefined) productData.stock = validated.stock;
    if (validated.sku !== undefined) productData.sku = validated.sku;
    if (validated.tags !== undefined) productData.tags = validated.tags;
    
    if (validated.categoryId) {
      productData.category = {
        connect: { id: validated.categoryId }
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: { images: true, category: true, reviews: true },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: transformProductForFrontend(product),
    });
  })
);

// GET /api/v1/products/:slug
router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;

    if (!slug) {
      return res.status(400).json({ success: false, message: "Slug is required" });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        reviews: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
        },
        variants: true,
      },
    });

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({
      success: true,
      message: "Product fetched successfully",
      data: {
        ...transformProductForFrontend(product),
        fullDetails: {
          description: product.description,
          images: product.images,
          category: product.category,
          variants: product.variants,
          reviews: product.reviews,
          stock: product.stock,
          sku: product.sku,
          tags: product.tags,
        },
      },
    });
  })
);

// PATCH /api/v1/products/:id
router.patch(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const validated = updateProductSchema.parse(req.body);

    const updateData: any = {};

    if (validated.name !== undefined) {
      updateData.name = validated.name;
      updateData.slug = generateSlug(validated.name);
    }
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.comparePrice !== undefined) updateData.comparePrice = validated.comparePrice;
    if (validated.stock !== undefined) updateData.stock = validated.stock;
    if (validated.sku !== undefined) updateData.sku = validated.sku;
    if (validated.tags !== undefined) updateData.tags = validated.tags;
    
    if (validated.categoryId !== undefined) {
      if (validated.categoryId) {
        updateData.category = {
          connect: { id: validated.categoryId }
        };
      } else {
        updateData.category = {
          disconnect: true
        };
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true, category: true, reviews: true },
    });

    res.json({
      success: true,
      message: "Product updated successfully",
      data: transformProductForFrontend(product),
    });
  })
);

// DELETE /api/v1/products/:id
router.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  })
);

router.use("/:productId/images", imageRouter);
router.use("/:productId/variants", variantRouter);

export default router;