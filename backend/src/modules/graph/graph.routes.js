import { Router } from 'express';
import * as graphController from './graph.controller.js';
import { getGraphValidation } from './graph.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';

const router = Router();

/**
 * Knowledge Graph routes mounted at /api/v1/graph
 */
router.get(
  '/',
  getGraphValidation,
  validateRequest,
  graphController.getGraphHandler
);

export default router;
