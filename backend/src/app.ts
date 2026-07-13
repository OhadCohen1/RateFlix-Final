// Side-effect import: under ESM all imports are evaluated in order, so this
// loads .env before any module (e.g. cloudinary) reads process.env
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import connectDB, { gracefulShutdown } from './utils/db.services.ts';
import { logger } from './middlewares/logger.ts';
import { notFound, errorHandler } from './middlewares/errorHandler.ts';
import apiRouter from './router.ts';

const app = express();

// Allow browser clients (Vite dev server, Expo web) to call the API
app.use(cors());

// Body parser + request logging
app.use(express.json());
app.use(logger);

// Health check
app.get('/', (_req, res) => {
  res.json({ message: 'RateFlix API is running' });
});

// All feature routers are aggregated in router.ts
app.use('/api', apiRouter);

// 404 handler + global error handler (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ?? 5000;

// Start the server, then connect to the DB (course app.ts convention)
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(
      `Server running in ${process.env.NODE_ENV ?? 'development'} mode on http://localhost:${PORT}/`
    );
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error);
    process.exit(1);
  }
});

// Close the DB connection cleanly on process termination signals
process.on('SIGINT', () => void gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM')); // hosting/docker stop
