import { Router } from 'express';
import * as barberController from '../controllers/barber.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../utils/constants.js';

const router = Router();

router.get('/barbers/lookup-user', authenticate, authorize(UserRole.SHOP_OWNER), barberController.lookupUser);
router.post('/shops/:shopId/barbers', authenticate, authorize(UserRole.SHOP_OWNER), barberController.addBarber);
router.get('/shops/:shopId/barbers', barberController.getShopBarbers);
router.patch('/barbers/:id', authenticate, authorize(UserRole.SHOP_OWNER), barberController.updateBarber);
router.delete('/barbers/:id', authenticate, authorize(UserRole.SHOP_OWNER), barberController.deleteBarber);

export default router;
