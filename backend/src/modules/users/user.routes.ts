import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateRoleSchema } from './user.schema';

const router = Router();

// All user management routes: auth + admin only
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/', userController.list);
router.post('/', validate(createUserSchema), userController.create);
router.put('/:id/role', validate(updateRoleSchema), userController.updateRole);
router.patch('/:id/toggle', userController.toggle);

export default router;
