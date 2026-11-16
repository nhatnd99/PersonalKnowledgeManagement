import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as userController from './user.controller.js';

const router = Router();

// Allow both /profile (legacy) and /me (standard)
router.get(['/profile', '/me'], requireAuth, userController.getProfileHandler);
router.patch(['/profile', '/me'], requireAuth, userController.updateProfileHandler);

export default router;
