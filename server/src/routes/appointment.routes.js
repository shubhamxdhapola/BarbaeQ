import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../utils/constants.js';
import * as appointmentController from '../controllers/appointment.controller.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.CUSTOMER),
  appointmentController.bookAppointment
);

router.get(
  '/my',
  authorize(UserRole.CUSTOMER),
  appointmentController.getMyAppointments
);

router.get(
  '/:id',
  appointmentController.getAppointmentById
);

router.patch(
  '/:id/cancel',
  authorize(UserRole.CUSTOMER),
  appointmentController.cancelAppointment
);

router.post(
  '/:id/approve',
  authorize(UserRole.BARBER, UserRole.SHOP_OWNER),
  appointmentController.approveAppointment
);

router.post(
  '/:id/reject',
  authorize(UserRole.BARBER, UserRole.SHOP_OWNER),
  appointmentController.rejectAppointment
);

export default router;
