import * as reviewService from '../services/review.service.js';

export const submitReview = async (req, res) => {
  try {
    const customerId = req.user._id;
    const review = await reviewService.createOrUpdateReview(customerId, req.body);
    return res.status(200).json({ message: 'Review submitted successfully', data: review });
  } catch (error) {
    console.log('Error in submitReview controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to submit review' });
  }
};

export const checkReview = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { shopId, barberId } = req.query;
    const existing = await reviewService.checkExistingReview(customerId, shopId, barberId);
    return res.status(200).json({ hasReviewed: !!existing, data: existing });
  } catch (error) {
    console.log('Error in checkReview controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const customerId = req.user._id;
    const reviews = await reviewService.getCustomerReviews(customerId);
    return res.status(200).json({ data: reviews });
  } catch (error) {
    console.log('Error in getMyReviews controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page, limit, barberId, star } = req.query;
    const result = await reviewService.getShopReviews(shopId, { page, limit, barberId, star });
    return res.status(200).json({ 
      message: 'Reviews retrieved successfully',
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error) {
    console.log('Error in getShopReviews controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getBarberReviews = async (req, res) => {
  try {
    const { barberId } = req.params;
    const reviews = await reviewService.getBarberReviews(barberId);
    return res.status(200).json({ data: reviews });
  } catch (error) {
    console.log('Error in getBarberReviews controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getMyBarberReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await reviewService.getMyBarberReviews(userId);
    return res.status(200).json({ data: result });
  } catch (error) {
    console.log('Error in getMyBarberReviews controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};
