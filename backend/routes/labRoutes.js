import { Router } from 'express';
import { auth, allowRoles } from '../middleware/authMiddleware.js';
import { receiveBatch, uploadReport, validateReceiveBatch, validateUploadReport } from '../controllers/labController.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.post('/receiveBatch', auth, allowRoles('lab'), validateReceiveBatch, receiveBatch);
router.post('/uploadReport', auth, allowRoles('lab'), upload.single('report'), validateUploadReport, uploadReport);

export default router;
