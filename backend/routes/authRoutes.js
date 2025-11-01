import { Router } from 'express';
import { register, login, validateLogin, validateRegister, listLabs } from '../controllers/authController.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/labs', listLabs);

export default router;
