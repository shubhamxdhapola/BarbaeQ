import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Users, Store, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { AuthLayout } from '../../layouts/AuthLayout';
import { registerUser, clearAuthError } from '../../redux/slices/auth.slice.js';
import { getRoleHomeUrl } from '../../components/ProtectedRoute.jsx';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'SHOP_OWNER']),
});

export const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error: authError } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // State for existing account password confirmation step
  const [existingAccountInfo, setExistingAccountInfo] = useState(null);
  const [existingPassword, setExistingPassword] = useState('');
  const [existingPasswordError, setExistingPasswordError] = useState('');
  const [showExistingPassword, setShowExistingPassword] = useState(false);

  // Clear stale auth errors on mount and unmount
  useEffect(() => {
    dispatch(clearAuthError());
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (authError) {
      dispatch(clearAuthError());
    }
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleSelect = (role) => {
    if (authError) {
      dispatch(clearAuthError());
    }
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      registerSchema.parse(formData);
      setErrors({});
      
      const resultAction = await dispatch(registerUser(formData));
      
      if (registerUser.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;

        // If account already exists with this phone, switch to password confirmation view
        if (payload?.requiresPasswordConfirmation) {
          setExistingAccountInfo(payload);
          setExistingPassword('');
          setExistingPasswordError('');
          return;
        }

        const user = payload?.user || payload;
        const targetRole = user?.activeRole || user?.role || formData.role;
        toast.success('Account created successfully!');
        navigate(getRoleHomeUrl(targetRole));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleConfirmExistingPassword = async (e) => {
    e.preventDefault();
    if (!existingPassword) {
      setExistingPasswordError('Please enter your account password');
      return;
    }

    try {
      setExistingPasswordError('');
      const targetRole = existingAccountInfo?.targetRole || formData.role || 'CUSTOMER';
      
      const resultAction = await dispatch(registerUser({
        phone: existingAccountInfo.phone,
        password: existingPassword,
        role: targetRole,
        isConfirmingExisting: true,
      }));

      if (registerUser.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        const user = payload?.user || payload;
        const roleLabel = targetRole === 'SHOP_OWNER' ? 'Shop Owner' : 'Customer';
        toast.success(`${roleLabel} access activated!`);
        navigate(getRoleHomeUrl(targetRole));
      }
    } catch (err) {
      // handled by redux authError
    }
  };

  const handleBackToRegister = () => {
    setExistingAccountInfo(null);
    setExistingPassword('');
    setExistingPasswordError('');
    dispatch(clearAuthError());
  };

  // ─── Existing Account Password Confirmation View ───
  if (existingAccountInfo) {
    const targetRoleLabel = existingAccountInfo.targetRole === 'SHOP_OWNER' ? 'Shop Owner' : 'Customer';
    const rolesList = existingAccountInfo.existingRoles || [];

    return (
      <AuthLayout
        tag="EXISTING ACCOUNT"
        headingPrefix="One account, "
        highlightWord="multiple profiles."
        description="Your phone number is already registered on BarbaeQ. Verify your password to instantly activate Customer access on your existing profile."
        features={[
          "Keep your single login credentials",
          "Switch between profiles anytime with 1 tap",
          "All your history stays securely linked"
        ]}
      >
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mb-4 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-1.5">Account Found</h2>
          <p className="text-zinc-500 text-sm">
            An account with mobile number <strong className="text-zinc-800">+91 {existingAccountInfo.phone}</strong> is already registered. Enter your account password to add {targetRoleLabel} access.
          </p>
        </div>

        {authError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{authError}</p>
          </div>
        )}

        <form onSubmit={handleConfirmExistingPassword} className="space-y-4">
          <div>
            <label className="label" htmlFor="existingPassword">
              Enter Account Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="existingPassword"
                name="existingPassword"
                type={showExistingPassword ? 'text' : 'password'}
                value={existingPassword}
                onChange={(e) => {
                  setExistingPassword(e.target.value);
                  if (existingPasswordError) setExistingPasswordError('');
                }}
                className={`input pl-11 pr-11 ${existingPasswordError ? 'input-error' : ''}`}
                placeholder="Enter your existing password"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowExistingPassword(!showExistingPassword)}
              >
                {showExistingPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {existingPasswordError && <p className="mt-1.5 text-sm text-red-500">{existingPasswordError}</p>}
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex justify-center py-3 mt-6 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              `Verify & Activate ${targetRoleLabel} Access`
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            onClick={handleBackToRegister}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign Up
          </button>
          <Link 
            to="/login" 
            onClick={() => dispatch(clearAuthError())}
            className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ─── Normal Registration Form ───
  return (
    <AuthLayout
      tag="JOIN BARBAEQ"
      headingPrefix="Elevate your "
      highlightWord="grooming experience."
      description="Create your account to skip crowded waiting rooms, reserve live queue slots on demand, or register your barbershop to elevate customer satisfaction."
      features={[
        "Zero waiting room delays for customers",
        "Automated queue & staff tracking for shop owners",
        "Transparent ratings & verified stylist reviews"
      ]}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Create your account</h2>
        <p className="text-gray-500 text-sm">Join BarbaeQ today</p>
      </div>

      {authError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleRoleSelect('CUSTOMER')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              formData.role === 'CUSTOMER'
                ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold'
                : 'border-gray-100 bg-white hover:border-gray-200 text-gray-500'
            }`}
          >
            <Users className={`w-6 h-6 mb-2 ${formData.role === 'CUSTOMER' ? 'text-primary-600' : ''}`} />
            <span className="text-sm">I'm a Customer</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleRoleSelect('SHOP_OWNER')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              formData.role === 'SHOP_OWNER'
                ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold'
                : 'border-gray-100 bg-white hover:border-gray-200 text-gray-500'
            }`}
          >
            <Store className={`w-6 h-6 mb-2 ${formData.role === 'SHOP_OWNER' ? 'text-primary-600' : ''}`} />
            <span className="text-sm">I'm a Shop Owner</span>
          </button>
        </div>

        <div>
          <label className="label" htmlFor="name">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`input pl-11 ${errors.name ? 'input-error' : ''}`}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`input pl-11 ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="phone">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
              className={`input pl-11 ${errors.phone ? 'input-error' : ''}`}
              placeholder="10-digit mobile number"
              disabled={isLoading}
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`input pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full flex justify-center py-3 mt-6 cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500">Already have an account? </span>
        <Link 
          to="/login" 
          onClick={() => dispatch(clearAuthError())}
          className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
