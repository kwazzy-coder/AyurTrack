import { Router } from 'express';
import { auth, allowRoles } from '../middleware/authMiddleware.js';
import { viewBatches } from '../controllers/manufacturerController.js';

const router = Router();

router.get('/viewBatches', auth, allowRoles('manufacturer'), viewBatches);

export default router;
