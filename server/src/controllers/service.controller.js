import * as serviceService from '../services/service.service.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service.validator.js';

export const addService = async (req, res) => {
  try {
    const data = createServiceSchema.parse({ body: req.body }).body;
    const shopId = req.params.shopId;
    
    const service = await serviceService.addService(shopId, req.user._id, data);
    return res.status(201).json({ message: 'Service added successfully', data: service });
  } catch (error) {
    console.log('Error in addService controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to add service' });
  }
};

export const getShopServices = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const activeOnly = req.query.activeOnly === 'true';
    const { page, limit } = req.query;
    const result = await serviceService.getShopServices(shopId, { activeOnly, page, limit });
    return res.status(200).json({ 
      message: 'Services retrieved successfully', 
      data: result.services,
      pagination: result.pagination 
    });
  } catch (error) {
    console.log('Error in getShopServices controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateService = async (req, res) => {
  try {
    const data = updateServiceSchema.parse({ body: req.body }).body;
    const serviceId = req.params.id;
    
    const service = await serviceService.updateService(serviceId, req.user._id, data);
    return res.status(200).json({ message: 'Service updated successfully', data: service });
  } catch (error) {
    console.log('Error in updateService controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to update service' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const result = await serviceService.deleteService(serviceId, req.user._id);
    return res.status(200).json({ message: 'Service deleted successfully', data: result });
  } catch (error) {
    console.log('Error in deleteService controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to delete service' });
  }
};
