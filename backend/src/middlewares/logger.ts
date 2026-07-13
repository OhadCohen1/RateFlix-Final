import type { Request, Response, NextFunction } from 'express';

// לוג קצר לכל בקשה: מתודה, נתיב, סטטוס וזמן.
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
};
