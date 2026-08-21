import { Service } from '../models/Service.js';
import { Shop } from '../models/Shop.js';
import { ShopStatus } from '../utils/constants.js';
import mongoose from 'mongoose';

export const addService = async (shopId, ownerId, data) => {
  const shop = await Shop.findOne({ _id: shopId, ownerId });
  if (!shop) {
    const error = new Error('Shop not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (shop.status !== ShopStatus.APPROVED) {
    const error = new Error('Your shop must be approved by an admin before you can add services');
    error.statusCode = 400;
    throw error;
  }

  if (shop.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. Operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  const service = await Service.create({
    ...data,
    shopId
  });

  return service;
};

export const getShopServices = async (shopId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    const error = new Error('Invalid shop ID');
    error.statusCode = 400;
    throw error;
  }

  const query = { shopId };
  if (options.activeOnly) {
    query.isActive = true;
  }

  const page = options.page ? parseInt(options.page, 10) : null;
  const limit = options.limit !== undefined ? (options.limit === 'all' ? null : parseInt(options.limit, 10) || 10) : (options.page ? 10 : null);

  if (page && limit) {
    const skip = (page - 1) * limit;
    const [services, total] = await Promise.all([
      Service.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Service.countDocuments(query)
    ]);

    return {
      services,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  const services = await Service.find(query).sort({ createdAt: -1 });
  return {
    services,
    pagination: {
      total: services.length,
      page: 1,
      limit: services.length,
      totalPages: 1
    }
  };
};

export const updateService = async (serviceId, ownerId, data) => {
  const service = await Service.findById(serviceId).populate('shopId');
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.shopId.ownerId.toString() !== ownerId.toString()) {
    const error = new Error('Unauthorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  if (service.shopId.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. Operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  Object.assign(service, data);
  await service.save();

  return service;
};

export const deleteService = async (serviceId, ownerId) => {
  const service = await Service.findById(serviceId).populate('shopId');
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.shopId.ownerId.toString() !== ownerId.toString()) {
    const error = new Error('Unauthorized to delete this service');
    error.statusCode = 403;
    throw error;
  }

  if (service.shopId.isActive === false) {
    const error = new Error('Your shop has been deactivated by Admin. Operations are disabled.');
    error.statusCode = 403;
    throw error;
  }

  await Service.deleteOne({ _id: serviceId });
  return { message: 'Service deleted successfully' };
};
