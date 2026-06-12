import { Router } from 'express';
import * as supplierController from './supplier.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSupplierSchema, updateSupplierSchema, listSuppliersQuerySchema } from './supplier.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(listSuppliersQuerySchema), supplierController.list);
router.get('/:id', supplierController.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(createSupplierSchema),
  supplierController.create
);

router.put(
  '/:id',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(updateSupplierSchema),
  supplierController.update
);

router.delete('/:id', requireRole('ADMIN', 'TRADE_MANAGER'), supplierController.softDelete);

export default router;
