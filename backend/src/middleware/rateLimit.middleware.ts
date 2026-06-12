import rateLimit from 'express-rate-limit';

/**
 * General API limiter — a sane ceiling against runaway clients / scraping.
 * Applied to all /api routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

/**
 * Strict limiter for auth endpoints to blunt credential-stuffing / brute force.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts — please try again later.' },
});
