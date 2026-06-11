import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      issues: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma errors (duck-typed to avoid dependency on generated client)
  const prismaErr = err as { code?: string; constructor?: { name?: string } };
  if (err.constructor?.name === 'PrismaClientKnownRequestError' && prismaErr.code) {
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ error: 'Record already exists (duplicate value)' });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expired — please log in again' });
    return;
  }

  // Unknown errors
  logger.error('Unhandled error:', { message: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { message: err.message } : {}),
  });
}
