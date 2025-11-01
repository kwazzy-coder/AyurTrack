import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { getTraceability } from '../controllers/traceabilityController.js';

const router = Router();

router.get('/:batchId', auth, getTraceability);

export default router;
