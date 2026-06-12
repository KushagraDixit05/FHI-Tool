import { Router } from 'express';
import * as quoteController from './quote.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createQuoteSchema,
  updateQuoteSchema,
  updateStatusSchema,
  listQuotesQuerySchema,
} from './quote.schema';

const router = Router();

router.use(authMiddleware);

// Stats (all authenticated)
router.get('/stats', quoteController.getStats);

// List quotes with filters
router.get('/', validate(listQuotesQuerySchema), quoteController.list);

// Get single quote
router.get('/:id', quoteController.getById);

// Create quote — Sales, Trade Manager, Admin
router.post(
  '/',
  requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'),
  validate(createQuoteSchema),
  quoteController.create
);

// Update quote (DRAFT only)
router.put(
  '/:id',
  requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'),
  validate(updateQuoteSchema),
  quoteController.update
);

// Update status
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'),
  validate(updateStatusSchema),
  quoteController.updateStatus
);

// Duplicate quote
router.post(
  '/:id/duplicate',
  requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'),
  quoteController.duplicate
);

// Delete quote (DRAFT only, Admin/TM only)
router.delete(
  '/:id',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  quoteController.remove
);

export default router;
