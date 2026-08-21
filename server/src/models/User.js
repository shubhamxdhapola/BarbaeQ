import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../utils/constants.js';

const roleItemSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false },
  roles: {
    type: [roleItemSchema],
    default: () => [{ role: UserRole.CUSTOMER, isActive: true, addedAt: new Date() }]
  },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Enforce globally unique phone index
userSchema.index({ phone: 1 }, { unique: true });

// Virtual getter for backward compatibility with code expecting user.role
userSchema.virtual('role').get(function() {
  if (!this.roles || this.roles.length === 0) return UserRole.CUSTOMER;
  const active = this.roles.find(r => typeof r === 'object' ? r.isActive !== false : true);
  if (active) return typeof active === 'object' ? active.role : active;
  return typeof this.roles[0] === 'object' ? this.roles[0].role : this.roles[0];
});

// Helper method to check if user has a specific role (active or inactive)
userSchema.methods.hasRole = function(roleName) {
  if (!Array.isArray(this.roles)) return false;
  return this.roles.some(r => (typeof r === 'string' ? r === roleName : r.role === roleName));
};

// Helper method to check if user has an ACTIVE role
userSchema.methods.hasActiveRole = function(roleName) {
  if (!Array.isArray(this.roles)) return false;
  return this.roles.some(r => {
    if (typeof r === 'string') return r === roleName;
    return r.role === roleName && r.isActive !== false;
  });
};

// Helper method to get active role names list
userSchema.methods.getActiveRoleNames = function() {
  if (!Array.isArray(this.roles)) return [];
  return this.roles
    .filter(r => (typeof r === 'string' ? true : r.isActive !== false))
    .map(r => (typeof r === 'string' ? r : r.role));
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
