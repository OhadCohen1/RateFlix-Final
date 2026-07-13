import type { Request, Response, NextFunction } from 'express';

/**
 * Request logger - prints one line per request with method, path,
 * response status and duration, e.g.:
 *   GET /api/movies -> 200 (14ms)
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
};
