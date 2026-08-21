import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Shop } from '../models/Shop.js';
import { Barber } from '../models/Barber.js';
import { Service } from '../models/Service.js';
import { AppointmentStatus, AppointmentSource, ShopStatus } from '../utils/constants.js';
import { generateQueueNumber, getQueuePosition, calculateEstimatedWait } from './queue.service.js';

export const getDateFilterFromRange = (range = 'today') => {
  if (range === 'all') {
    return null;
  }

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === '7days') {
    start.setDate(start.getDate() - 6);
  } else if (range === '15days') {
    start.setDate(start.getDate() - 14);
  } else if (range === '30days') {
    start.setDate(start.getDate() - 29);
  }

  return { $gte: start, $lte: end };
};

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const bookAppointment = async (customerId, data) => {
  const shop = await Shop.findById(data.shopId);
  if (!shop || shop.status !== ShopStatus.APPROVED || !shop.isOpen || shop.isActive === false) {
    throw createError('Shop is not available for booking', 400);
  }

  const barber = await Barber.findById(data.barberId);
  if (!barber || barber.shopId.toString() !== data.shopId || barber.isActive === false || barber.isDeleted || barber.isAvailable === false) {
    throw createError('This barber is currently off duty or unavailable for booking', 400);
  }

  const targetServiceIds = data.serviceIds || (data.serviceId ? [data.serviceId] : []);
  const services = await Service.find({
    _id: { $in: targetServiceIds.map(id => new Types.ObjectId(id)) },
    shopId: data.shopId,
    isActive: true
  });

  if (services.length === 0) {
    throw createError('No valid services selected', 400);
  }

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const serviceNames = services.map(s => s.name).join(', ');

  const appointment = await Appointment.create({
    customerId,
    shopId: data.shopId,
    barberId: data.barberId,
    serviceId: services[0]._id,
    serviceIds: services.map(s => s._id),
    services: services.map(s => ({
      serviceId: s._id,
      name: s.name,
      duration: s.duration,
      price: s.price
    })),
    serviceName: serviceNames,
    serviceDuration: totalDuration,
    totalPrice: totalPrice,
    queueNumber: null,
    status: AppointmentStatus.PENDING_APPROVAL,
    source: AppointmentSource.ONLINE,
    bookedAt: new Date()
  });

  const populated = await Appointment.findById(appointment._id)
    .populate('shopId', 'name address city')
    .populate('customerId', 'name phone')
    .populate({
      path: 'barberId',
      populate: { path: 'userId', select: 'name avatar' }
    });

  const position = await getQueuePosition(appointment._id);

  return {
    appointment: populated,
    queuePosition: position
  };
};

export const createWalkIn = async (barberUserId, data) => {
  const barber = await Barber.findOne({ userId: new Types.ObjectId(barberUserId), isDeleted: { $ne: true } });
  if (!barber) throw createError('Barber profile not found', 404);
  if (barber.isActive === false) throw createError('Your barber account is inactive', 403);

  const shop = await Shop.findById(barber.shopId);
  if (!shop) throw createError('Shop not found', 404);
  if (shop.status !== ShopStatus.APPROVED) throw createError('Shop is not approved', 400);
  if (!shop.isOpen) throw createError('Shop is currently closed', 400);
  if (shop.isActive === false) throw createError('Shop is deactivated', 400);

  const service = await Service.findOne({
    _id: new Types.ObjectId(data.serviceId),
    shopId: barber.shopId,
    isActive: true
  });
  if (!service) throw createError('Service not found or inactive', 404);

  const cleanPhone = (data.phone || '').trim();
  if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
    throw createError('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9', 400);
  }

  const queueNumber = await generateQueueNumber(barber._id.toString());

  let appointment = await Appointment.create({
    customerId: null,
    shopId: barber.shopId,
    barberId: barber._id,
    serviceId: service._id,
    serviceIds: [service._id],
    services: [{ serviceId: service._id, name: service.name, duration: service.duration, price: service.price }],
    serviceName: service.name,
    serviceDuration: service.duration,
    totalPrice: service.price || 0,
    customerName: data.customerName,
    customerPhone: cleanPhone || null,
    queueNumber,
    status: AppointmentStatus.WAITING,
    source: AppointmentSource.WALK_IN,
    bookedAt: new Date()
  });

  appointment = await appointment.populate([
    { path: 'shopId', select: 'name address' },
    { path: 'barberId', populate: { path: 'userId', select: 'name avatar' } }
  ]);

  const queuePosition = await getQueuePosition(appointment._id.toString());

  return { appointment, queuePosition };
};

