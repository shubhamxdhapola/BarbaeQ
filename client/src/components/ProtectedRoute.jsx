import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UserRole } from '../utils/constants.js';

export const getRoleHomeUrl = (role) => {
  const roleRedirects = {
    [UserRole.CUSTOMER]: '/',
    [UserRole.SHOP_OWNER]: '/owner/dashboard',
    [UserRole.BARBER]: '/barber/dashboard',
    [UserRole.ADMIN]: '/admin/dashboard',
    // [UserRole.MANAGER]: '/manager/shops/pending',
  };
  return roleRedirects[role] || '/';
};

export const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticating } = useSelector((state) => state.auth);
  const location = useLocation();
  const isAuthenticated = !!user;

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use activeRole from JWT, fallback to role virtual
  const currentRole = user.activeRole || user.role;

  if (roles && user && !roles.includes(currentRole)) {
    return <Navigate to={getRoleHomeUrl(currentRole)} replace />;
  }

  return <>{children}</>;
};

export const GuestRoute = ({ children }) => {
  const { user, isAuthenticating } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const currentRole = user.activeRole || user.role;
    const from = location.state?.from?.pathname;
    if (from && from !== '/login' && from !== '/register') {
      return <Navigate to={from} replace />;
    }
    return <Navigate to={getRoleHomeUrl(currentRole)} replace />;
  }

  return <>{children}</>;
};
