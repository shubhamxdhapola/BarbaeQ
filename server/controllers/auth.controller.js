import { registerSchema, loginSchema, selectRoleSchema } from '../validators/auth.validator.js';
import * as authService from '../services/auth.service.js';
import { formatErrorMessage } from '../utils/formatError.js';

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);

    if (result.requiresPasswordConfirmation) {
      return res.status(200).json(result);
    }

    authService.setTokenCookie(res, result.token);
    return res.status(201).json({
      message: result.message || 'User registered successfully',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.log('Error in register controller : ', error);
    const statusCode = error.code === 11000 ? 409 : (error.statusCode || 400);
    return res.status(statusCode).json({ message: formatErrorMessage(error, 'Registration failed') });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    
    // If multiple roles exist, prompt frontend for role selection
    if (result.requiresRoleSelection) {
      return res.status(200).json({
        message: 'Role selection required',
        requiresRoleSelection: true,
        roles: result.roles,
        tempToken: result.tempToken
      });
    }

    authService.setTokenCookie(res, result.token);
    return res.status(200).json({
      message: 'Login successful',
      requiresRoleSelection: false,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.log('Error in login controller : ', error);
    return res.status(error.statusCode || 400).json({ message: formatErrorMessage(error, 'Login failed') });
  }
};

export const selectRole = async (req, res) => {
  try {
    const { role, tempToken } = selectRoleSchema.parse(req.body);
    const { user, token } = await authService.selectRole(role, tempToken);
    authService.setTokenCookie(res, token);
    return res.status(200).json({
      message: 'Role selected successfully',
      user,
      token
    });
  } catch (error) {
    console.log('Error in selectRole controller : ', error);
    return res.status(error.statusCode || 400).json({ message: formatErrorMessage(error, 'Role selection failed') });
  }
};

export const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required to switch' });
    }
    const { user, token } = await authService.switchRole(req.user._id, role);
    authService.setTokenCookie(res, token);
    return res.status(200).json({
      message: 'Role switched successfully',
      user,
      token
    });
  } catch (error) {
    console.log('Error in switchRole controller : ', error);
    return res.status(error.statusCode || 400).json({ message: formatErrorMessage(error, 'Role switch failed') });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie('token', { path: '/' });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Error in logout controller : ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = (req, res) => {
  try {
    const userObj = req.user.toObject ? req.user.toObject() : req.user;
    return res.status(200).json({
      user: {
        ...userObj,
        activeRole: req.user.activeRole || req.user.role,
        roles: req.user.roles || []
      }
    });
  } catch (error) {
    console.log('Error in getMe controller : ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await authService.updateProfile(req.user._id, req.body, req.file);
    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.log('Error in updateProfile controller : ', error);
    const statusCode = error.code === 11000 ? 409 : (error.statusCode || 400);
    return res.status(statusCode).json({ message: formatErrorMessage(error, 'Failed to update profile') });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    const result = await authService.updatePassword(req.user._id, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    console.log('Error in updatePassword controller : ', error);
    return res.status(error.statusCode || 400).json({ message: formatErrorMessage(error, 'Failed to update password') });
  }
};