export const approveAppointment = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);

  if (appointment.status !== AppointmentStatus.PENDING_APPROVAL) {
    throw createError('Appointment is not pending approval', 400);
  }

  const barber = await Barber.findById(appointment.barberId);
  const shop = await Shop.findById(appointment.shopId);
  
  const uid = userId.toString();
  const isBarber = barber && barber.userId.toString() === uid;
  const isOwner = shop && shop.ownerId.toString() === uid;

  if (!isBarber && !isOwner) {
    throw createError('Unauthorized to approve this appointment', 403);
  }

  if (isBarber && barber && barber.isActive === false) {
    throw createError('Your barber station has been deactivated by the shop owner', 403);
  }

  const queueNumber = await generateQueueNumber(appointment.barberId.toString());
  appointment.queueNumber = queueNumber;
  appointment.status = AppointmentStatus.WAITING;
  await appointment.save();

  return appointment.populate([
    { path: 'shopId', select: 'name address' },
    { path: 'barberId', populate: { path: 'userId', select: 'name avatar' } },
    { path: 'customerId', select: 'name phone avatar' }
  ]);
};

export const rejectAppointment = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);

  if (![AppointmentStatus.PENDING_APPROVAL, AppointmentStatus.WAITING].includes(appointment.status)) {
    throw createError('Appointment cannot be rejected at this stage', 400);
  }

  const barber = await Barber.findById(appointment.barberId);
  const shop = await Shop.findById(appointment.shopId);
  
  const uid = userId.toString();
  const isBarber = barber && barber.userId.toString() === uid;
  const isOwner = shop && shop.ownerId.toString() === uid;

  if (!isBarber && !isOwner) {
    throw createError('Unauthorized to reject this appointment', 403);
  }

  if (isBarber && barber && barber.isActive === false) {
    throw createError('Your barber station has been deactivated by the shop owner', 403);
  }

  appointment.status = AppointmentStatus.REJECTED;
  appointment.cancelledBy = isBarber ? 'BARBER' : 'SHOP_OWNER';
  appointment.rejectedBy = isBarber ? 'BARBER' : 'SHOP_OWNER';
  appointment.cancelledAt = new Date();
  await appointment.save();

  return appointment;
};

export const getCustomerAppointments = async (customerId) => {
  const appointments = await Appointment.find({ customerId: new Types.ObjectId(customerId) })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'shopId', select: 'name address' },
      { path: 'barberId', populate: { path: 'userId', select: 'name avatar' } },
      { path: 'serviceId', select: 'name' }
    ]);

  const results = await Promise.all(
    appointments.map(async (appt) => {
      const apptObj = appt.toObject();
      if ([AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE].includes(appt.status)) {
        try {
          const queuePos = await getQueuePosition(appt._id.toString());
          apptObj.queuePosition = queuePos;
          apptObj.position = queuePos.position;
          apptObj.peopleAhead = queuePos.peopleAhead;
          apptObj.estimatedWait = queuePos.estimatedWait;
        } catch (e) {}
      }
      return apptObj;
    })
  );

  return results;
};

