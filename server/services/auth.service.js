import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { UserRole } from '../utils/constants.js';

export const phoneRegex = /^[6-9]\d{9}$/;

export const generateToken = (userId, activeRole) => {
  return jwt.sign(
    { id: userId, activeRole },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );
};

export const generateTempToken = (userId) => {
  return jwt.sign(
    { id: userId, isTemp: true },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
};

export const register = async (data) => {
  const targetRole = data.role || UserRole.CUSTOMER;
  const cleanPhone = (data.phone || '').trim();
  const cleanEmail = (data.email || '').toLowerCase().trim();

  if (!phoneRegex.test(cleanPhone)) {
    const error = new Error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
    error.statusCode = 400;
    throw error;
  }

  // Check if an account already exists with this phone number
  const existingUserByPhone = await User.findOne({ phone: cleanPhone }).select('+password');

  if (existingUserByPhone) {
    const roleLabel = targetRole === UserRole.SHOP_OWNER ? 'Shop Owner' : 'Customer';

    // If already registered with targetRole, return conflict
    if (existingUserByPhone.hasRole(targetRole)) {
      const error = new Error(`An account with phone number ${cleanPhone} is already registered as a ${roleLabel}. Please sign in.`);
      error.statusCode = 409;
      throw error;
    }

    // If user has not yet submitted existing password confirmation, return prompt to frontend
    if (!data.isConfirmingExisting) {
      return {
        requiresPasswordConfirmation: true,
        phone: cleanPhone,
        targetRole,
        message: `An account with phone number ${cleanPhone} already exists. Please enter your existing password to add ${roleLabel} access.`
      };
    }

    // Existing account adding targetRole: verify password against existing account
    const isMatch = await existingUserByPhone.comparePassword(data.password);
    if (!isMatch) {
      const error = new Error(`Incorrect password for ${cleanPhone}. Please enter your existing account password.`);
      error.statusCode = 401;
      throw error;
    }

    // Password matched: append new role object to existing user
    existingUserByPhone.roles.push({
      role: targetRole,
      isActive: true,
      addedAt: new Date()
    });
    if (data.name && (!existingUserByPhone.name || existingUserByPhone.name === 'User')) {
      existingUserByPhone.name = data.name.trim();
    }
    await existingUserByPhone.save();

    const activeRole = targetRole;
    const token = generateToken(existingUserByPhone._id.toString(), activeRole);
    const { password: _, ...userWithoutPassword } = existingUserByPhone.toObject();

    return {
      requiresPasswordConfirmation: false,
      user: { ...userWithoutPassword, activeRole, roles: existingUserByPhone.roles },
      token,
      message: `${roleLabel} access added to your account successfully!`
    };
  }

  // Brand new user registration: check email uniqueness
  const existingUserByEmail = await User.findOne({ email: cleanEmail });
  if (existingUserByEmail) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: data.name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password: data.password,
    roles: [{ role: targetRole, isActive: true, addedAt: new Date() }]
  });

  const activeRole = targetRole;
  const token = generateToken(user._id.toString(), activeRole);
  const { password: _, ...userWithoutPassword } = user.toObject();

  return {
    user: { ...userWithoutPassword, activeRole, roles: user.roles },
    token
  };
};

