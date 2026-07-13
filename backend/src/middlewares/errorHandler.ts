import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { buildErrorResponse } from '../utils/response.builder.ts';

/**
 * Typed application error that carries its own HTTP status code.
 * Controllers throw it (sync or async) and the global handler formats it.
 */
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Catches requests to routes that do not exist and forwards a 404 error
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

/**
 * Centralized global error handler. Express 5 forwards rejected promises from
 * async controllers here automatically, so both sync and async errors land
 * in this single place and return a consistent JSON shape.
 */
const extractMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  // Some SDKs (e.g. cloudinary) reject with plain objects that carry a message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Internal Server Error';
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = extractMessage(err);

  // Server-side visibility for unexpected errors (expected ApiErrors stay quiet)
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json(buildErrorResponse(message));
};
