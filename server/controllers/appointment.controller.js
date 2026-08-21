import * as appointmentService from '../services/appointment.service.js';
import { createAppointmentSchema, createWalkInSchema } from '../validators/appointment.validator.js';
import { emitQueueUpdate, emitAppointmentUpdate } from '../sockets/index.js';
import * as queueService from '../services/queue.service.js';

export const bookAppointment = async (req, res) => {
  try {
    const customerId = req.user._id;
    const validatedData = createAppointmentSchema.parse(req.body);
    const result = await appointmentService.bookAppointment(customerId, validatedData);
    
    const appt = result.appointment || result;
    const shopId = appt.shopId?._id?.toString() || appt.shopId?.toString();
    const barberId = appt.barberId?._id?.toString() || appt.barberId?.toString();
    const custId = appt.customerId?._id?.toString() || appt.customerId?.toString() || customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'BOOKED', appointmentId: appt._id });
    }
    if (custId) {
      emitAppointmentUpdate(custId, appt);
    }

    return res.status(201).json({ message: 'Appointment booked successfully', data: result });
  } catch (error) {
    console.log('Error in bookAppointment controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to book appointment' });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const customerId = req.user._id;
    const appointments = await appointmentService.getCustomerAppointments(customerId);
    return res.status(200).json({ message: 'Appointments retrieved successfully', data: appointments });
  } catch (error) {
    console.log('Error in getMyAppointments controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const result = await appointmentService.getAppointmentById(appointmentId);
    return res.status(200).json({ message: 'Appointment retrieved successfully', data: result });
  } catch (error) {
    console.log('Error in getAppointmentById controller : ', error);
    return res.status(error.statusCode || 404).json({ message: error.message || 'Appointment not found' });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const customerId = req.user._id;
    const appointment = await appointmentService.cancelAppointment(appointmentId, customerId);

    const shopId = appointment.shopId?._id?.toString() || appointment.shopId?.toString();
    const barberId = appointment.barberId?._id?.toString() || appointment.barberId?.toString();
    const custId = appointment.customerId?._id?.toString() || appointment.customerId?.toString() || customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'CANCELLED', appointmentId });
    }
    if (custId) {
      emitAppointmentUpdate(custId, appointment);
    }

    return res.status(200).json({ message: 'Appointment cancelled successfully', data: appointment });
  } catch (error) {
    console.log('Error in cancelAppointment controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to cancel appointment' });
  }
};

export const startService = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const barberUserId = req.user._id;
    const appointment = await appointmentService.startService(appointmentId, barberUserId);

    const shopId = appointment.shopId?._id?.toString() || appointment.shopId?.toString();
    const barberId = appointment.barberId?._id?.toString() || appointment.barberId?.toString();
    const customerId = appointment.customerId?._id?.toString() || appointment.customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'IN_SERVICE', appointmentId });
    }
    if (customerId) {
      emitAppointmentUpdate(customerId, appointment);
    }

    return res.status(200).json({ message: 'Service started successfully', data: appointment });
  } catch (error) {
    console.log('Error in startService controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to start service' });
  }
};

export const completeService = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const barberUserId = req.user._id;
    const appointment = await appointmentService.completeService(appointmentId, barberUserId);

    const shopId = appointment.shopId?._id?.toString() || appointment.shopId?.toString();
    const barberId = appointment.barberId?._id?.toString() || appointment.barberId?.toString();
    const customerId = appointment.customerId?._id?.toString() || appointment.customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'COMPLETED', appointmentId });
    }
    if (customerId) {
      emitAppointmentUpdate(customerId, appointment);
    }

    return res.status(200).json({ message: 'Service completed successfully', data: appointment });
  } catch (error) {
    console.log('Error in completeService controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to complete service' });
  }
};

