import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { send, myRequests, updateStatus, validateSend, validateUpdateStatus, clearIncoming } from '../controllers/requestController.js';

const router = Router();

router.post('/send', auth, validateSend, send);
router.get('/mine', auth, myRequests);
router.patch('/:id/status', auth, validateUpdateStatus, updateStatus);
router.delete('/incoming', auth, clearIncoming);

export default router;
