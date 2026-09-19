import * as adminService from '../services/admin.service.js';

export const getPendingShops = async (req, res) => {
  try {
    const shops = await adminService.getPendingShops();
    return res.status(200).json({ message: 'Pending shops retrieved successfully', data: shops });
  } catch (error) {
    console.log('Error in getPendingShops controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getApprovedShops = async (req, res) => {
  try {
    const shops = await adminService.getApprovedShops();
    return res.status(200).json({ message: 'Approved shops retrieved successfully', data: shops });
  } catch (error) {
    console.log('Error in getApprovedShops controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getRejectedShops = async (req, res) => {
  try {
    const shops = await adminService.getRejectedShops();
    return res.status(200).json({ message: 'Rejected shops retrieved successfully', data: shops });
  } catch (error) {
    console.log('Error in getRejectedShops controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getShopDetails = async (req, res) => {
  try {
    const details = await adminService.getShopDetails(req.params.id);
    return res.status(200).json({ message: 'Shop details retrieved successfully', data: details });
  } catch (error) {
    console.log('Error in getShopDetails controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const approveShop = async (req, res) => {
  try {
    const approverUserId = req.user?._id;
    const shop = await adminService.approveShop(req.params.id, approverUserId);
    return res.status(200).json({ message: 'Shop approved successfully', data: shop });
  } catch (error) {
    console.log('Error in approveShop controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const rejectShop = async (req, res) => {
  try {
    const rejecterUserId = req.user?._id;
    const shop = await adminService.rejectShop(req.params.id, rejecterUserId);
    return res.status(200).json({ message: 'Shop rejected successfully', data: shop });
  } catch (error) {
    console.log('Error in rejectShop controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const toggleShopActive = async (req, res) => {
  try {
    const shop = await adminService.toggleShopActive(req.params.id);
    return res.status(200).json({ message: 'Shop status updated successfully', data: shop });
  } catch (error) {
    console.log('Error in toggleShopActive controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const deleteShop = async (req, res) => {
  try {
    const result = await adminService.deleteShop(req.params.id);
    return res.status(200).json({ message: 'Shop deleted successfully', data: result });
  } catch (error) {
    console.log('Error in deleteShop controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

// Manager controllers
export const createManager = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields (name, email, phone, password) are required' });
    }
    const manager = await adminService.createManager({ name, email, phone, password });
    return res.status(201).json({ message: 'Manager created successfully', data: manager });
  } catch (error) {
    console.log('Error in createManager controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const getManagers = async (req, res) => {
  try {
    const managers = await adminService.getManagers();
    return res.status(200).json({ message: 'Managers retrieved successfully', data: managers });
  } catch (error) {
    console.log('Error in getManagers controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateManager = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const manager = await adminService.updateManager(req.params.id, { name, email, phone, password });
    return res.status(200).json({ message: 'Manager updated successfully', data: manager });
  } catch (error) {
    console.log('Error in updateManager controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const toggleManagerStatus = async (req, res) => {
  try {
    const manager = await adminService.toggleManagerStatus(req.params.id);
    return res.status(200).json({ message: 'Manager status updated successfully', data: manager });
  } catch (error) {
    console.log('Error in toggleManagerStatus controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};

export const deleteManager = async (req, res) => {
  try {
    const result = await adminService.deleteManager(req.params.id);
    return res.status(200).json({ message: 'Manager deleted successfully', data: result });
  } catch (error) {
    console.log('Error in deleteManager controller : ', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
  }
};
