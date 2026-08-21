import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { AppointmentStatus } from '../utils/constants.js';
import { Barber } from '../models/Barber.js';

const getTodayDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const generateQueueNumber = async (barberId) => {
  const { start, end } = getTodayDateRange();

  const latestAppointment = await Appointment.findOne({
    barberId: new Types.ObjectId(barberId),
    bookedAt: { $gte: start, $lte: end }
  }).sort({ queueNumber: -1 });

  return latestAppointment ? latestAppointment.queueNumber + 1 : 1;
};

export const getBarberQueueInfo = async (barberId) => {
  // Find all currently active appointments for this barber (persists across days)
  const activeAppointments = await Appointment.find({
    barberId: new Types.ObjectId(barberId),
    status: { $in: [AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE] }
  }).sort({ bookedAt: 1, queueNumber: 1 });

  const queueLength = activeAppointments.length;
  
  if (queueLength === 0) {
    return { currentCustomer: null, queueLength: 0, estimatedWait: 0 };
  }

  const inService = activeAppointments.find(a => a.status === AppointmentStatus.IN_SERVICE);
  const currentCustomer = inService || activeAppointments[0];

  let estimatedWait = 0;
  for (const appt of activeAppointments) {
    if (appt.status === AppointmentStatus.WAITING) {
      estimatedWait += appt.serviceDuration;
    }
  }

  if (inService && inService.startedAt) {
    const elapsedMinutes = Math.floor((Date.now() - inService.startedAt.getTime()) / 60000);
    const remainingTime = Math.max(0, inService.serviceDuration - elapsedMinutes);
    estimatedWait += remainingTime;
  } else if (inService) {
    estimatedWait += inService.serviceDuration;
  }

  const barber = await Barber.findById(barberId);
  if (barber && barber.delayMinutes) {
    estimatedWait += barber.delayMinutes;
  }

  return { currentCustomer, queueLength, estimatedWait };
};

export const calculateEstimatedWait = async (barberId, queueNumber) => {
  if (!queueNumber || typeof queueNumber !== 'number') {
    return 0;
  }

  try {
    const priorAppointments = await Appointment.find({
      barberId: new Types.ObjectId(barberId),
      status: { $in: [AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE] },
      queueNumber: { $lt: queueNumber }
    });

    let estimatedWait = 0;
    let inServiceAppt = null;

    for (const appt of priorAppointments) {
      if (appt.status === AppointmentStatus.WAITING) {
        estimatedWait += appt.serviceDuration || 0;
      } else if (appt.status === AppointmentStatus.IN_SERVICE) {
        inServiceAppt = appt;
      }
    }

    if (inServiceAppt && inServiceAppt.startedAt) {
      const elapsedMinutes = Math.floor((Date.now() - inServiceAppt.startedAt.getTime()) / 60000);
      const remainingTime = Math.max(0, (inServiceAppt.serviceDuration || 0) - elapsedMinutes);
      estimatedWait += remainingTime;
    } else if (inServiceAppt) {
      estimatedWait += inServiceAppt.serviceDuration || 0;
    }

    const barber = await Barber.findById(barberId);
    if (barber && barber.delayMinutes) {
      estimatedWait += barber.delayMinutes;
    }

    return estimatedWait;
  } catch (err) {
    console.error('Error calculating estimated wait:', err);
    return 0;
  }
};

export const getQueuePosition = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  if (appointment.status === AppointmentStatus.PENDING_APPROVAL || !appointment.queueNumber) {
    return { position: 0, peopleAhead: 0, estimatedWait: 0 };
  }

  const count = await Appointment.countDocuments({
    barberId: appointment.barberId,
    status: { $in: [AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE] },
    queueNumber: { $lte: appointment.queueNumber }
  });

  const position = count;
  const peopleAhead = Math.max(0, position - 1);
  const estimatedWait = await calculateEstimatedWait(appointment.barberId.toString(), appointment.queueNumber);

  return { position, peopleAhead, estimatedWait };
};

export const getShopQueueInfo = async (shopId) => {
  const barbers = await Barber.find({ shopId: new Types.ObjectId(shopId), isActive: true, isDeleted: false }).populate('userId', 'name avatar');
  
  const queueInfo = [];
  for (const barber of barbers) {
    const info = await getBarberQueueInfo(barber._id.toString());
    queueInfo.push({
      barberId: barber._id.toString(),
      barberName: barber.userId?.name || 'Barber',
      barberAvatar: barber.userId?.avatar || '',
      queueLength: info.queueLength,
      estimatedWait: info.estimatedWait
    });
  }

  return queueInfo;
};
