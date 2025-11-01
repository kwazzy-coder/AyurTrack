import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { logTx, validateLogTx } from '../controllers/blockchainController.js';

const router = Router();

router.post('/logTransaction', auth, validateLogTx, logTx);

export default router;
