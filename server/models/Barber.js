import mongoose from 'mongoose';

const barberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true
    },
    specialty: {
      type: String,
      default: 'General Haircut & Beard',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    delayMinutes: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

barberSchema.index({ shopId: 1, isDeleted: 1, isActive: 1 });
barberSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Barber = mongoose.model('Barber', barberSchema);
