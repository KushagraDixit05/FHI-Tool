import { Request, Response } from 'express';

/**
 * Terminal handler for unmatched routes — returns a JSON 404 instead of
 * Express's default HTML page, so API clients always get a parseable error.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
