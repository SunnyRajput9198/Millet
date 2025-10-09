import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('8000'),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default('*'),
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('1d'),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
});

// This will throw an error if any required env var is missing
export const env = envSchema.parse(process.env);