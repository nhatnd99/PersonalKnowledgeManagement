import { Router } from 'express';
import * as searchController from './search.controller.js';
import { searchNotesValidation } from './search.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';

const router = Router();

/**
 * Search routes mounted at /api/v1/search
 */
router.get(
  '/',
  searchNotesValidation,
  validateRequest,
  searchController.searchNotesHandler
);

export default router;
