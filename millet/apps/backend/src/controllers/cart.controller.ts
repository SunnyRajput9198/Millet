import { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils/Api';
import * as CartService from '../services/cart.service';
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const cart = await CartService.getUserCart(userId);
  res.status(200).json(new ApiResponse(200, cart, 'Cart retrieved successfully'));
});

export const addItemToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { productId, quantity } = req.body;
  const updatedCart = await CartService.addItem(userId, productId, quantity);
  res.status(200).json(new ApiResponse(200, updatedCart, 'Item added to cart'));
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { itemId } = req.params;
  const { quantity } = req.body;
  const updatedCart = await CartService.updateItemQuantity(userId, itemId!, quantity);
  res.status(200).json(new ApiResponse(200, updatedCart, 'Cart item updated'));
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { itemId } = req.params;
  const updatedCart = await CartService.removeItem(userId, itemId!);
  res.status(200).json(new ApiResponse(200, updatedCart, 'Item removed from cart'));
});