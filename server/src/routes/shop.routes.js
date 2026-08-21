import { Router } from 'express';
import * as shopController from '../controllers/shop.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { uploadDocuments, uploadShopPhotos } from '../middlewares/upload.js';
import { UserRole } from '../utils/constants.js';
import * as appointmentController from '../controllers/appointment.controller.js';

const router = Router();

router.post('/', authenticate, authorize(UserRole.SHOP_OWNER), uploadDocuments, shopController.createShop);
router.get('/', shopController.getShops);
router.get('/my', authenticate, authorize(UserRole.SHOP_OWNER), shopController.getMyShop);
router.get('/my-shop', authenticate, authorize(UserRole.SHOP_OWNER), shopController.getMyShop);
router.post('/photos', authenticate, authorize(UserRole.SHOP_OWNER), uploadShopPhotos, shopController.uploadShopPhotos);
router.delete('/photos', authenticate, authorize(UserRole.SHOP_OWNER), shopController.deleteShopPhoto);
router.get('/:id', shopController.getShopById);
router.patch('/:id', authenticate, authorize(UserRole.SHOP_OWNER), shopController.updateShop);

router.get('/:shopId/queue', appointmentController.getShopQueue);
router.get('/:shopId/appointments', authenticate, authorize(UserRole.SHOP_OWNER), appointmentController.getShopAppointments);

export default router;
