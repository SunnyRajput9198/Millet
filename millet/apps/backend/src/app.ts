import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config';
import { errorMiddleware } from './middleware/errormiddleware';
import apiRouter from './routes';

const app = express();

// Core Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// API Routes
app.use('/api/v1', apiRouter);

// Health Check Route
app.get('/health', (_req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy" });
});

// Central Error Handling Middleware
app.use(errorMiddleware);

export { app };