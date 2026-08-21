import * as shopService from '../services/shop.service.js';
import { createShopSchema, updateShopSchema } from '../validators/shop.validator.js';

export const createShop = async (req, res) => {
  try {
    const data = createShopSchema.parse({ body: req.body }).body;
    const files = req.files;
    
    const shop = await shopService.createShop(req.user._id, data, files);
    return res.status(201).json({ message: 'Shop created successfully', data: shop });
  } catch (error) {
    console.log('Error in createShop controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to create shop' });
  }
};

export const getShops = async (req, res) => {
  try {
    const { city, search } = req.query;
    const shops = await shopService.getApprovedShops(city, search);
    return res.status(200).json({ message: 'Shops retrieved successfully', data: shops });
  } catch (error) {
    console.log('Error in getShops controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getShopById = async (req, res) => {
  try {
    const shop = await shopService.getShopById(req.params.id);
    return res.status(200).json({ message: 'Shop retrieved successfully', data: shop });
  } catch (error) {
    console.log('Error in getShopById controller : ', error);
    return res.status(error.statusCode || 404).json({ message: error.message || 'Shop not found' });
  }
};

export const getMyShop = async (req, res) => {
  try {
    const shop = await shopService.getOwnerShop(req.user._id);
    return res.status(200).json({ message: 'Shop retrieved successfully', data: shop });
  } catch (error) {
    console.log('Error in getMyShop controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateShop = async (req, res) => {
  try {
    const data = updateShopSchema.parse({ body: req.body }).body;
    const shop = await shopService.updateShop(req.params.id, req.user._id, data);
    return res.status(200).json({ message: 'Shop updated successfully', data: shop });
  } catch (error) {
    console.log('Error in updateShop controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to update shop' });
  }
};

export const uploadShopPhotos = async (req, res) => {
  try {
    const shop = await shopService.uploadShopPhotos(req.user._id, req.files);
    return res.status(200).json({ message: 'Photos uploaded successfully', data: shop });
  } catch (error) {
    console.log('Error in uploadShopPhotos controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to upload photos' });
  }
};

export const deleteShopPhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ message: 'photoUrl is required' });
    }
    const shop = await shopService.deleteShopPhoto(req.user._id, photoUrl);
    return res.status(200).json({ message: 'Photo deleted successfully', data: shop });
  } catch (error) {
    console.log('Error in deleteShopPhoto controller : ', error);
    return res.status(error.statusCode || 400).json({ message: error.message || 'Failed to delete photo' });
  }
};
