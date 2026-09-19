import { createBrowserRouter, Navigate } from 'react-router-dom';
import { OwnerLayout } from '../layouts/OwnerLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { BarberLayout } from '../layouts/BarberLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

import { DashboardPage as OwnerDashboard } from '../pages/owner/DashboardPage';
import { ShopRegistrationPage } from '../pages/owner/ShopRegistrationPage';
import { BarbersPage } from '../pages/owner/BarbersPage';
import { ServicesPage } from '../pages/owner/ServicesPage';
import { AppointmentsPage as OwnerAppointmentsPage } from '../pages/owner/AppointmentsPage';
import { SettingsPage as OwnerSettingsPage } from '../pages/owner/SettingsPage';
import { ReviewsPage as OwnerReviewsPage } from '../pages/owner/ReviewsPage';

import { AdminDashboardPage } from '../pages/admin/DashboardPage';
import { PendingShopsPage } from '../pages/admin/PendingShopsPage';
import { ApprovedShopsPage } from '../pages/admin/ApprovedShopsPage';
import { RejectedShopsPage } from '../pages/admin/RejectedShopsPage';
// import { ManagersPage } from '../pages/admin/ManagersPage';
import { SettingsPage as AdminSettingsPage } from '../pages/admin/SettingsPage';

// Customer Pages
import { HomePage } from '../pages/customer/HomePage';
import { ShopDetailPage } from '../pages/customer/ShopDetailPage';
import { ShopReviewsPage } from '../pages/customer/ShopReviewsPage';
import { BookingPage } from '../pages/customer/BookingPage';
import { BookingSuccessPage } from '../pages/customer/BookingSuccessPage';
import { AppointmentsPage as CustomerAppointmentsPage } from '../pages/customer/AppointmentsPage';
import { QueueTrackingPage } from '../pages/customer/QueueTrackingPage';
import { ProfilePage as CustomerProfilePage } from '../pages/customer/ProfilePage';

// Barber Pages
import { DashboardPage as BarberDashboardPage } from '../pages/barber/DashboardPage';
import { QueuePage as BarberQueuePage } from '../pages/barber/QueuePage';
import { AppointmentsPage as BarberAppointmentsPage } from '../pages/barber/AppointmentsPage';
import { ProfilePage as BarberProfilePage } from '../pages/barber/ProfilePage';
import { ReviewsPage as BarberReviewsPage } from '../pages/barber/ReviewsPage';

import { ProtectedRoute, GuestRoute } from '../components/ProtectedRoute';
import { UserRole } from '../utils/constants.js';

export const router = createBrowserRouter([
  // Public Auth routes (Restricted when already logged in)
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },

  // Customer routes
  {
    path: '/',
    element: (
      <ProtectedRoute roles={[UserRole.CUSTOMER]}>
        <CustomerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shops', element: <HomePage /> },
      { path: 'shops/:shopId', element: <ShopDetailPage /> },
      { path: 'shops/:shopId/reviews', element: <ShopReviewsPage /> },
      { path: 'booking/:shopId', element: <BookingPage /> },
      { path: 'booking/success/:appointmentId', element: <BookingSuccessPage /> },
      { path: 'appointments', element: <CustomerAppointmentsPage /> },
      { path: 'appointments/:appointmentId', element: <QueueTrackingPage /> },
      { path: 'profile', element: <CustomerProfilePage /> },
    ]
  },

  // Shop Owner routes
  {
    path: '/owner',
    element: (
      <ProtectedRoute roles={[UserRole.SHOP_OWNER]}>
        <OwnerLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <OwnerDashboard /> },
      { path: 'register-shop', element: <ShopRegistrationPage /> },
      { path: 'barbers', element: <BarbersPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'appointments', element: <OwnerAppointmentsPage /> },
      { path: 'reviews', element: <OwnerReviewsPage /> },
      { path: 'settings', element: <OwnerSettingsPage /> },
    ]
  },

  // Admin routes (ADMIN only)
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={[UserRole.ADMIN]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'shops/pending', element: <PendingShopsPage /> },
      { path: 'shops/approved', element: <ApprovedShopsPage /> },
      { path: 'shops/rejected', element: <RejectedShopsPage /> },
      // { path: 'managers', element: <ManagersPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ]
  },

  /*
  // Manager routes (MANAGER only) - [COMMENTED OUT]
  {
    path: '/manager',
    element: (
      <ProtectedRoute roles={[UserRole.MANAGER]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/manager/shops/pending" replace /> },
      { path: 'dashboard', element: <Navigate to="/manager/shops/pending" replace /> },
      { path: 'shops/pending', element: <PendingShopsPage /> },
      { path: 'shops/approved', element: <ApprovedShopsPage /> },
      { path: 'shops/rejected', element: <RejectedShopsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ]
  },
  */

  // Barber routes
  {
    path: '/barber',
    element: (
      <ProtectedRoute roles={[UserRole.BARBER]}>
        <BarberLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <BarberDashboardPage /> },
      { path: 'queue', element: <BarberQueuePage /> },
      { path: 'appointments', element: <BarberAppointmentsPage /> },
      { path: 'reviews', element: <BarberReviewsPage /> },
      { path: 'profile', element: <BarberProfilePage /> },
    ]
  },

  // Catch all
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
