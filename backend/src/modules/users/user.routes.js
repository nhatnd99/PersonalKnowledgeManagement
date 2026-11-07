import { Router } from 'express';
import * as userController from './user.controller.js';

const router = Router();

/**
 * User routes mounted at /api/v1/user
 */
router.get('/profile', userController.getProfileHandler);
router.patch('/profile', userController.updateProfileHandler);

export default router;
