import { Router } from 'express';
import * as productController from './product.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from './product.schema';

const router = Router();

router.use(authMiddleware);

// ─── Hierarchy (read-only, all authenticated) ─────────────────────────────────
router.get('/lines', productController.getLines);
router.get('/lines/:lineId/categories', productController.getCategoriesByLine);
router.get('/categories/:categoryId/types', productController.getTypesByCategory);
router.get('/search', productController.search);

// ─── Products CRUD ────────────────────────────────────────────────────────────
router.get('/', validate(listProductsQuerySchema), productController.list);
router.get('/:id', productController.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(createProductSchema),
  productController.create
);

router.put(
  '/:id',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(updateProductSchema),
  productController.update
);

export default router;
