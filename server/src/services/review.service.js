import { Types } from 'mongoose';
import { Review } from '../models/Review.js';
import { Appointment } from '../models/Appointment.js';
import { Shop } from '../models/Shop.js';
import { Barber } from '../models/Barber.js';
import { AppointmentStatus } from '../utils/constants.js';

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// Recalculate average ratings for Shop and Barber
export const recalculateAverages = async (shopId, barberId) => {
  if (shopId) {
    const shopStats = await Review.aggregate([
      { $match: { shopId: new Types.ObjectId(shopId) } },
      {
        $group: {
          _id: '$shopId',
          averageRating: { $avg: '$shopRating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (shopStats.length > 0) {
      await Shop.findByIdAndUpdate(shopId, {
        averageRating: Math.round(shopStats[0].averageRating * 10) / 10,
        reviewCount: shopStats[0].reviewCount,
      });
    } else {
      await Shop.findByIdAndUpdate(shopId, { averageRating: 0, reviewCount: 0 });
    }
  }

  if (barberId) {
    const barberStats = await Review.aggregate([
      { $match: { barberId: new Types.ObjectId(barberId) } },
      {
        $group: {
          _id: '$barberId',
          averageRating: { $avg: '$barberRating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (barberStats.length > 0) {
      await Barber.findByIdAndUpdate(barberId, {
        averageRating: Math.round(barberStats[0].averageRating * 10) / 10,
        reviewCount: barberStats[0].reviewCount,
      });
    } else {
      await Barber.findByIdAndUpdate(barberId, { averageRating: 0, reviewCount: 0 });
    }
  }
};

export const createOrUpdateReview = async (customerId, data) => {
  const { shopId, barberId, appointmentId, shopRating, barberRating, comment } = data;

  if (!shopId || !barberId) {
    throw createError('Shop ID and Barber ID are required', 400);
  }

  if (!shopRating || shopRating < 1 || shopRating > 5) {
    throw createError('Shop rating must be between 1 and 5', 400);
  }

  if (!barberRating || barberRating < 1 || barberRating > 5) {
    throw createError('Barber rating must be between 1 and 5', 400);
  }

  // Verify that the customer has at least one COMPLETED appointment with this shop & barber
  const hasVisited = await Appointment.findOne({
    customerId: new Types.ObjectId(customerId),
    shopId: new Types.ObjectId(shopId),
    barberId: new Types.ObjectId(barberId),
    status: AppointmentStatus.COMPLETED,
  });

  if (!hasVisited) {
    throw createError('Only visited customers with completed services can leave a review', 403);
  }

  const review = await Review.findOneAndUpdate(
    {
      customerId: new Types.ObjectId(customerId),
      shopId: new Types.ObjectId(shopId),
      barberId: new Types.ObjectId(barberId),
    },
    {
      $set: {
        appointmentId: appointmentId ? new Types.ObjectId(appointmentId) : hasVisited._id,
        shopRating: Number(shopRating),
        barberRating: Number(barberRating),
        comment: (comment || '').trim(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Recalculate averages for shop and barber
  await recalculateAverages(shopId, barberId);

  return review;
};

export const checkExistingReview = async (customerId, shopId, barberId) => {
  if (!shopId || !barberId) return null;

  const review = await Review.findOne({
    customerId: new Types.ObjectId(customerId),
    shopId: new Types.ObjectId(shopId),
    barberId: new Types.ObjectId(barberId),
  });

  return review;
};

export const getCustomerReviews = async (customerId) => {
  return Review.find({ customerId: new Types.ObjectId(customerId) })
    .populate('shopId', 'name address')
    .populate({ path: 'barberId', populate: { path: 'userId', select: 'name avatar' } })
    .sort({ updatedAt: -1 });
};

export const getShopReviews = async (shopId, options = {}) => {
  const query = { shopId: new Types.ObjectId(shopId) };
  if (options.barberId && options.barberId !== 'ALL') {
    query.barberId = new Types.ObjectId(options.barberId);
  }
  if (options.star && options.star !== 'ALL') {
    query.shopRating = Number(options.star);
  }

  const page = options.page ? parseInt(options.page, 10) : null;
  const limit = options.limit !== undefined ? (options.limit === 'all' ? null : parseInt(options.limit, 10) || 10) : (options.page ? 10 : null);

  if (page && limit) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('customerId', 'name avatar')
        .populate({ path: 'barberId', populate: { path: 'userId', select: 'name avatar' } })
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query)
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  const reviews = await Review.find(query)
    .populate('customerId', 'name avatar')
    .populate({ path: 'barberId', populate: { path: 'userId', select: 'name avatar' } })
    .sort({ updatedAt: -1, createdAt: -1 });

  return {
    reviews,
    pagination: {
      total: reviews.length,
      page: 1,
      limit: reviews.length,
      totalPages: 1
    }
  };
};

export const getBarberReviews = async (barberId) => {
  const barber = await Barber.findById(barberId);
  if (!barber) return [];

  const allBarbers = barber.userId ? await Barber.find({ userId: barber.userId }) : [barber];
  const barberIds = allBarbers.map(b => b._id);

  return Review.find({ barberId: { $in: barberIds } })
    .populate('customerId', 'name avatar')
    .populate('shopId', 'name address')
    .sort({ createdAt: -1 });
};

export const getMyBarberReviews = async (userId) => {
  const barber = await Barber.findOne({ 
    userId: new Types.ObjectId(userId), 
    isDeleted: { $ne: true } 
  });
  if (!barber) {
    const error = new Error('Barber profile not found');
    error.statusCode = 404;
    throw error;
  }

  const allBarbers = await Barber.find({ userId: new Types.ObjectId(userId) });
  const barberIds = allBarbers.map(b => b._id);

  const reviews = await Review.find({ barberId: { $in: barberIds } })
    .populate('customerId', 'name avatar')
    .populate('shopId', 'name address')
    .sort({ createdAt: -1 });

  return { barber, reviews };
};
