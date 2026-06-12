import { Router } from 'express';
import * as masterController from './master.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createCurrencyRateSchema,
  createFreightTemplateSchema,
  upsertPortChargeSchema,
} from './master.schema';

const router = Router();

router.use(authMiddleware);

// Static reference data (all authenticated)
router.get('/static', masterController.getStaticData);

// Currency rates
router.get('/currencies', masterController.getCurrencyRates);
router.post(
  '/currencies',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(createCurrencyRateSchema),
  masterController.createCurrencyRate
);

// Freight templates
router.get('/freight-templates', masterController.getFreightTemplates);
router.post(
  '/freight-templates',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(createFreightTemplateSchema),
  masterController.createFreightTemplate
);

// Port charges
router.get('/port-charges', masterController.getPortCharges);
router.post(
  '/port-charges',
  requireRole('ADMIN', 'TRADE_MANAGER'),
  validate(upsertPortChargeSchema),
  masterController.upsertPortCharge
);

export default router;
