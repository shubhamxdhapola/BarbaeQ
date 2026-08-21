import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../utils/constants.js';
import * as appointmentController from '../controllers/appointment.controller.js';
import * as barberController from '../controllers/barber.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.BARBER));

router.post('/walk-in', appointmentController.createWalkIn);
router.get('/queue', appointmentController.getMyQueue);
router.get('/appointments', appointmentController.getBarberAppointments);
router.get('/profile', barberController.getMyBarberProfile);
router.patch('/availability', barberController.toggleAvailability);
router.patch('/delay', barberController.setQueueDelay);

// Support /appointments/:id/* routes
router.post('/appointments/:id/approve', appointmentController.approveAppointment);
router.post('/appointments/:id/reject', appointmentController.rejectAppointment);
router.post('/appointments/:id/start', appointmentController.startService);
router.post('/appointments/:id/complete', appointmentController.completeService);
router.post('/appointments/:id/no-show', appointmentController.markNoShow);

// Support /:id/* routes
router.post('/:id/approve', appointmentController.approveAppointment);
router.post('/:id/reject', appointmentController.rejectAppointment);
router.post('/:id/start', appointmentController.startService);
router.post('/:id/complete', appointmentController.completeService);
router.post('/:id/no-show', appointmentController.markNoShow);

export default router;
