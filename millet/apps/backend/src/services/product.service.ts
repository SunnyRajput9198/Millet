import {prisma} from '@repo/db/src/index';
import { ApiError } from '../utils/Api';
import ApiFeatures from '../utils/apiFeaturesutils'; // ✅ Import utility

export const fetchAllProducts = async (queryParams: any) => {
  const features = new ApiFeatures(prisma.product, queryParams)
    .filter()
    .sort()
    .paginate()
    .limitFields();

  const products = await features.execute();
  return products;
};

export const fetchProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: true,
      variants: true,
      reviews: {
        include: { user: { select: { username: true, avatarUrl: true } } },
      },
      category: true,
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};