import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../utils/constants.js';

const router = Router();

router.post('/shops/:shopId/services', authenticate, authorize(UserRole.SHOP_OWNER), serviceController.addService);
router.get('/shops/:shopId/services', serviceController.getShopServices);
router.patch('/services/:id', authenticate, authorize(UserRole.SHOP_OWNER), serviceController.updateService);
router.delete('/services/:id', authenticate, authorize(UserRole.SHOP_OWNER), serviceController.deleteService);

export default router;
