import { z } from 'zod';

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    username: z.string().optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

// ============================================
// CART VALIDATION SCHEMAS
// ============================================

export const cartItemSchema = z.object({
  body: z.object({
    productId: z.string().cuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const cartItemIdSchema = z.object({
  params: z.object({
    itemId: z.string().cuid('Invalid cart item ID'),
  }),
});

// ============================================
// ADDRESS VALIDATION SCHEMAS
// ============================================

export const addressSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    addressLine1: z.string().min(1, 'Address Line 1 is required'),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal Code is required'),
    isDefault: z.boolean().optional().default(false),
    type: z.enum(['HOME', 'OFFICE', 'OTHER']).optional().default('HOME'),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid address ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    addressLine1: z.string().min(1, 'Address Line 1 is required').optional(),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(1, 'City is required').optional(),
    state: z.string().min(1, 'State is required').optional(),
    country: z.string().min(1, 'Country is required').optional(),
    postalCode: z.string().min(1, 'Postal Code is required').optional(),
    isDefault: z.boolean().optional(),
    type: z.enum(['HOME', 'OFFICE', 'OTHER']).optional(),
  }),
});

export const addressIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid address ID'),
  }),
});

// ============================================
// PRODUCT VALIDATION SCHEMAS (Optional - agar chahiye to)
// ============================================

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().positive('Price must be positive'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    category: z.string().optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    featured: z.boolean().optional().default(false),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Product name is required').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    price: z.number().positive('Price must be positive').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    category: z.string().optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    featured: z.boolean().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid product ID'),
  }),
});

// ============================================
// ORDER VALIDATION SCHEMAS (Optional - agar chahiye to)
// ============================================

export const createOrderSchema = z.object({
  body: z.object({
    addressId: z.string().cuid('Invalid address ID'),
    paymentMethod: z.enum(['CARD', 'UPI', 'COD', 'WALLET']),
    items: z.array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    ).min(1, 'At least one item is required'),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
});
