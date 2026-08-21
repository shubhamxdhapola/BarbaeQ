import mongoose from 'mongoose';
import { ShopStatus } from '../utils/constants.js';

const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    documents: {
      establishmentCert: String,
      addressProof: String,
      shopPhoto: String,
      gstin: String,
      shopProof: String
    },
    status: {
      type: String,
      enum: Object.values(ShopStatus),
      default: ShopStatus.PENDING
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    averageRating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    openingTime: {
      type: String,
      default: '09:00 AM'
    },
    closingTime: {
      type: String,
      default: '09:00 PM'
    },
    photos: {
      type: [String],
      default: []
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    googleMapsUrl: {
      type: String,
      default: ''
    },
    landmark: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

shopSchema.index({ city: 1, status: 1 });
shopSchema.index({ ownerId: 1 });

export const Shop = mongoose.model('Shop', shopSchema);
