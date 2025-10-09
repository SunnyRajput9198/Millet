import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/Api';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // For unexpected errors
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
};