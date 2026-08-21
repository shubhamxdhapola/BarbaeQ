import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  LogOut, 
  Sparkles,
  Shield,
  Layers,
  CircleDot,
  RotateCw,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser } from '../redux/slices/auth.slice.js';
import { fetchMyShop } from '../redux/slices/shop.slice.js';
import { fetchShopBarbers, fetchMyBarberProfile } from '../redux/slices/barber.slice.js';
import { fetchShopServices } from '../redux/slices/service.slice.js';
import { fetchShopAppointments, fetchBarberQueue, fetchBarberAppointments } from '../redux/slices/appointment.slice.js';
import { fetchShopReviews, fetchMyBarberReviews } from '../redux/slices/review.slice.js';
import { 
  fetchPendingShops, 
  fetchApprovedShopsAdmin, 
  fetchRejectedShopsAdmin, 
  fetchManagersAdmin 
} from '../redux/slices/admin.slice.js';
import { Logo, LogoIcon } from '../components/ui/Logo.jsx';
import { ScrollToTop } from '../components/common/ScrollToTop.jsx';
import { RoleSwitcherModal } from '../components/ui/RoleSwitcherModal.jsx';
import { UserRole } from '../utils/constants.js';

const getInitials = (name) => {
  if (!name) return 'BQ';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export function DashboardLayout({ navItems = [], role = 'Portal' }) {
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  const { user } = useSelector((state) => state.auth);
  const { myShop } = useSelector((state) => state.shop);
  const { myProfile } = useSelector((state) => state.barber);

  const currentRole = user?.activeRole || user?.role;

  useEffect(() => {
    if (currentRole === UserRole.SHOP_OWNER && !myShop) {
      dispatch(fetchMyShop());
    } else if (currentRole === UserRole.BARBER && !myProfile) {
      dispatch(fetchMyBarberProfile());
    }
  }, [dispatch, currentRole, myShop, myProfile]);

  const isUnregisteredOwner = currentRole === UserRole.SHOP_OWNER && (!myShop || !myShop._id || myShop.status !== 'APPROVED');
  const isUnregisteredBarber = currentRole === UserRole.BARBER && (!myProfile || !myProfile.shopId);
  const showNavbarLogout = isUnregisteredOwner || isUnregisteredBarber;

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/manager')) {
        // Admin & Manager role data synchronization
        if (location.pathname.includes('/pending')) {
          await dispatch(fetchPendingShops()).unwrap();
        } else if (location.pathname.includes('/approved')) {
          await dispatch(fetchApprovedShopsAdmin()).unwrap();
        } else if (location.pathname.includes('/rejected')) {
          await dispatch(fetchRejectedShopsAdmin()).unwrap();
        } else if (location.pathname.includes('/managers')) {
          await dispatch(fetchManagersAdmin()).unwrap();
        } else if (location.pathname.includes('/settings')) {
          // Admin/Manager settings - no shop needed
        } else {
          // Admin Dashboard & general overview - refresh all admin collections
          await Promise.allSettled([
            dispatch(fetchPendingShops()),
            dispatch(fetchApprovedShopsAdmin()),
            dispatch(fetchRejectedShopsAdmin()),
            ...(location.pathname.startsWith('/admin') ? [dispatch(fetchManagersAdmin())] : []),
          ]);
        }
      } else if (location.pathname.startsWith('/barber')) {
        // Barber role data synchronization
        if (location.pathname.includes('/queue')) {
          await dispatch(fetchBarberQueue()).unwrap();
        } else if (location.pathname.includes('/appointments')) {
          await dispatch(fetchBarberAppointments()).unwrap();
        } else if (location.pathname.includes('/reviews') || location.pathname.includes('/review')) {
          await dispatch(fetchMyBarberReviews()).unwrap();
        } else {
          await Promise.allSettled([
            dispatch(fetchMyBarberProfile()),
            dispatch(fetchBarberQueue()),
            dispatch(fetchBarberAppointments()),
            dispatch(fetchMyBarberReviews()),
          ]);
        }
      } else {
        // Shop Owner & other roles data synchronization
        const res = await dispatch(fetchMyShop()).unwrap();
        const shopId = res?._id || myShop?._id;
        if (shopId) {
          if (location.pathname.includes('barber')) {
            await dispatch(fetchShopBarbers(shopId)).unwrap();
          } else if (location.pathname.includes('service')) {
            await dispatch(fetchShopServices({ shopId })).unwrap();
          } else if (location.pathname.includes('appointment')) {
            await dispatch(fetchShopAppointments({ shopId, range: 'all' })).unwrap();
          } else if (location.pathname.includes('review')) {
            await Promise.allSettled([
              dispatch(fetchShopReviews({ shopId })),
              dispatch(fetchShopBarbers(shopId)),
            ]);
          } else {
            // Dashboard or other tab - refresh all key datasets
            await Promise.allSettled([
              dispatch(fetchShopAppointments({ shopId, range: 'all' })),
              dispatch(fetchShopBarbers(shopId)),
              dispatch(fetchShopServices({ shopId })),
              dispatch(fetchShopReviews({ shopId }))
            ]);
          }
        }
      }
      toast.success('Latest data synced!', { id: 'manual-refresh', duration: 2000 });
    } catch (err) {
      console.error('Refresh error', err);
      toast.success('Data synced', { id: 'manual-refresh', duration: 2000 });
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    }
  };
  
  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  // Close mobile menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      navigate('/login');
    }
  };

  // Find active nav item label for header display
  const currentNavItem = navItems.find(item => location.pathname.startsWith(item.to)) || navItems[0];

  const navItemClass = ({ isActive }) => {
    const base = "flex items-center gap-3 transition-all duration-150 outline-none text-xs sm:text-sm font-semibold cursor-pointer group";
    
    if (desktopSidebarExpanded) {
      const active = "mx-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 text-white shadow-sm font-bold";
      const inactive = "mx-2 px-3.5 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-medium";
      return `${base} ${isActive ? active : inactive}`;
    } else {
      const active = "mx-auto w-10 h-10 rounded-xl bg-zinc-900 text-white shadow-sm justify-center font-bold";
      const inactive = "mx-auto w-10 h-10 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 justify-center font-medium";
      return `${base} ${isActive ? active : inactive}`;
    }
  };

  const mobileNavItemClass = ({ isActive }) => {
    const base = "flex items-center gap-3 mx-2 px-4 py-3 rounded-xl transition-all duration-150 outline-none text-sm font-semibold cursor-pointer";
    const active = "bg-zinc-900 text-white shadow-sm font-bold";
    const inactive = "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-medium";
    return `${base} ${isActive ? active : inactive}`;
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/70 text-zinc-900 font-sans antialiased">
      <ScrollToTop />
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-50 w-[270px] bg-white shadow-xl lg:hidden flex flex-col justify-between border-r border-zinc-200"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                <Logo size="sm" subtitle="Your Queue, Simplified." />
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Nav items */}
              <nav className="py-4 flex flex-col gap-2">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={idx} to={item.to} className={mobileNavItemClass}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            
            {/* User Profile Footer */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50 m-2.5 rounded-2xl border border-zinc-200 space-y-2.5">
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-zinc-200 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate leading-snug">{user?.name || 'User'}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5 truncate">{role}</p>
                </div>
              </div>

              {user?.roles && user.roles.length > 1 && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setRoleModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-200/80 shadow-2xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Switch Role</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-900 text-white font-bold">
                    {user.roles.length} roles
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col justify-between bg-white border-r border-zinc-200/80 transition-all duration-300 ${
          desktopSidebarExpanded ? "w-[260px]" : "w-[80px]"
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className={`flex items-center h-[72px] border-b border-zinc-100 ${desktopSidebarExpanded ? "px-4 justify-between" : "justify-center"}`}>
            {desktopSidebarExpanded ? (
              <Logo size="sm" subtitle="Your Queue, Simplified." />
            ) : (
              <LogoIcon size="md" />
            )}
            
            {desktopSidebarExpanded && (
              <button 
                onClick={() => setDesktopSidebarExpanded(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expand Button for Collapsed Mode */}
          {!desktopSidebarExpanded && (
            <div className="pt-2.5 pb-1 flex justify-center">
              <button 
                onClick={() => setDesktopSidebarExpanded(true)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-all cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="py-4 flex flex-col gap-2">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={idx} 
                  to={item.to} 
                  className={navItemClass} 
                  title={!desktopSidebarExpanded ? item.label : ""}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {desktopSidebarExpanded && (
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile Mini Footer */}
        <div className={`border-t border-zinc-100 ${desktopSidebarExpanded ? "p-2.5" : "p-2 pb-3"}`}>
          <button 
            onClick={() => {
              const profilePath = location.pathname.startsWith('/barber')
                ? '/barber/profile'
                : location.pathname.startsWith('/owner')
                ? '/owner/settings'
                : location.pathname.startsWith('/manager')
                ? '/manager/settings'
                : location.pathname.startsWith('/admin')
                ? '/admin/settings'
                : navItems.find((i) => i.to.includes('profile') || i.to.includes('settings'))?.to || '/';
              navigate(profilePath);
            }}
            className={`w-full text-left transition-all cursor-pointer ${
              desktopSidebarExpanded 
                ? "p-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/80 flex items-center gap-2.5 shadow-2xs" 
                : "flex justify-center"
            }`}
            title="Account Settings"
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-9 h-9 rounded-xl object-cover border border-zinc-200 shrink-0" 
                title={!desktopSidebarExpanded ? user?.name : ""} 
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs" 
                title={!desktopSidebarExpanded ? user?.name : ""}
              >
                {getInitials(user?.name)}
              </div>
            )}

            {desktopSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate leading-snug">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5 truncate">{role}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${desktopSidebarExpanded ? "lg:pl-[260px]" : "lg:pl-[80px]"}`}>
        
        {/* Modern Sticky Frosted Glass Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 lg:h-[72px] px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Brand Name & Tagline (No Logo Icon) */}
            <div className="lg:hidden flex items-center">
              <Logo size="sm" showIcon={false} subtitle="Your Queue, Simplified." />
            </div>

            {/* Desktop Breadcrumb / Current Route Indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">{role}</span>
              <span className="text-zinc-300 font-bold">/</span>
              <span className="text-xs font-bold text-zinc-900">{currentNavItem?.label || 'Overview'}</span>
            </div>
          </div>
          
          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Multi-Role Switcher Button */}
            {user?.roles && user.roles.length > 1 && (
              <button
                onClick={() => setRoleModalOpen(true)}
                className="h-9 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="Switch active role workspace"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Switch Role</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-900 text-white font-bold">
                  {user.roles.length}
                </span>
              </button>
            )}

            {/* Interactive Refresh Button (Matching Dimensions) */}
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-indigo-600 bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200 hover:border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60 shrink-0"
              title="Click to sync latest data without refreshing page"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Logout Button (Visible only for non-registered shop owners & non-registered barbers) */}
            {showNavbarLogout && (
              <button
                onClick={handleLogout}
                className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-rose-600 bg-zinc-50 hover:bg-rose-50/70 border border-zinc-200 hover:border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="Log Out of Account"
              >
                <LogOut className="w-4 h-4 text-zinc-500" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {/* Mobile Profile / Settings Navigation Avatar (Matching Dimensions) */}
            <button
              onClick={() => {
                const profilePath = location.pathname.startsWith('/barber')
                  ? '/barber/profile'
                  : location.pathname.startsWith('/owner')
                  ? '/owner/settings'
                  : location.pathname.startsWith('/manager')
                  ? '/manager/settings'
                  : location.pathname.startsWith('/admin')
                  ? '/admin/settings'
                  : navItems.find((i) => i.to.includes('profile') || i.to.includes('settings'))?.to || '/';
                navigate(profilePath);
              }}
              className="lg:hidden w-9 h-9 flex items-center justify-center p-0.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 overflow-hidden"
              title="Open Profile & Settings"
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name || 'User Profile'} 
                  className="w-full h-full rounded-lg object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs">
                  {getInitials(user?.name)}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Main Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full pb-24 lg:pb-7">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Icon-Only Dock) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden px-3">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {navItems
              .filter(item => !item.to.includes('profile') && !item.to.includes('settings'))
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className="flex items-center justify-center flex-1 py-1 cursor-pointer transition-all active:scale-95"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-150 ${
                      isActive
                        ? 'bg-zinc-900 text-white shadow-sm scale-105'
                        : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
  );
}

export default DashboardLayout;
