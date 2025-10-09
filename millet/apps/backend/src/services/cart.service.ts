import {prisma} from '@repo/db/src/index';
import { ApiError } from '../utils/Api';

const getCartWithDetails = (cartId: string) => {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: { include: { images: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

const findOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
};

export const getUserCart = async (userId: string) => {
  const cart = await findOrCreateCart(userId);
  return getCartWithDetails(cart.id);
};

export const addItem = async (userId: string, productId: string, quantity: number) => {
  const cart = await findOrCreateCart(userId);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.stock < quantity) {
    throw new ApiError(400, 'Product not available or insufficient stock');
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existingItem) {
    // Update quantity if item already in cart
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Create new cart item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        price: product.price, // Store price at time of adding
      },
    });
  }

  return getCartWithDetails(cart.id);
};

export const updateItemQuantity = async (userId: string, itemId: string, quantity: number) => {
  const cart = await findOrCreateCart(userId);
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });

  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new ApiError(404, 'Cart item not found');
  }

  // Check stock
  const product = await prisma.product.findUnique({ where: { id: cartItem.productId }});
  if (!product || product.stock < quantity) {
    throw new ApiError(400, 'Insufficient stock');
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return getCartWithDetails(cart.id);
};

export const removeItem = async (userId: string, itemId: string) => {
  const cart = await findOrCreateCart(userId);
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });

  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new ApiError(404, 'Cart item not found');
  }
  
  await prisma.cartItem.delete({ where: { id: itemId } });

  return getCartWithDetails(cart.id);
};