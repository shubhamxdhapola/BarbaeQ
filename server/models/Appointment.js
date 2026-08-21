import mongoose from 'mongoose';
import { AppointmentStatus, AppointmentSource } from '../utils/constants.js';

const appointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    serviceIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    }],
    services: [{
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      name: String,
      duration: Number,
      price: Number,
    }],
    serviceName: {
      type: String,
      required: true,
    },
    serviceDuration: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    queueNumber: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.WAITING,
    },
    source: {
      type: String,
      enum: Object.values(AppointmentSource),
      required: true,
      default: AppointmentSource.ONLINE,
    },
    customerName: {
      type: String,
      default: null,
    },
    customerPhone: {
      type: String,
      default: null,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: String,
      enum: ['CUSTOMER', 'BARBER', 'SHOP_OWNER', null],
      default: null,
    },
    rejectedBy: {
      type: String,
      enum: ['BARBER', 'SHOP_OWNER', null],
      default: null,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ shopId: 1, barberId: 1, status: 1 });
appointmentSchema.index({ customerId: 1, createdAt: -1 });
appointmentSchema.index({ barberId: 1, status: 1, queueNumber: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