export const getAppointmentById = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate([
    { path: 'shopId', select: 'name address' },
    { path: 'barberId', populate: { path: 'userId', select: 'name avatar' } },
    { path: 'serviceId', select: 'name' },
    { path: 'customerId', select: 'name phone avatar' }
  ]);

  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  let queueInfo = null;
  if ([AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE].includes(appointment.status)) {
    queueInfo = await getQueuePosition(appointment._id.toString());
  }

  return { appointment, queueInfo };
};

export const cancelAppointment = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  if (![AppointmentStatus.PENDING_APPROVAL, AppointmentStatus.WAITING].includes(appointment.status)) {
    throw createError('Only pending or waiting appointments can be cancelled', 400);
  }

  const barber = await Barber.findById(appointment.barberId);
  const shop = await Shop.findById(appointment.shopId);
  const uid = userId.toString();

  const isCustomer = appointment.customerId && appointment.customerId.toString() === uid;
  const isBarber = barber && barber.userId.toString() === uid;
  const isOwner = shop && shop.ownerId.toString() === uid;

  if (!isCustomer && !isBarber && !isOwner) {
    throw createError('Unauthorized to cancel this appointment', 403);
  }

  if (isBarber && barber && barber.isActive === false) {
    throw createError('Your barber station has been deactivated by the shop owner', 403);
  }

  appointment.status = AppointmentStatus.CANCELLED;
  appointment.cancelledBy = isCustomer ? 'CUSTOMER' : isBarber ? 'BARBER' : 'SHOP_OWNER';
  appointment.cancelledAt = new Date();
  await appointment.save();

  return appointment;
};

export const startService = async (appointmentId, barberUserId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);

  let barber = await Barber.findById(appointment.barberId);
  if (!barber || barber.userId.toString() !== barberUserId.toString() || barber.isDeleted) {
    barber = await Barber.findOne({
      userId: new Types.ObjectId(barberUserId),
      isDeleted: { $ne: true }
    });
  }

  if (!barber || barber.userId.toString() !== barberUserId.toString()) {
    throw createError('Appointment not found or does not belong to you', 404);
  }

  if (barber.isActive === false) {
    throw createError('Your barber station has been deactivated by the shop owner', 403);
  }

  if (appointment.status !== AppointmentStatus.WAITING) {
    throw createError('Only waiting appointments can be started', 400);
  }

  const activeInService = await Appointment.findOne({
    barberId: barber._id,
    status: AppointmentStatus.IN_SERVICE
  });

  if (activeInService) {
    throw createError('You already have an active service in progress', 400);
  }

  appointment.status = AppointmentStatus.IN_SERVICE;
  appointment.startedAt = new Date();
  await appointment.save();

  return appointment;
};

export const completeService = async (appointmentId, barberUserId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);

  let barber = await Barber.findById(appointment.barberId);
  if (!barber || barber.userId.toString() !== barberUserId.toString() || barber.isDeleted) {
    barber = await Barber.findOne({
      userId: new Types.ObjectId(barberUserId),
      isDeleted: { $ne: true }
    });
  }

  if (!barber || barber.userId.toString() !== barberUserId.toString()) {
    throw createError('Appointment not found or does not belong to you', 404);
  }

  if (barber.isActive === false) {
    throw createError('Your barber station has been deactivated by the shop owner', 403);
  }

  if (appointment.status !== AppointmentStatus.IN_SERVICE) {
    throw createError('Appointment is not currently in service', 400);
  }

  appointment.status = AppointmentStatus.COMPLETED;
  appointment.completedAt = new Date();
  await appointment.save();

  return appointment;
};

