import { Request, Response, NextFunction } from 'express';

type Role = 'ADMIN' | 'TRADE_MANAGER' | 'SALES' | 'FINANCE' | 'OPERATIONS';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
