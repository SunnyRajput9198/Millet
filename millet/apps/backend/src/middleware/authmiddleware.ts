import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/Api';
import { ApiError } from '../utils/Api';
import { prisma } from '@repo/db';
import { env } from '../config/index.js';

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized: No token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }, // Select only non-sensitive data
    });

    if (!user) {
      throw new ApiError(401, 'Unauthorized: Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Unauthorized: Invalid token');
  }
});

// You would also define an `admin` middleware for RBAC
export const admin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        throw new ApiError(403, 'Forbidden: Access denied');
    }
    next();
});