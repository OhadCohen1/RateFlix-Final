import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { buildErrorResponse } from '../utils/response.builder.ts';

// שגיאת אפליקציה עם קוד סטטוס מובנה.
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// נתיב שלא קיים -> 404.
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

const extractMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  // לפעמים מגיע אובייקט רגיל עם message במקום Error.
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Internal Server Error';
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = extractMessage(err);

  // שגיאות שרת אמיתיות נרשמות ללוג.
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json(buildErrorResponse(message));
};
