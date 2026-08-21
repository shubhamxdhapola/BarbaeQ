import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as reviewController from '../controllers/review.controller.js';

const router = Router();

// Public routes for reading reviews
router.get('/shop/:shopId', reviewController.getShopReviews);
router.get('/barber/:barberId', reviewController.getBarberReviews);

// Protected routes for submitting and managing reviews
router.use(authenticate);
router.post('/', reviewController.submitReview);
router.get('/check', reviewController.checkReview);
router.get('/my', reviewController.getMyReviews);
router.get('/my-barber', reviewController.getMyBarberReviews);

export default router;
