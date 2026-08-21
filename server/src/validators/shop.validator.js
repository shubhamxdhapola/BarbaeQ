import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
    address: z.string().min(5),
    city: z.string().min(2),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    googleMapsUrl: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    photos: z.array(z.string()).optional()
  })
});

export const updateShopSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9').optional(),
    address: z.string().min(5).optional(),
    city: z.string().min(2).optional(),
    isOpen: z.boolean().optional(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    googleMapsUrl: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    photos: z.array(z.string()).optional()
  })
});
