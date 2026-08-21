import { z } from 'zod';

export const phoneRegex = /^[6-9]\d{9}$/;

export const createBarberSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    specialty: z.string().optional()
  })
});
