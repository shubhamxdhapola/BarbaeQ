import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    shopRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    barberRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

// One review per customer per shop & barber (editable anytime)
reviewSchema.index({ customerId: 1, shopId: 1, barberId: 1 }, { unique: true });
reviewSchema.index({ shopId: 1, createdAt: -1 });
reviewSchema.index({ barberId: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
