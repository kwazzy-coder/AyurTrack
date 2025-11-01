import { Router } from 'express';
import { auth, allowRoles } from '../middleware/authMiddleware.js';
import { addHerb, myHerbs, validateAddHerb } from '../controllers/farmerController.js';

const router = Router();

router.post('/addHerb', auth, allowRoles('farmer'), validateAddHerb, addHerb);
router.get('/myHerbs', auth, allowRoles('farmer'), myHerbs);

export default router;
