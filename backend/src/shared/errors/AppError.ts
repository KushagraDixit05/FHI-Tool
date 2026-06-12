/**
 * Operational, HTTP-aware error. Services throw these to signal an intended
 * status code; the error middleware reads `statusCode` and responds accordingly.
 *
 * Replaces the ad-hoc `Object.assign(new Error('…'), { statusCode })` pattern,
 * whose statusCode was silently ignored by the error middleware (every such
 * error fell through to a 500).
 */
export class AppError extends Error {
  readonly statusCode: number;
  /** Marks errors we deliberately threw, so the handler can trust the message. */
  readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// ─── Factory helpers (read fluently at the call site) ─────────────────────────
export const badRequest = (message = 'Bad request') => new AppError(400, message);
export const unauthorized = (message = 'Unauthorized') => new AppError(401, message);
export const forbidden = (message = 'Access denied') => new AppError(403, message);
export const notFound = (message = 'Resource not found') => new AppError(404, message);
export const conflict = (message = 'Resource already exists') => new AppError(409, message);
