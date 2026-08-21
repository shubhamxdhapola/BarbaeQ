import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, User, LogOut, RotateCw, RefreshCw } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { logoutUser, checkAuth } from "../redux/slices/auth.slice.js";
import {
  fetchMyAppointments,
  fetchAppointmentById,
} from "../redux/slices/appointment.slice.js";
import {
  fetchApprovedShops,
  fetchShopById,
} from "../redux/slices/shop.slice.js";
import { fetchShopBarbers } from "../redux/slices/barber.slice.js";
import { fetchShopServices } from "../redux/slices/service.slice.js";
import { fetchShopReviews } from "../redux/slices/review.slice.js";
import { Logo } from "../components/ui/Logo.jsx";
import { ScrollToTop } from "../components/common/ScrollToTop.jsx";
import { RoleSwitcherModal } from "../components/ui/RoleSwitcherModal.jsx";

export const CustomerLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      navigate("/login");
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const promises = [dispatch(fetchMyAppointments())];

      // Route-aware synchronization
      if (location.pathname === "/") {
        promises.push(dispatch(fetchApprovedShops({})));
      } else if (
        location.pathname.startsWith("/shops/") &&
        !location.pathname.includes("/reviews")
      ) {
        const parts = location.pathname.split("/");
        const sId = parts[2];
        if (sId) {
          promises.push(dispatch(fetchShopById(sId)));
          promises.push(dispatch(fetchShopBarbers(sId)));
          promises.push(dispatch(fetchShopServices({ shopId: sId, activeOnly: true })));
        }
      } else if (location.pathname.includes("/reviews")) {
        const parts = location.pathname.split("/");
        const sId = parts[2];
        if (sId) {
          promises.push(dispatch(fetchShopById(sId)));
          promises.push(dispatch(fetchShopReviews(sId)));
        }
      } else if (location.pathname.startsWith("/appointments/")) {
        const parts = location.pathname.split("/");
        const aId = parts[2];
        if (aId) {
          promises.push(dispatch(fetchAppointmentById(aId)));
        }
      } else if (location.pathname === "/profile") {
        promises.push(dispatch(checkAuth()));
      }

      await Promise.allSettled(promises);
      toast.success("Data synced with latest updates");
    } catch (error) {
      console.error("Manual refresh failed", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 font-sans antialiased flex flex-col selection:bg-zinc-900 selection:text-white">
      <ScrollToTop />
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Logo */}
            <div
              className="cursor-pointer flex items-center gap-3 active:scale-98 transition-transform"
              onClick={() => navigate("/")}
            >
              <Logo size="sm" subtitle="Your Queue, Simplified." />
            </div>

            {/* Right Header Controls: Refresh Button + User Profile Menu */}
            <div className="flex items-center gap-2.5">
              {/* Interactive Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="h-9 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 shrink-0"
                title="Click to sync latest queue & appointment data"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-zinc-900" : "text-zinc-500"}`}
                />
                <span className="hidden sm:inline">
                  {isRefreshing ? "Syncing..." : "Refresh"}
                </span>
              </button>

              {/* User Profile / Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer"
                  title="Account Menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-xl object-cover shrink-0 border border-zinc-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <div className="hidden sm:block text-left pr-1">
                    <span className="block text-xs font-semibold text-zinc-900 max-w-[120px] truncate leading-tight">
                      {user?.name || "Customer"}
                    </span>
                    <span className="block text-[10px] text-zinc-400 font-medium">
                      Customer Account
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 p-1.5 z-50">
                    <div className="px-3.5 py-3 border-b border-zinc-100 mb-1">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {user?.name || "Customer"}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {user?.email || user?.phone || ""}
                      </p>
                    </div>

                    <NavLink
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>Profile & Settings</span>
                    </NavLink>

                    <NavLink
                      to="/appointments"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span>My Bookings & Queue</span>
                    </NavLink>

                    {user?.roles && user.roles.length > 1 && (
                      <div className="border-t border-zinc-100 my-1 pt-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setRoleModalOpen(true);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Switch Role</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-900 text-white font-bold">
                            {user.roles.length}
                          </span>
                        </button>
                      </div>
                    )}

                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-100 shadow-md">
        <nav className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-all ${
                isActive ? "text-zinc-900 font-semibold" : "text-zinc-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home className="w-5 h-5" />
                <span className="text-[10px]">Explore</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/appointments"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-all ${
                isActive ? "text-zinc-900 font-semibold" : "text-zinc-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Calendar className="w-5 h-5" />
                <span className="text-[10px]">Bookings</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-all ${
                isActive ? "text-zinc-900 font-semibold" : "text-zinc-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <User className="w-5 h-5" />
                <span className="text-[10px]">Profile</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                )}
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default CustomerLayout;
