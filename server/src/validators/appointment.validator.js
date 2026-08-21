import { z } from 'zod';

export const createAppointmentSchema = z.object({
  shopId: z.string({
    required_error: 'Shop ID is required',
  }),
  barberId: z.string({
    required_error: 'Barber ID is required',
  }),
  serviceId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
}).refine(data => data.serviceId || (data.serviceIds && data.serviceIds.length > 0), {
  message: 'At least one service must be selected',
  path: ['serviceIds'],
});

export const createWalkInSchema = z.object({
  customerName: z.string({ required_error: 'Customer name is required' }).min(1, 'Customer name is required').trim(),
  phone: z.string()
    .transform(val => (val ? val.trim() : ''))
    .refine(val => !val || /^[6-9]\d{9}$/.test(val), {
      message: 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'
    })
    .optional(),
  serviceId: z.string({ required_error: 'Service is required' }),
});
