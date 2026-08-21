import { Barber } from '../models/Barber.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { ShopStatus, UserRole } from '../utils/constants.js';
import mongoose from 'mongoose';

export const addBarber = async (shopId, ownerId, data) => {
  const shop = await Shop.findOne({ _id: shopId, ownerId });
  if (!shop) {
    const error = new Error('Shop not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (shop.status !== ShopStatus.APPROVED) {
    const error = new Error('Your shop must be approved by an admin before you can add barbers');
    error.statusCode = 400;
    throw error;
  }

  if (shop.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. Operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  const cleanPhone = (data.phone || '').trim();
  const cleanEmail = (data.email || '').toLowerCase().trim();

  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    const error = new Error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
    error.statusCode = 400;
    throw error;
  }

  const shopBarbers = await Barber.find({ shopId, isDeleted: false }).populate('userId');
  const duplicateBarber = shopBarbers.find((b) => 
    b.userId && (b.userId.email === cleanEmail || b.userId.phone === cleanPhone)
  );

  if (duplicateBarber) {
    const field = duplicateBarber.userId.email === cleanEmail ? 'email' : 'phone number';
    const error = new Error(`A barber with this ${field} already exists in your shop`);
    error.statusCode = 400;
    throw error;
  }

  // Look for existing user by normalized phone or email
  let user = await User.findOne({
    $or: [{ phone: cleanPhone }, { email: cleanEmail }]
  });

  let barber;

  if (user) {
    // Check if user is already assigned as an active barber anywhere
    const existingActiveBarber = await Barber.findOne({ userId: user._id, isDeleted: false }).populate('shopId');
    if (existingActiveBarber) {
      const existingShopName = existingActiveBarber.shopId?.name || 'another barbershop';
      if (existingActiveBarber.shopId?._id?.toString() === shop._id.toString()) {
        const error = new Error('This barber is already registered in your shop');
        error.statusCode = 400;
        throw error;
      } else {
        const error = new Error(`This user is already registered as an active barber at "${existingShopName}". A barber can only be assigned to one shop at a time.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // Add or reactivate BARBER role if not already active
    if (!user.hasRole(UserRole.BARBER)) {
      user.roles.push({ role: UserRole.BARBER, isActive: true, addedAt: new Date() });
      await user.save();
    } else {
      const bRole = user.roles.find(r => (typeof r === 'string' ? r === UserRole.BARBER : r.role === UserRole.BARBER));
      if (bRole && typeof bRole === 'object') {
        bRole.isActive = true;
        await user.save();
      }
    }

    // If barber was previously soft-deleted at this shop, restore the record
    const previouslyDeleted = await Barber.findOne({ userId: user._id, shopId: shop._id, isDeleted: true });
    if (previouslyDeleted) {
      previouslyDeleted.isDeleted = false;
      previouslyDeleted.isActive = true;
      previouslyDeleted.deletedAt = null;
      if (data.specialty) previouslyDeleted.specialty = data.specialty;
      await previouslyDeleted.save();
      barber = previouslyDeleted;
    }
  } else {
    // If creating a brand new user, ensure email is unique
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    if (!data.password || data.password.length < 6) {
      const error = new Error('Password of at least 6 characters is required for creating a new user');
      error.statusCode = 400;
      throw error;
    }

    user = await User.create({
      name: data.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: data.password,
      roles: [{ role: UserRole.BARBER, isActive: true, addedAt: new Date() }]
    });
  }

  if (!barber) {
    barber = await Barber.create({
      userId: user._id,
      shopId: shop._id,
      isAvailable: true,
      isActive: true,
      isDeleted: false,
      specialty: data.specialty || 'General Haircut & Beard'
    });
  }

  return {
    _id: barber._id,
    shopId: barber.shopId,
    specialty: barber.specialty,
    isActive: barber.isActive,
    isAvailable: barber.isAvailable,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar
    }
  };
};

export const getShopBarbers = async (shopId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    const error = new Error('Invalid shop ID');
    error.statusCode = 400;
    throw error;
  }

  const shop = await Shop.findById(shopId);
  if (!shop || shop.isActive === false) {
    return {
      barbers: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    };
  }

  const query = { shopId, isDeleted: false };
  if (options.activeOnly) {
    query.isActive = true;
  }

  const page = options.page ? parseInt(options.page, 10) : null;
  const limit = options.limit !== undefined ? (options.limit === 'all' ? null : parseInt(options.limit, 10) || 10) : (options.page ? 10 : null);

  if (page && limit) {
    const skip = (page - 1) * limit;
    const [barbers, total] = await Promise.all([
      Barber.find(query)
        .populate('userId', 'name email phone avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Barber.countDocuments(query)
    ]);

    return {
      barbers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  const barbers = await Barber.find(query)
    .populate('userId', 'name email phone avatar')
    .sort({ createdAt: -1 });

  return {
    barbers,
    pagination: {
      total: barbers.length,
      page: 1,
      limit: barbers.length,
      totalPages: 1
    }
  };
};

export const updateBarber = async (barberId, ownerId, data) => {
  const barber = await Barber.findById(barberId).populate('shopId');
  if (!barber) {
    const error = new Error('Barber not found');
    error.statusCode = 404;
    throw error;
  }

  if (barber.shopId.ownerId.toString() !== ownerId.toString()) {
    const error = new Error('Unauthorized to update this barber');
    error.statusCode = 403;
    throw error;
  }

  if (barber.shopId.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. Operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  if (data.specialty !== undefined) {
    barber.specialty = data.specialty;
    await barber.save();
  }

  if (data.isActive !== undefined) {
    barber.isActive = data.isActive;
    await barber.save();

    // Sync BARBER role status in User.roles
    const user = await User.findById(barber.userId);
    if (user) {
      const bRole = user.roles.find(r => (typeof r === 'string' ? r === UserRole.BARBER : r.role === UserRole.BARBER));
      if (bRole && typeof bRole === 'object') {
        bRole.isActive = data.isActive;
        await user.save();
      }
    }
  }

  if (data.isAvailable !== undefined) {
    barber.isAvailable = data.isAvailable;
    await barber.save();
  }

  const userUpdate = {};

  if (data.name && data.name.trim()) {
    userUpdate.name = data.name.trim();
  }

  if (data.email && data.email.trim()) {
    const cleanEmail = data.email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const error = new Error('Please enter a valid email address');
      error.statusCode = 400;
      throw error;
    }

    // Check email uniqueness against other accounts
    const duplicateEmail = await User.findOne({
      _id: { $ne: barber.userId },
      email: cleanEmail
    });

    if (duplicateEmail) {
      const otherBarber = await Barber.findOne({ userId: duplicateEmail._id }).populate('shopId');
      if (otherBarber) {
        const otherShopName = otherBarber.shopId?.name || 'another barbershop';
        const error = new Error(`This email belongs to a barber at "${otherShopName}". A barber can only be assigned to one shop.`);
        error.statusCode = 409;
        throw error;
      }
      const error = new Error('Email address is already in use by another account');
      error.statusCode = 409;
      throw error;
    }

    userUpdate.email = cleanEmail;
  }

  if (data.phone && data.phone.trim()) {
    const cleanPhone = data.phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const error = new Error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
      error.statusCode = 400;
      throw error;
    }

    // Check global unique phone index
    const duplicatePhone = await User.findOne({
      _id: { $ne: barber.userId },
      phone: cleanPhone
    });

    if (duplicatePhone) {
      const otherBarber = await Barber.findOne({ userId: duplicatePhone._id }).populate('shopId');
      if (otherBarber) {
        const otherShopName = otherBarber.shopId?.name || 'another barbershop';
        const error = new Error(`This phone number belongs to a barber at "${otherShopName}". A barber can only be assigned to one shop.`);
        error.statusCode = 409;
        throw error;
      }
      const error = new Error('Phone number is already in use by another account');
      error.statusCode = 409;
      throw error;
    }

    userUpdate.phone = cleanPhone;
  }

  if (Object.keys(userUpdate).length > 0) {
    await User.findByIdAndUpdate(barber.userId, userUpdate, { runValidators: true });
  }

  const updatedBarber = await Barber.findById(barberId).populate('userId', 'name email phone avatar');
  return updatedBarber;
};

export const deleteBarber = async (barberId, ownerId) => {
  const barber = await Barber.findById(barberId).populate('shopId');
  if (!barber) {
    const error = new Error('Barber not found');
    error.statusCode = 404;
    throw error;
  }

  if (barber.shopId.ownerId.toString() !== ownerId.toString()) {
    const error = new Error('Unauthorized to delete this barber');
    error.statusCode = 403;
    throw error;
  }

  if (barber.shopId.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. Operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  const userId = barber.userId;

  // Soft delete the barber record so historical appointments and revenue records are preserved
  barber.isDeleted = true;
  barber.isActive = false;
  barber.deletedAt = new Date();
  await barber.save();

  if (userId) {
    const user = await User.findById(userId);
    if (user && Array.isArray(user.roles)) {
      // Keep barber role intact but mark it inactive (do not convert to customer)
      const bRole = user.roles.find(r => (typeof r === 'string' ? r === UserRole.BARBER : r.role === UserRole.BARBER));
      if (bRole && typeof bRole === 'object') {
        bRole.isActive = false;
        await user.save();
      }
    }
  }

  return { message: 'Barber removed successfully' };
};

export const toggleAvailability = async (userId, isAvailable) => {
  const barber = await Barber.findOne({ userId, isDeleted: { $ne: true } });
  if (!barber) {
    const error = new Error('Barber profile not found');
    error.statusCode = 404;
    throw error;
  }

  if (barber.isActive === false) {
    const error = new Error('Your barber station has been deactivated by the shop owner');
    error.statusCode = 403;
    throw error;
  }

  barber.isAvailable = isAvailable !== undefined ? isAvailable : !barber.isAvailable;
  await barber.save();
  return barber;
};

export const getMyBarberProfile = async (userId) => {
  const barber = await Barber.findOne({ userId, isDeleted: { $ne: true } })
    .populate('userId', 'name email phone')
    .populate('shopId', 'name address city');
  return barber;
};

export const setQueueDelay = async (userId, delayMinutes) => {
  const barber = await Barber.findOne({ userId, isDeleted: { $ne: true } });
  if (!barber) {
    const error = new Error('Barber profile not found');
    error.statusCode = 404;
    throw error;
  }

  if (barber.isActive === false) {
    const error = new Error('Your barber station has been deactivated by the shop owner');
    error.statusCode = 403;
    throw error;
  }

  barber.delayMinutes = Math.max(0, parseInt(delayMinutes, 10) || 0);
  await barber.save();
  return barber;
};

export const lookupUser = async (phone, email) => {
  const cleanPhone = (phone || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();

  if (!cleanPhone && !cleanEmail) {
    return { exists: false };
  }

  const query = [];
  if (cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone)) {
    query.push({ phone: cleanPhone });
  }
  if (cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    query.push({ email: cleanEmail });
  }

  if (query.length === 0) {
    return { exists: false };
  }

  const user = await User.findOne({ $or: query }).select('name email phone roles');
  if (!user) {
    return { exists: false };
  }

  // Check if user is already an active barber anywhere
  const activeBarber = await Barber.findOne({ userId: user._id, isDeleted: false }).populate('shopId');

  return {
    exists: true,
    name: user.name,
    email: user.email,
    phone: user.phone,
    hasBarberRole: user.hasRole ? user.hasRole(UserRole.BARBER) : false,
    isAssignedToOtherShop: !!(activeBarber && activeBarber.shopId),
    assignedShopName: activeBarber?.shopId?.name || null,
    assignedShopId: activeBarber?.shopId?._id || null
  };
};
