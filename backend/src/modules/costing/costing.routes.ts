import { Router } from 'express';
import * as costingController from './costing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { costingInputSchema } from './costing.schema';

const router = Router();

router.use(authMiddleware);

// POST /api/costing/calculate — run calculation (no DB save, live preview)
router.post('/calculate', validate(costingInputSchema), costingController.calculate);

// POST /api/costing/container — calculate container needs
router.post('/container', costingController.containerCalc);

// GET /api/costing/incoterm-costs/:incoterm — get inclusion map
router.get('/incoterm-costs/:incoterm', costingController.getIncotermCosts);

export default router;
