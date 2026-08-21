import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

// Shop approval management — ADMIN only (Manager feature commented out)
router.get('/shops/pending', authorize(UserRole.ADMIN), adminController.getPendingShops);
router.get('/shops/approved', authorize(UserRole.ADMIN), adminController.getApprovedShops);
router.get('/shops/rejected', authorize(UserRole.ADMIN), adminController.getRejectedShops);
router.get('/shops/:id/details', authorize(UserRole.ADMIN), adminController.getShopDetails);
router.post('/shops/:id/approve', authorize(UserRole.ADMIN), adminController.approveShop);
router.post('/shops/:id/reject', authorize(UserRole.ADMIN), adminController.rejectShop);

// Deactivate/Activate and Delete shop — ADMIN only
router.patch('/shops/:id/status', authorize(UserRole.ADMIN), adminController.toggleShopActive);
router.delete('/shops/:id', authorize(UserRole.ADMIN), adminController.deleteShop);

/*
// Manager management — ADMIN only [COMMENTED OUT]
router.get('/managers', authorize(UserRole.ADMIN), adminController.getManagers);
router.post('/managers', authorize(UserRole.ADMIN), adminController.createManager);
router.put('/managers/:id', authorize(UserRole.ADMIN), adminController.updateManager);
router.patch('/managers/:id/status', authorize(UserRole.ADMIN), adminController.toggleManagerStatus);
router.delete('/managers/:id', authorize(UserRole.ADMIN), adminController.deleteManager);
*/

export default router;
