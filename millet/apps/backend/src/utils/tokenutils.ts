import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config';

/**
 * Generates a JWT access token.
 * @param userId - The ID of the user to sign the token for.
 * @returns The generated access token.
 */
export const generateAccessToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY as any,
  };
  
  return jwt.sign({ id: userId }, env.JWT_ACCESS_TOKEN_SECRET, options);
};

/**
 * Generates a JWT refresh token.
 * @param userId - The ID of the user to sign the token for.
 * @returns The generated refresh token.
 */
export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_TOKEN_EXPIRY as any,
  };
  
  return jwt.sign({ id: userId }, env.JWT_REFRESH_TOKEN_SECRET, options);
};