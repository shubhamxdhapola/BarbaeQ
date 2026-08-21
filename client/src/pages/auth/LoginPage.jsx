import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Scissors, Store, Shield, Users, User } from 'lucide-react';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { AuthLayout } from '../../layouts/AuthLayout';
import { loginUser, selectRole, resetRoleSelection, clearAuthError } from '../../redux/slices/auth.slice.js';
import { UserRole } from '../../utils/constants.js';

const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number starting with 6, 7, 8, or 9'),
  password: z.string().min(1, 'Password is required'),
});

const ROLE_META = {
  [UserRole.CUSTOMER]: {
    label: 'Customer',
    description: 'Book services & track queue',
    icon: User,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    redirect: '/',
  },
  [UserRole.SHOP_OWNER]: {
    label: 'Shop Owner',
    description: 'Manage your barbershop',
    icon: Store,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    redirect: '/owner/dashboard',
  },
  [UserRole.BARBER]: {
    label: 'Barber',
    description: 'Manage your queue & appointments',
    icon: Scissors,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    redirect: '/barber/dashboard',
  },
  /*
  [UserRole.MANAGER]: {
    label: 'Manager',
    description: 'Oversee shop approvals',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    redirect: '/manager/shops/pending',
  },
  */
  [UserRole.ADMIN]: {
    label: 'Admin',
    description: 'Full platform control',
    icon: Shield,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    redirect: '/admin/dashboard',
  },
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error: authError, roleSelectionData } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
    // For phone input, restrict to digits and max 10 chars
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      loginSchema.parse(formData);
      setErrors({});
      
      const resultAction = await dispatch(loginUser({
        phone: formData.phone.trim(),
        password: formData.password
      }));
      
      if (loginUser.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;

        // If requiresRoleSelection is true, the slice stores roleSelectionData
        // and the UI will switch to role selection view automatically
        if (payload?.requiresRoleSelection) {
          return; // Stop here, role selection UI will render
        }

        // Single role - navigate directly
        const user = payload;
        const from = location.state?.from?.pathname;
        
        if (from && from !== '/login') {
          navigate(from, { replace: true });
        } else {
          const activeRole = user.activeRole || user.role;
          const meta = ROLE_META[activeRole];
          navigate(meta?.redirect || '/', { replace: true });
        }
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

  const handleSelectRole = async (role) => {
    if (!roleSelectionData?.tempToken) return;

    const resultAction = await dispatch(selectRole({
      role,
      tempToken: roleSelectionData.tempToken,
    }));

    if (selectRole.fulfilled.match(resultAction)) {
      const user = resultAction.payload;
      const from = location.state?.from?.pathname;
      
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        const activeRole = user.activeRole || user.role;
        const meta = ROLE_META[activeRole];
        navigate(meta?.redirect || '/', { replace: true });
      }
    }
  };

  const handleBackToLogin = () => {
    dispatch(resetRoleSelection());
    setFormData({ phone: '', password: '' });
  };

  // ─── Role Selection View ───
  if (roleSelectionData?.requiresRoleSelection) {
    return (
      <AuthLayout
        tag="CONTINUE AS"
        headingPrefix="Choose your "
        highlightWord="dashboard."
        description="Your account has multiple roles. Select which dashboard you'd like to access."
        features={[
          "Switch between roles anytime",
          "All your data stays connected",
          "One account, multiple dashboards"
        ]}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Continue as</h2>
          <p className="text-gray-500 text-sm">Select a role to access its dashboard</p>
        </div>

        {authError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{authError}</p>
          </div>
        )}

        <div className="space-y-3">
          {roleSelectionData.roles.map((item) => {
            const roleName = typeof item === 'object' ? item.role : item;
            const isRoleActive = typeof item === 'object' ? item.isActive !== false : true;
            const meta = ROLE_META[roleName];
            if (!meta) return null;
            const Icon = meta.icon;

            return (
              <button
                key={roleName}
                onClick={() => isRoleActive && handleSelectRole(roleName)}
                disabled={isLoading || !isRoleActive}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                  !isRoleActive
                    ? 'border-zinc-200/80 bg-zinc-50/70 opacity-60 cursor-not-allowed'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  !isRoleActive ? 'bg-zinc-100 text-zinc-400 border-zinc-200' : meta.color
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${!isRoleActive ? 'text-zinc-500' : 'text-zinc-900 group-hover:text-zinc-800'}`}>
                      {meta.label}
                    </p>
                    {!isRoleActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{meta.description}</p>
                </div>
                {isRoleActive ? (
                  <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <span className="text-[11px] font-medium text-zinc-400">Disabled</span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex justify-center mt-6">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        )}

        <button
          onClick={handleBackToLogin}
          className="mt-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mx-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>
      </AuthLayout>
    );
  }

  // ─── Normal Login Form ───
  return (
    <AuthLayout
      tag="WELCOME BACK"
      headingPrefix="Where style "
      highlightWord="meets punctuality."
      description="Sign in to your account to monitor real-time queue wait times, manage bookings, and enjoy effortless salon visits."
      features={[
        "Real-time queue countdowns & live status",
        "Direct appointment management & history",
        "Seamless shop re-booking in one tap"
      ]}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Welcome back</h2>
        <p className="text-gray-500 text-sm">Sign in using your mobile number and password</p>
      </div>

      {authError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
              autoComplete="tel"
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
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full flex justify-center py-3 mt-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500">Don't have an account? </span>
        <Link 
          to="/register" 
          onClick={() => dispatch(clearAuthError())}
          className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
        >
          Sign up now
        </Link>
      </div>
    </AuthLayout>
  );
};
