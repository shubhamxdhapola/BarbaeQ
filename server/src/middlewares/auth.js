import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { UserRole } from '../utils/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Do not permit temp role selection tokens to access full protected APIs
    if (decoded.isTemp) {
      return res.status(401).json({ message: 'Role selection required to complete sign-in.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const activeRole = decoded.activeRole || user.role || UserRole.CUSTOMER;

    // Strict check: activeRole must exist in user's assigned roles AND be active
    if (!user.hasActiveRole(activeRole)) {
      return res.status(403).json({ message: 'This role is currently deactivated or not assigned to your account.' });
    }

    req.user = user;
    req.user.activeRole = activeRole;
    req.user.role = activeRole; // For backward compatibility

    next();
  } catch (error) {
    console.log('Error in authenticate middleware : ', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const currentRole = req.user?.activeRole || req.user?.role;
    if (!req.user || !roles.includes(currentRole)) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    next();
  };
};
