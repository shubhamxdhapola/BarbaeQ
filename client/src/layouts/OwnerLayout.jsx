import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiStar } from 'react-icons/fi';
import { GiRazor } from 'react-icons/gi';

const navItems = [
  { to: '/owner/dashboard', label: 'Overview', icon: FiHome },
  { to: '/owner/barbers', label: 'Barbers', icon: FiUsers },
  { to: '/owner/services', label: 'Services', icon: GiRazor },
  { to: '/owner/appointments', label: 'Appointments', icon: FiCalendar },
  { to: '/owner/reviews', label: 'Reviews & Ratings', icon: FiStar },
  { to: '/owner/settings', label: 'Settings', icon: FiSettings },
];

export const OwnerLayout = () => {
  return (
    <DashboardLayout navItems={navItems} role="Shop Owner">
      <Outlet />
    </DashboardLayout>
  );
};
