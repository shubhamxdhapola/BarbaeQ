import { z } from 'zod';
import { UserRole } from '../utils/constants.js';

export const phoneRegex = /^[6-9]\d{9}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum([UserRole.CUSTOMER, UserRole.SHOP_OWNER]).optional(),
  isConfirmingExisting: z.boolean().optional()
});

export const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(Object.values(UserRole)).optional()
});

export const selectRoleSchema = z.object({
  role: z.enum(Object.values(UserRole)),
  tempToken: z.string().min(1, 'Session token is required')
});
