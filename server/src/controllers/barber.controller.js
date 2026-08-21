import * as barberService from '../services/barber.service.js';
import { createBarberSchema } from '../validators/barber.validator.js';
import { z } from 'zod';

export const addBarber = async (req, res) => {
  try {
    const data = createBarberSchema.parse({ body: req.body }).body;
    const shopId = req.params.shopId;
    
    const barber = await barberService.addBarber(shopId, req.user._id, data);
    return res.status(201).json({ message: 'Barber added successfully', data: barber });
  } catch (error) {
    console.log('Error in addBarber controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to add barber' });
  }
};

export const getShopBarbers = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const { page, limit, activeOnly } = req.query;
    const result = await barberService.getShopBarbers(shopId, { page, limit, activeOnly });
    return res.status(200).json({ 
      message: 'Barbers retrieved successfully', 
      data: result.barbers,
      pagination: result.pagination 
    });
  } catch (error) {
    console.log('Error in getShopBarbers controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateBarber = async (req, res) => {
  try {
    const updateSchema = z.object({ 
      body: z.object({ 
        isActive: z.boolean().optional(), 
        isAvailable: z.boolean().optional(), 
        specialty: z.string().optional(),
        name: z.string().optional(), 
        email: z.string().optional(), 
        phone: z.string().optional() 
      }) 
    });
    const data = updateSchema.parse({ body: req.body }).body;
    
    const barberId = req.params.id;
    const barber = await barberService.updateBarber(barberId, req.user._id, data);
    return res.status(200).json({ message: 'Barber updated successfully', data: barber });
  } catch (error) {
    console.log('Error in updateBarber controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to update barber' });
  }
};

export const deleteBarber = async (req, res) => {
  try {
    const barberId = req.params.id;
    const result = await barberService.deleteBarber(barberId, req.user._id);
    return res.status(200).json({ message: 'Barber deleted successfully', data: result });
  } catch (error) {
    console.log('Error in deleteBarber controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to delete barber' });
  }
};

export const toggleAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isAvailable } = req.body;
    const barber = await barberService.toggleAvailability(userId, isAvailable);
    return res.status(200).json({ message: 'Availability updated successfully', data: barber });
  } catch (error) {
    console.log('Error in toggleAvailability controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to update availability' });
  }
};

export const getMyBarberProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const barber = await barberService.getMyBarberProfile(userId);
    return res.status(200).json({ message: 'Barber profile retrieved', data: barber });
  } catch (error) {
    console.log('Error in getMyBarberProfile controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const setQueueDelay = async (req, res) => {
  try {
    const userId = req.user._id;
    const { delayMinutes } = req.body;
    const barber = await barberService.setQueueDelay(userId, delayMinutes);
    
    // Import socket emit if available
    const { emitQueueUpdate } = await import('../sockets/index.js');
    if (barber.shopId) {
      emitQueueUpdate(barber.shopId.toString(), barber._id.toString(), { type: 'DELAY_UPDATED', delayMinutes: barber.delayMinutes });
    }

    return res.status(200).json({ message: 'Queue delay updated successfully', data: barber });
  } catch (error) {
    console.log('Error in setQueueDelay controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to update queue delay' });
  }
};

export const lookupUser = async (req, res) => {
  try {
    const { phone, email } = req.query;
    const result = await barberService.lookupUser(phone, email);
    return res.status(200).json({ data: result });
  } catch (error) {
    console.log('Error in lookupUser controller : ', error);
    return res.status(500).json({ message: 'Failed to lookup user' });
  }
};
