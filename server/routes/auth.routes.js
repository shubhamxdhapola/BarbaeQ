import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/select-role', authController.selectRole);
router.post('/switch-role', authenticate, authController.switchRole);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/profile', authenticate, uploadAvatar, authController.updateProfile);
router.post('/avatar', authenticate, uploadAvatar, authController.updateProfile);
router.post('/change-password', authenticate, authController.updatePassword);
router.patch('/change-password', authenticate, authController.updatePassword);

export default router;
