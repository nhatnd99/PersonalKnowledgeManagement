import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import * as authController from './auth.controller.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from './auth.validation.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', registerValidation, validateRequest, authController.registerHandler);
router.post('/login', loginValidation, validateRequest, authController.loginHandler);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, authController.forgotPasswordHandler);
router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPasswordHandler);

// Protected Authentication & Session Endpoints
router.get('/me', requireAuth, authController.meHandler);
router.post('/logout', requireAuth, authController.logoutHandler);
router.post('/logout-all', requireAuth, authController.logoutAllHandler);
router.patch('/change-password', requireAuth, changePasswordValidation, validateRequest, authController.changePasswordHandler);
router.get('/sessions', requireAuth, authController.getSessionsHandler);
router.delete('/sessions/:sessionId', requireAuth, authController.revokeSessionHandler);

export default router;