export const markNoShow = async (appointmentId, barberUserId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);

  let barber = await Barber.findById(appointment.barberId);
  if (!barber || barber.userId.toString() !== barberUserId.toString() || barber.isDeleted) {
    barber = await Barber.findOne({
      userId: new Types.ObjectId(barberUserId),
      isDeleted: { $ne: true }
    });
  }

  if (!barber || barber.userId.toString() !== barberUserId.toString()) {
    throw createError('Appointment not found or does not belong to you', 404);
  }

  if (barber.isActive === false) {
    throw createError('Your barber station has been deactivated by the shop owner', 403);
  }

  if (appointment.status !== AppointmentStatus.WAITING) {
    throw createError('Only waiting appointments can be marked as no-show', 400);
  }

  appointment.status = AppointmentStatus.NO_SHOW;
  await appointment.save();

  return appointment;
};

export const getBarberQueue = async (barberUserId) => {
  const barber = await Barber.findOne({ 
    userId: new Types.ObjectId(barberUserId),
    isDeleted: { $ne: true }
  });
  if (!barber) throw createError('Barber profile not found', 404);

  // Return all active appointments (persisting across days until handled)
  const appointments = await Appointment.find({
    barberId: barber._id,
    status: { $in: [AppointmentStatus.PENDING_APPROVAL, AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE] }
  })
    .sort({ bookedAt: 1, queueNumber: 1 })
    .populate('customerId', 'name phone avatar')
    .populate('serviceId', 'name duration price');

  const queueWithEta = await Promise.all(
    appointments.map(async (appt) => {
      const wait = appt.queueNumber ? await calculateEstimatedWait(barber._id.toString(), appt.queueNumber) : 0;
      return { ...appt.toObject(), estimatedWait: wait };
    })
  );

  return queueWithEta;
};

export const getBarberAppointmentHistory = async (barberUserId, range = 'today') => {
  const barber = await Barber.findOne({ 
    userId: new Types.ObjectId(barberUserId),
    isDeleted: { $ne: true }
  });
  if (!barber) throw createError('Barber profile not found', 404);

  const query = { barberId: barber._id };
  const dateFilter = getDateFilterFromRange(range);
  if (dateFilter) {
    query.bookedAt = dateFilter;
  }

  const appointments = await Appointment.find(query)
    .sort({ bookedAt: -1, createdAt: -1 })
    .populate('customerId', 'name phone avatar')
    .populate('serviceId', 'name duration price');

  return appointments;
};

export const getShopAppointments = async (shopId, ownerId, options = {}) => {
  const shop = await Shop.findOne({ _id: new Types.ObjectId(shopId), ownerId: new Types.ObjectId(ownerId) });
  if (!shop) throw createError('Shop not found or you are not the owner', 404);

  const range = typeof options === 'string' ? options : (options.range || 'today');
  const page = typeof options === 'object' && options.page ? parseInt(options.page, 10) : null;
  const limit = typeof options === 'object' && options.limit !== undefined 
    ? (options.limit === 'all' ? null : parseInt(options.limit, 10) || 10) 
    : (page ? 10 : null);
  const status = typeof options === 'object' && options.status && options.status !== 'ALL' ? options.status : null;

  const query = { shopId: new Types.ObjectId(shopId) };
  const dateFilter = getDateFilterFromRange(range);
  if (dateFilter) {
    query.bookedAt = dateFilter;
  }
  if (status) {
    query.status = status;
  }

  if (page && limit) {
    const skip = (page - 1) * limit;
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ bookedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: 'customerId', select: 'name phone avatar' },
          { path: 'barberId', populate: { path: 'userId', select: 'name avatar' } },
          { path: 'serviceId', select: 'name' }
        ]),
      Appointment.countDocuments(query)
    ]);

    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  const appointments = await Appointment.find(query)
    .sort({ bookedAt: -1, createdAt: -1 })
    .populate([
      { path: 'customerId', select: 'name phone avatar' },
      { path: 'barberId', populate: { path: 'userId', select: 'name avatar' } },
      { path: 'serviceId', select: 'name' }
    ]);

  return {
    appointments,
    pagination: {
      total: appointments.length,
      page: 1,
      limit: appointments.length,
      totalPages: 1
    }
  };
};
