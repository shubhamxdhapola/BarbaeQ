import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DashboardLayout } from './DashboardLayout';
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Settings
} from 'lucide-react';
import { UserRole } from '../utils/constants.js';

export const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  // const isManager = (user?.activeRole || user?.role) === UserRole.MANAGER;
  const isManager = false;

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/shops/pending', label: 'Pending Shops', icon: Clock },
    { to: '/admin/shops/approved', label: 'Approved Shops', icon: CheckCircle2 },
    { to: '/admin/shops/rejected', label: 'Rejected Shops', icon: XCircle },
    // { to: '/admin/managers', label: 'Managers', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  /*
  const managerNavItems = [
    { to: '/manager/shops/pending', label: 'Pending Shops', icon: Clock },
    { to: '/manager/shops/approved', label: 'Approved Shops', icon: CheckCircle2 },
    { to: '/manager/shops/rejected', label: 'Rejected Shops', icon: XCircle },
    { to: '/manager/settings', label: 'Settings', icon: Settings },
  ];
  */

  const navItems = adminNavItems;
  const roleLabel = 'Admin Portal';

  return (
    <DashboardLayout navItems={navItems} role={roleLabel}>
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;

