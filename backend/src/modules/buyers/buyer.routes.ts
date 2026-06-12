import { Router } from 'express';
import * as buyerController from './buyer.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createBuyerSchema,
  updateBuyerSchema,
  listBuyersQuerySchema,
} from './buyer.schema';

const router = Router();

// All buyer routes require authentication
router.use(authMiddleware);

// GET /api/buyers
router.get(
  '/',
  validate(listBuyersQuerySchema),
  buyerController.list
);

// GET /api/buyers/:id
router.get('/:id', buyerController.getById);

// GET /api/buyers/:id/quotes
router.get('/:id/quotes', buyerController.getQuotes);

// POST /api/buyers
router.post(
  '/',
  requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'),
  validate(createBuyerSchema),
  buyerController.create
);

// PUT /api/buyers/:id
router.put(
  '/:id',
  requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'),
  validate(updateBuyerSchema),
  buyerController.update
);

// DELETE /api/buyers/:id (soft delete)
router.delete(
  '/:id',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  buyerController.softDelete
);

export default router;
