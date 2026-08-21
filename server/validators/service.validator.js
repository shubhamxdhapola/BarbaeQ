import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    duration: z.number().min(5).max(240),
    price: z.number().min(0)
  })
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    duration: z.number().min(5).max(240).optional(),
    price: z.number().min(0).optional(),
    isActive: z.boolean().optional()
  })
});
