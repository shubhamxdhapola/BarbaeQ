import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyShop, updateShop } from '../../redux/slices/shop.slice.js';
import { fetchShopAppointments } from '../../redux/slices/appointment.slice.js';
import { fetchShopBarbers } from '../../redux/slices/barber.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  Store,
  Clock,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { OwnerKpiCards } from '../../components/owner/dashboard/OwnerKpiCards';
import { OwnerAnalyticsSection } from '../../components/owner/dashboard/OwnerAnalyticsSection';

const STATUS_CONFIG = {
  [AppointmentStatus.COMPLETED]: { label: 'Completed', color: '#10b981' },
  [AppointmentStatus.CANCELLED]: { label: 'Cancelled', color: '#f43f5e' },
  [AppointmentStatus.NO_SHOW]: { label: 'No Show', color: '#64748b' },
};

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myShop: shop, loading: isShopLoading } = useSelector((state) => state.shop);
  const { shopAppointments: appointments = [] } = useSelector((state) => state.appointment);
  const { barbers = [] } = useSelector((state) => state.barber);

  useEffect(() => {
    if (!shop) {
      dispatch(fetchMyShop());
    }
  }, [dispatch, shop]);

  useEffect(() => {
    if (shop?._id) {
      if (appointments.length === 0) {
        dispatch(fetchShopAppointments({ shopId: shop._id, range: 'all' }));
      }
      if (barbers.length === 0) {
        dispatch(fetchShopBarbers(shop._id));
      }
    }
  }, [dispatch, shop?._id, appointments.length, barbers.length]);

  const handleToggleOpen = async () => {
    if (!shop?._id) return;
    if (shop.isActive === false) {
      toast.error('Shop is deactivated');
      return;
    }
    try {
      await dispatch(updateShop({ id: shop._id, data: { isOpen: !shop.isOpen } })).unwrap();
      toast.success(`Shop is now ${!shop.isOpen ? 'Open' : 'Closed'}`);
      dispatch(fetchShopBarbers(shop._id));
    } catch (err) {
      toast.error(err || 'Update failed');
    }
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Top KPI Metric Calculations
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => isToday(a.bookedAt || a.createdAt));
  }, [appointments]);

  const todayRevenue = useMemo(() => {
    return todayAppointments
      .filter((a) => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
  }, [todayAppointments]);

  const totalAllRevenue = useMemo(() => {
    return appointments
      .filter((a) => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
  }, [appointments]);

  const todayCompleted = useMemo(() => {
    return todayAppointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
  }, [todayAppointments]);

  const todayCancelled = useMemo(() => {
    return todayAppointments.filter(
      (a) => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED
    ).length;
  }, [todayAppointments]);

  const totalAllCancelled = useMemo(() => {
    return appointments.filter(
      (a) => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED
    ).length;
  }, [appointments]);

  const todayNoShow = useMemo(() => {
    return todayAppointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length;
  }, [todayAppointments]);

  const totalAllNoShow = useMemo(() => {
    return appointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length;
  }, [appointments]);

  const ownerAvatar = useMemo(() => {
    return user?.avatar || user?.profilePic || user?.photo || null;
  }, [user]);

  // Last 7 Days Time Series Data
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const shortLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const dayAppointments = appointments.filter((a) => {
        const aDate = new Date(a.bookedAt || a.createdAt).toISOString().split('T')[0];
        return aDate === dateKey;
      });

      const revenue = dayAppointments
        .filter((a) => a.status === AppointmentStatus.COMPLETED)
        .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

      const customers = dayAppointments.length;
      const completed = dayAppointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
      const other = Math.max(0, customers - completed);

      days.push({
        date: shortLabel,
        fullDate,
        rawDate: dateKey,
        revenue,
        customers,
        completed,
        other,
      });
    }
    return days;
  }, [appointments]);

  const sevenDayRevenueTotal = useMemo(() => {
    return last7DaysData.reduce((sum, d) => sum + d.revenue, 0);
  }, [last7DaysData]);

  const sevenDayCustomerTotal = useMemo(() => {
    return last7DaysData.reduce((sum, d) => sum + d.customers, 0);
  }, [last7DaysData]);

  // 7-Day Outcome Breakdown for Donut Chart
  const { pieChartData, allStatusList, sevenDayOutcomeTotal } = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentAppointments = appointments.filter((a) => {
      const d = new Date(a.bookedAt || a.createdAt);
      return d >= sevenDaysAgo;
    });

    const counts = {
      [AppointmentStatus.COMPLETED]: 0,
      [AppointmentStatus.CANCELLED]: 0,
      [AppointmentStatus.NO_SHOW]: 0,
    };

    recentAppointments.forEach((a) => {
      if (counts[a.status] !== undefined) {
        counts[a.status]++;
      }
    });

    const totalOutcomeCount = Object.values(counts).reduce((sum, v) => sum + v, 0);
    const totalForPercent = totalOutcomeCount || 1;

    const allList = Object.entries(counts).map(([key, value]) => ({
      key,
      name: STATUS_CONFIG[key]?.label || key,
      value,
      color: STATUS_CONFIG[key]?.color || '#94a3b8',
      percentage: Math.round((value / totalForPercent) * 100),
    }));

    const pieData = allList.filter((item) => item.value > 0);

    return {
      pieChartData: pieData,
      allStatusList: allList,
      sevenDayOutcomeTotal: totalOutcomeCount,
    };
  }, [appointments]);

  if (isShopLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="card p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
            <Store className="w-10 h-10 text-zinc-800" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-4">Register Your Shop</h2>
          <p className="text-muted mb-8 max-w-lg">
            You haven't registered your shop yet. Add your shop details to get started with managing barbers, services, and appointments.
          </p>
          <button onClick={() => navigate('/owner/register-shop')} className="btn-primary text-base px-8 py-3">
            Register Now
          </button>
        </div>
      </div>
    );
  }

  if (shop.status === 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="card p-10 text-center flex flex-col items-center border-t-4 border-t-amber-500">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">Shop Under Review</h2>
          <span className="badge badge-warning mb-6 text-sm py-1 px-3">PENDING APPROVAL</span>
          <p className="text-muted max-w-lg">
            Your shop registration has been submitted and is currently being reviewed by our admin team. This usually takes 1-2 business days.
          </p>
        </div>
      </div>
    );
  }

  if (shop.status === 'REJECTED') {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="card p-10 text-center flex flex-col items-center border-t-4 border-t-rose-500">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">Registration Rejected</h2>
          <span className="badge badge-danger mb-6 text-sm py-1 px-3">REJECTED</span>
          <p className="text-muted max-w-lg mb-8">
            Unfortunately, your shop registration could not be approved at this time. Please check your details and resubmit.
          </p>
          <button onClick={() => navigate('/owner/register-shop')} className="btn-secondary">
            Update and Resubmit
          </button>
        </div>
      </div>
    );
  }

  if (shop.isActive === false) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="card p-10 text-center flex flex-col items-center border-t-4 border-t-rose-600">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">Shop Deactivated by Admin</h2>
          <span className="badge badge-danger mb-6 text-sm py-1 px-3">DEACTIVATED BY ADMIN</span>
          <p className="text-muted max-w-lg">
            Your shop has been deactivated by system administrators. All shop operations (managing barbers, services, queue, and customer bookings) are currently suspended.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header & Live Shop Status Switch */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          {ownerAvatar ? (
            <img
              src={ownerAvatar}
              alt={user?.name || shop.name}
              className="w-13 h-13 sm:w-14 sm:h-14 min-w-[52px] min-h-[52px] max-w-[56px] max-h-[56px] aspect-square rounded-2xl object-cover shrink-0 border border-zinc-200 shadow-2xs"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-13 h-13 sm:w-14 sm:h-14 min-w-[52px] min-h-[52px] max-w-[56px] max-h-[56px] aspect-square rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0 font-bold text-lg sm:text-xl shadow-2xs border border-zinc-200/80">
              {user?.name ? user.name.charAt(0).toUpperCase() : shop.name ? shop.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight truncate">{shop.name}</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="hidden sm:block text-zinc-500 text-xs sm:text-sm font-medium mt-0.5 truncate">
              {shop.address}, <strong className="capitalize text-zinc-700 font-semibold">{shop.city}</strong>
            </p>
            <p className="text-zinc-400 text-[11px] sm:text-xs font-medium mt-0.5 flex items-center gap-1">
              <span>🕒 {shop.openingTime || '09:00 AM'} – {shop.closingTime || '09:00 PM'}</span>
            </p>
          </div>
        </div>

        {/* Professional SaaS Shop Status Toggle */}
        <div className="pt-3 border-t border-zinc-100 md:pt-0 md:border-t-0 flex items-center w-full md:w-auto">
          <div
            onClick={handleToggleOpen}
            className={`w-full md:w-auto cursor-pointer select-none flex items-center justify-between md:justify-start gap-4 px-4 py-2.5 rounded-2xl border transition-all shadow-2xs ${
              shop.isOpen
                ? 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300 hover:bg-emerald-50'
                : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none">
                  Shop Operations
                </span>
                <span className={`text-xs font-black tracking-wide leading-tight mt-0.5 ${shop.isOpen ? 'text-emerald-700' : 'text-zinc-600'}`}>
                  {shop.isOpen ? 'Open • Accepting Customers' : 'Closed • Operations Paused'}
                </span>
              </div>
            </div>

            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                shop.isOpen ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  shop.isOpen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <OwnerKpiCards
        todayRevenue={todayRevenue}
        totalAllRevenue={totalAllRevenue}
        todayBookingsCount={todayAppointments.length}
        totalAllBookingsCount={appointments.length}
        todayCompleted={todayCompleted}
        totalCompleted={appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length}
        todayCancelled={todayCancelled}
        totalAllCancelled={totalAllCancelled}
        todayNoShow={todayNoShow}
        totalAllNoShow={totalAllNoShow}
      />

      {/* 3. Analytics Visualizations Section */}
      <OwnerAnalyticsSection
        last7DaysData={last7DaysData}
        sevenDayRevenueTotal={sevenDayRevenueTotal}
        sevenDayCustomerTotal={sevenDayCustomerTotal}
        sevenDayOutcomeTotal={sevenDayOutcomeTotal}
        pieChartData={pieChartData}
        allStatusList={allStatusList}
      />
    </div>
  );
};