export const approveAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user._id;
    const appointment = await appointmentService.approveAppointment(appointmentId, userId);

    const shopId = appointment.shopId?._id?.toString() || appointment.shopId?.toString();
    const barberId = appointment.barberId?._id?.toString() || appointment.barberId?.toString();
    const customerId = appointment.customerId?._id?.toString() || appointment.customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'APPROVED', appointmentId });
    }
    if (customerId) {
      emitAppointmentUpdate(customerId, appointment);
    }

    return res.status(200).json({ message: 'Appointment approved successfully', data: appointment });
  } catch (error) {
    console.log('Error in approveAppointment controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to approve appointment' });
  }
};

export const rejectAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user._id;
    const appointment = await appointmentService.rejectAppointment(appointmentId, userId);

    const shopId = appointment.shopId?._id?.toString() || appointment.shopId?.toString();
    const barberId = appointment.barberId?._id?.toString() || appointment.barberId?.toString();
    const customerId = appointment.customerId?._id?.toString() || appointment.customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'REJECTED', appointmentId });
    }
    if (customerId) {
      emitAppointmentUpdate(customerId, appointment);
    }

    return res.status(200).json({ message: 'Appointment rejected', data: appointment });
  } catch (error) {
    console.log('Error in rejectAppointment controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to reject appointment' });
  }
};

export const markNoShow = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const barberUserId = req.user._id;
    const appointment = await appointmentService.markNoShow(appointmentId, barberUserId);

    const shopId = appointment.shopId?._id?.toString() || appointment.shopId?.toString();
    const barberId = appointment.barberId?._id?.toString() || appointment.barberId?.toString();
    const customerId = appointment.customerId?._id?.toString() || appointment.customerId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'NO_SHOW', appointmentId });
    }
    if (customerId) {
      emitAppointmentUpdate(customerId, appointment);
    }

    return res.status(200).json({ message: 'Appointment marked as no-show', data: appointment });
  } catch (error) {
    console.log('Error in markNoShow controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to mark no-show' });
  }
};

export const getMyQueue = async (req, res) => {
  try {
    const barberUserId = req.user._id;
    const queue = await appointmentService.getBarberQueue(barberUserId);
    return res.status(200).json({ message: 'Queue retrieved successfully', data: queue });
  } catch (error) {
    console.log('Error in getMyQueue controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getBarberAppointments = async (req, res) => {
  try {
    const barberUserId = req.user._id;
    const range = req.query.range || 'today';
    const appointments = await appointmentService.getBarberAppointmentHistory(barberUserId, range);
    return res.status(200).json({ message: 'Barber appointment history retrieved', data: appointments });
  } catch (error) {
    console.log('Error in getBarberAppointments controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getShopAppointments = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const ownerId = req.user._id;
    const { range = 'today', page, limit, status } = req.query;
    const result = await appointmentService.getShopAppointments(shopId, ownerId, { range, page, limit, status });
    return res.status(200).json({ 
      message: 'Shop appointments retrieved successfully', 
      data: result.appointments,
      pagination: result.pagination 
    });
  } catch (error) {
    console.log('Error in getShopAppointments controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getShopQueue = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const queueInfo = await queueService.getShopQueueInfo(shopId);
    return res.status(200).json({ message: 'Shop queue info retrieved successfully', data: queueInfo });
  } catch (error) {
    console.log('Error in getShopQueue controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const createWalkIn = async (req, res) => {
  try {
    const barberUserId = req.user._id;
    const validatedData = createWalkInSchema.parse(req.body);
    const result = await appointmentService.createWalkIn(barberUserId, validatedData);

    const appt = result.appointment || result;
    const shopId = appt.shopId?._id?.toString() || appt.shopId?.toString();
    const barberId = appt.barberId?._id?.toString() || appt.barberId?.toString();
    if (shopId) {
      emitQueueUpdate(shopId, barberId, { type: 'WALK_IN', appointmentId: appt._id });
    }

    return res.status(201).json({ message: 'Walk-in customer added to queue', data: result });
  } catch (error) {
    console.log('Error in createWalkIn controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to add walk-in' });
  }
};
