import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { Barber } from '../models/Barber.js';
import { Service } from '../models/Service.js';
import { ShopStatus, UserRole } from '../utils/constants.js';

export const getPendingShops = async () => {
  return Shop.find({ status: ShopStatus.PENDING }).populate('ownerId', 'name email phone avatar').sort({ createdAt: -1 });
};

export const getApprovedShops = async () => {
  return Shop.find({ status: ShopStatus.APPROVED })
    .populate('ownerId', 'name email phone avatar')
    .populate('approvedBy', 'name email role avatar')
    .sort({ approvedAt: -1, createdAt: -1 });
};

export const getRejectedShops = async () => {
  return Shop.find({ status: ShopStatus.REJECTED })
    .populate('ownerId', 'name email phone avatar')
    .populate('rejectedBy', 'name email role avatar')
    .sort({ rejectedAt: -1, createdAt: -1 });
};

export const getShopDetails = async (shopId) => {
  const shop = await Shop.findById(shopId)
    .populate('ownerId', 'name email phone avatar')
    .populate('approvedBy', 'name email role avatar')
    .populate('rejectedBy', 'name email role avatar');

  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  const barbers = await Barber.find({ shopId }).populate('userId', 'name email phone avatar');
  const services = await Service.find({ shopId });

  return {
    shop,
    barbers,
    services
  };
};

export const approveShop = async (shopId, approverUserId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  if (shop.status === ShopStatus.APPROVED) {
    const error = new Error('Shop is already approved');
    error.statusCode = 400;
    throw error;
  }

  shop.status = ShopStatus.APPROVED;
  shop.approvedBy = approverUserId;
  shop.approvedAt = new Date();
  shop.isActive = true;
  await shop.save();

  return Shop.findById(shopId)
    .populate('ownerId', 'name email phone avatar')
    .populate('approvedBy', 'name email role avatar');
};

export const rejectShop = async (shopId, rejecterUserId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  if (shop.status === ShopStatus.REJECTED) {
    const error = new Error('Shop is already rejected');
    error.statusCode = 400;
    throw error;
  }

  shop.status = ShopStatus.REJECTED;
  shop.rejectedBy = rejecterUserId;
  shop.rejectedAt = new Date();
  await shop.save();

  return Shop.findById(shopId)
    .populate('ownerId', 'name email phone avatar')
    .populate('rejectedBy', 'name email role avatar');
};

export const toggleShopActive = async (shopId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  const nextIsActive = !shop.isActive;
  shop.isActive = nextIsActive;
  await shop.save();

  // Find all barbers belonging to this shop
  const barbers = await Barber.find({ shopId: shop._id });

  if (nextIsActive === false) {
    // 1. Deactivate all barber records at this shop
    await Barber.updateMany({ shopId: shop._id }, { isActive: false });

    // 2. For each barber, check if they have active assignments at other active shops
    for (const b of barbers) {
      if (!b.userId) continue;

      // Find any other active barber assignment in an approved active shop
      const otherActiveAssignments = await Barber.find({
        userId: b.userId,
        _id: { $ne: b._id },
        isActive: true
      }).populate('shopId');

      const hasOtherActiveShop = otherActiveAssignments.some(
        assignment => assignment.shopId && assignment.shopId.isActive !== false && assignment.shopId.status === ShopStatus.APPROVED
      );

      if (!hasOtherActiveShop) {
        const user = await User.findById(b.userId);
        if (user && Array.isArray(user.roles)) {
          const barberRole = user.roles.find(r => (typeof r === 'string' ? r === UserRole.BARBER : r.role === UserRole.BARBER));
          if (barberRole && typeof barberRole === 'object') {
            barberRole.isActive = false;
            await user.save();
          }
        }
      }
    }
  } else {
    // Reactivating shop: reactivate all barbers of this shop
    await Barber.updateMany({ shopId: shop._id }, { isActive: true });

    for (const b of barbers) {
      if (!b.userId) continue;
      const user = await User.findById(b.userId);
      if (user && Array.isArray(user.roles)) {
        const barberRole = user.roles.find(r => (typeof r === 'string' ? r === UserRole.BARBER : r.role === UserRole.BARBER));
        if (barberRole && typeof barberRole === 'object' && !barberRole.isActive) {
          barberRole.isActive = true;
          await user.save();
        }
      }
    }
  }

  return Shop.findById(shopId)
    .populate('ownerId', 'name email phone avatar')
    .populate('approvedBy', 'name email role avatar');
};

export const deleteShop = async (shopId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    const error = new Error('Shop not found');
    error.statusCode = 404;
    throw error;
  }

  await Barber.deleteMany({ shopId });
  await Service.deleteMany({ shopId });
  await Shop.deleteOne({ _id: shopId });

  return { message: 'Shop deleted successfully' };
};

// Manager Management
export const createManager = async ({ name, email, phone, password }) => {
  const cleanPhone = (phone || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();

  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    const error = new Error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ phone: cleanPhone });

  if (user) {
    if (user.roles && user.roles.includes(UserRole.MANAGER)) {
      const error = new Error('This user already has the Manager role assigned');
      error.statusCode = 409;
      throw error;
    }
    user.roles.push(UserRole.MANAGER);
    await user.save();
    const managerObj = user.toObject();
    delete managerObj.password;
    return managerObj;
  }

  const emailExists = await User.findOne({ email: cleanEmail });
  if (emailExists) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const manager = await User.create({
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password,
    roles: [UserRole.MANAGER]
  });

  const managerObj = manager.toObject();
  delete managerObj.password;
  return managerObj;
};

export const getManagers = async () => {
  return User.find({ roles: UserRole.MANAGER }).select('-password').sort({ createdAt: -1 });
};

export const updateManager = async (managerId, { name, password }) => {
  const manager = await User.findOne({ _id: managerId, roles: UserRole.MANAGER });
  if (!manager) {
    const error = new Error('Manager not found');
    error.statusCode = 404;
    throw error;
  }

  if (name) manager.name = name.trim();
  if (password && password.trim().length >= 6) {
    manager.password = password;
  }

  await manager.save();

  const managerObj = manager.toObject();
  delete managerObj.password;
  return managerObj;
};

export const toggleManagerStatus = async (managerId) => {
  const manager = await User.findOne({ _id: managerId, roles: UserRole.MANAGER });
  if (!manager) {
    const error = new Error('Manager not found');
    error.statusCode = 404;
    throw error;
  }

  manager.isActive = !manager.isActive;
  await manager.save();

  const managerObj = manager.toObject();
  delete managerObj.password;
  return managerObj;
};

export const deleteManager = async (managerId) => {
  const manager = await User.findOne({ _id: managerId, roles: UserRole.MANAGER });
  if (!manager) {
    const error = new Error('Manager not found');
    error.statusCode = 404;
    throw error;
  }

  if (manager.roles && manager.roles.length > 1) {
    manager.roles = manager.roles.filter(r => r !== UserRole.MANAGER);
    await manager.save();
  } else {
    await User.deleteOne({ _id: managerId });
  }

  return { message: 'Manager deleted successfully' };
};
