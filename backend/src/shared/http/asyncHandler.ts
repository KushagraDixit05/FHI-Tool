import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error middleware. Removes the repetitive `try { … } catch (err) { next(err) }`
 * block from every controller (~40 occurrences across the codebase).
 *
 *   export const list = asyncHandler(async (req, res) => {
 *     res.json(await service.list(req.query));
 *   });
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
