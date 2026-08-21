import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { FiHome, FiList, FiCalendar, FiSettings, FiStar } from 'react-icons/fi';

const navItems = [
  { to: '/barber/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/barber/queue', label: 'My Queue', icon: FiList },
  { to: '/barber/appointments', label: 'Appointments', icon: FiCalendar },
  { to: '/barber/reviews', label: 'My Reviews', icon: FiStar },
  { to: '/barber/profile', label: 'Settings', icon: FiSettings },
];

export const BarberLayout = () => {
  return (
    <DashboardLayout navItems={navItems} role="Barber Panel">
      <Outlet />
    </DashboardLayout>
  );
};