export const login = async (data) => {
  const cleanPhone = (data.phone || '').trim();

  if (!cleanPhone) {
    const error = new Error('Phone number is required');
    error.statusCode = 400;
    throw error;
  }

  // 1. Find User by globally unique phone
  const user = await User.findOne({ phone: cleanPhone }).select('+password');

  if (!user) {
    const error = new Error('Invalid phone number or password');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify password
  const isMatch = await user.comparePassword(data.password);
  if (!isMatch) {
    const error = new Error('Invalid phone number or password');
    error.statusCode = 401;
    throw error;
  }

  // 3. Verify active status
  if (!user.isActive) {
    const error = new Error('Your account has been deactivated');
    error.statusCode = 403;
    throw error;
  }

  const activeRoleNames = user.getActiveRoleNames();

  if (activeRoleNames.length === 0) {
    const error = new Error('All roles associated with your account are currently deactivated. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Role resolution
  // If user only has 1 role overall and it's active: login directly
  if (user.roles.length === 1 && activeRoleNames.length === 1) {
    const activeRole = activeRoleNames[0];
    const token = generateToken(user._id.toString(), activeRole);
    const { password: _, ...userWithoutPassword } = user.toObject();
    return {
      requiresRoleSelection: false,
      user: { ...userWithoutPassword, activeRole, roles: user.roles },
      token
    };
  }

  // If multiple roles exist and user explicitly selected a role beforehand that is active
  if (data.role && user.hasActiveRole(data.role)) {
    const activeRole = data.role;
    const token = generateToken(user._id.toString(), activeRole);
    const { password: _, ...userWithoutPassword } = user.toObject();
    return {
      requiresRoleSelection: false,
      user: { ...userWithoutPassword, activeRole, roles: user.roles },
      token
    };
  }

  // Multiple roles exist (or multi-role user with some deactivated): return roles for selection
  const tempToken = generateTempToken(user._id.toString());
  return {
    requiresRoleSelection: true,
    roles: user.roles,
    tempToken
  };
};

export const selectRole = async (role, tempToken) => {
  if (!tempToken) {
    const error = new Error('Authentication session required for role selection');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, env.JWT_SECRET);
  } catch (err) {
    const error = new Error('Role selection session has expired. Please sign in again.');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    const error = new Error('User not found or inactive');
    error.statusCode = 401;
    throw error;
  }

  // STRICT BACKEND VERIFICATION: Never trust client role
  if (!user.hasRole(role)) {
    const error = new Error('You do not have access to this role.');
    error.statusCode = 403;
    throw error;
  }

  if (!user.hasActiveRole(role)) {
    const error = new Error('This role is currently deactivated.');
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user._id.toString(), role);
  const { password: _, ...userWithoutPassword } = user.toObject();

  return {
    user: { ...userWithoutPassword, activeRole: role, roles: user.roles },
    token
  };
};

export const switchRole = async (userId, newRole) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User not found or inactive');
    error.statusCode = 401;
    throw error;
  }

  // STRICT BACKEND VERIFICATION
  if (!user.hasRole(newRole)) {
    const error = new Error('You do not have access to this role.');
    error.statusCode = 403;
    throw error;
  }

  if (!user.hasActiveRole(newRole)) {
    const error = new Error('This role is currently deactivated.');
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user._id.toString(), newRole);
  const { password: _, ...userWithoutPassword } = user.toObject();

  return {
    user: { ...userWithoutPassword, activeRole: newRole, roles: user.roles },
    token
  };
};

export const updateProfile = async (userId, data = {}, file = null) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.name) user.name = data.name.trim();

  // Barbers and Managers are not allowed to edit phone or email
  const isLockedRole = user.hasRole(UserRole.BARBER) || user.hasRole(UserRole.MANAGER);
  if (!isLockedRole) {
    // Email update
    if (data.email && data.email.toLowerCase().trim() !== user.email) {
      const cleanEmail = data.email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        const error = new Error('Please provide a valid email address');
        error.statusCode = 400;
        throw error;
      }

      const duplicateEmail = await User.findOne({
        _id: { $ne: user._id },
        email: cleanEmail
      });

      if (duplicateEmail) {
        const error = new Error('Email is already in use by another account');
        error.statusCode = 409;
        throw error;
      }

      user.email = cleanEmail;
    }

    // Phone update
    if (data.phone && data.phone.trim() !== user.phone) {
      const cleanPhone = data.phone.trim();
      if (!phoneRegex.test(cleanPhone)) {
        const error = new Error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
        error.statusCode = 400;
        throw error;
      }

      const duplicate = await User.findOne({
        _id: { $ne: user._id },
        phone: cleanPhone
      });

      if (duplicate) {
        const error = new Error('Phone number is already in use by another account');
        error.statusCode = 409;
        throw error;
      }

      user.phone = cleanPhone;
    }
  }

  if (data.avatar !== undefined) user.avatar = data.avatar;

  if (file) {
    user.avatar = file.path || `data:${file.mimetype};base64,${file.buffer?.toString('base64')}`;
  }

  await user.save();
  const { password: _, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

export const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password updated successfully' };
};
