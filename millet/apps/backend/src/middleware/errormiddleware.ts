import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/Api';
import { ZodError } from 'zod';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log all errors with details
  console.error('=== ERROR CAUGHT ===');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Request Path:', req.path);
  console.error('Request Method:', req.method);
  console.error('Request Body:', JSON.stringify(req.body, null, 2));
  console.error('Stack Trace:', err.stack);
  console.error('==================');

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors,
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      message: 'Database Error',
      error: err.message,
    });
  }

  // For unexpected errors
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};