import { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils/Api';
import { fetchAllProducts, fetchProductBySlug } from '../services/product.service';

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  // You can expand this to take query params for filtering, sorting, pagination
  const products = await fetchAllProducts(req.query);
  res.status(200).json(new ApiResponse(200, products, 'Products retrieved successfully'));
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await fetchProductBySlug(slug!);
  res.status(200).json(new ApiResponse(200, product, 'Product retrieved successfully'));
});