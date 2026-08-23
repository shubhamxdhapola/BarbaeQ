import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  Store, 
  AlertCircle, 
  IndianRupee, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  Scissors,
  XCircle,
  UserX
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { fetchMyShop, updateShop } from '../../redux/slices/shop.slice.js';
import { fetchShopAppointments } from '../../redux/slices/appointment.slice.js';
import { fetchShopBarbers } from '../../redux/slices/barber.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';

const STATUS_CONFIG = {
  [AppointmentStatus.COMPLETED]: { label: 'Completed', color: '#10b981', bg: 'bg-emerald-500' },
  [AppointmentStatus.IN_SERVICE]: { label: 'In Service', color: '#6366f1', bg: 'bg-indigo-500' },
  [AppointmentStatus.WAITING]: { label: 'Waiting', color: '#0ea5e9', bg: 'bg-sky-500' },
  [AppointmentStatus.PENDING_APPROVAL]: { label: 'Pending Approval', color: '#f59e0b', bg: 'bg-amber-500' },
  [AppointmentStatus.CANCELLED]: { label: 'Cancelled', color: '#ef4444', bg: 'bg-red-500' },
  [AppointmentStatus.NO_SHOW]: { label: 'No Show', color: '#64748b', bg: 'bg-slate-500' },
};

// Sleek Custom Tooltip for Revenue
const CustomRevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-zinc-800 text-xs min-w-[150px]">
        <p className="text-zinc-400 font-semibold mb-1.5">{data.fullDate || label}</p>
        <div className="flex items-center justify-between gap-3 text-sm font-black text-emerald-400">
          <span>Revenue:</span>
          <span>₹{payload[0].value}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-zinc-300 mt-1 font-medium">
          <span>Completed:</span>
          <span>{data.completed} services</span>
        </div>
      </div>
    );
  }
  return null;
};

// Sleek Custom Tooltip for Customers (Total Bookings & Completed in single bar)
const CustomCustomerTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const completionRate = data.customers > 0 ? Math.round((data.completed / data.customers) * 100) : 0;
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-zinc-800 text-xs min-w-[170px]">
        <p className="text-zinc-400 font-semibold mb-2">{data.fullDate || label}</p>
        <div className="flex items-center justify-between gap-3 text-sm font-black text-white pb-1.5 border-b border-zinc-800">
          <span>Total Bookings:</span>
          <span>{data.customers}</span>
        </div>
        <div className="space-y-1.5 mt-2 font-medium">
          <div className="flex items-center justify-between gap-3 text-emerald-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed:</span>
            <span className="font-bold">{data.completed}</span>
          </div>
          {data.other > 0 && (
            <div className="flex items-center justify-between gap-3 text-indigo-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400" /> Other / Active:</span>
              <span className="font-bold">{data.other}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 text-zinc-400 pt-1 border-t border-zinc-800/60 text-[11px]">
            <span>Completion Rate:</span>
            <span className="font-bold text-emerald-300">{completionRate}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { myShop: shop, loading: isShopLoading } = useSelector((state) => state.shop);
  const { shopAppointments: appointments = [], loading: isApptLoading } = useSelector((state) => state.appointment);
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
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  // Top KPI Metric Calculations
  const todayAppointments = useMemo(() => {
    return appointments.filter(a => isToday(a.bookedAt || a.createdAt));
  }, [appointments]);

  const todayRevenue = useMemo(() => {
    return todayAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
  }, [todayAppointments]);

  const totalAllRevenue = useMemo(() => {
    return appointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
  }, [appointments]);

  const todayCompleted = useMemo(() => {
    return todayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  }, [todayAppointments]);

  const todayCancelled = useMemo(() => {
    return todayAppointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED).length;
  }, [todayAppointments]);

  const totalAllCancelled = useMemo(() => {
    return appointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED).length;
  }, [appointments]);

  const todayNoShow = useMemo(() => {
    return todayAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
  }, [todayAppointments]);

  const totalAllNoShow = useMemo(() => {
    return appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
  }, [appointments]);

  const activeWaitingQueue = useMemo(() => {
    return appointments.filter(a => a.status === AppointmentStatus.WAITING).length;
  }, [appointments]);

  const onDutyBarbersCount = useMemo(() => {
    return barbers.filter(b => b.isActive !== false && b.isAvailable !== false).length;
  }, [barbers]);

  const offDutyBarbersCount = useMemo(() => {
    return barbers.filter(b => b.isActive !== false && b.isAvailable === false).length;
  }, [barbers]);

  // Shop Owner Profile Image (Owner's personal profile picture)
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
      
      const dayAppointments = appointments.filter(a => {
        const aDate = new Date(a.bookedAt || a.createdAt).toISOString().split('T')[0];
        return aDate === dateKey;
      });

      const revenue = dayAppointments
        .filter(a => a.status === AppointmentStatus.COMPLETED)
        .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

      const customers = dayAppointments.length;
      const completed = dayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
      const other = Math.max(0, customers - completed);

      days.push({
        date: shortLabel,
        fullDate,
        rawDate: dateKey,
        revenue,
        customers,
        completed,
        other
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

  // 7-Day Outcome Breakdown for Pie Chart (Excludes Pending, In Service, and Waiting)
  const { pieChartData, allStatusList, sevenDayOutcomeTotal } = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentAppointments = appointments.filter(a => {
      const d = new Date(a.bookedAt || a.createdAt);
      return d >= sevenDaysAgo;
    });

    const counts = {
      [AppointmentStatus.COMPLETED]: 0,
      [AppointmentStatus.CANCELLED]: 0,
      [AppointmentStatus.NO_SHOW]: 0,
    };

    recentAppointments.forEach(a => {
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
      percentage: Math.round((value / totalForPercent) * 100)
    }));

    const pieData = allList.filter(item => item.value > 0);

    return { 
      pieChartData: pieData, 
      allStatusList: allList, 
      sevenDayOutcomeTotal: totalOutcomeCount 
    };
  }, [appointments]);

  if (isShopLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <CardSkeleton key={i} />)}
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
          <button 
            onClick={() => navigate('/owner/register-shop')}
            className="btn-primary text-base px-8 py-3"
          >
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
          <button 
            onClick={() => navigate('/owner/register-shop')}
            className="btn-secondary"
          >
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
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-13 h-13 sm:w-14 sm:h-14 min-w-[52px] min-h-[52px] max-w-[56px] max-h-[56px] aspect-square rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0 font-bold text-lg sm:text-xl shadow-2xs border border-zinc-200/80">
              {user?.name ? user.name.charAt(0).toUpperCase() : (shop.name ? shop.name.charAt(0).toUpperCase() : 'S')}
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
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Shop Operations</span>
                <span className={`text-xs font-black tracking-wide leading-tight mt-0.5 ${shop.isOpen ? 'text-emerald-700' : 'text-zinc-600'}`}>
                  {shop.isOpen ? 'Open • Accepting Customers' : 'Closed • Operations Paused'}
                </span>
              </div>
            </div>

            {/* Switch Toggle */}
            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
              shop.isOpen ? 'bg-emerald-600' : 'bg-zinc-300'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                shop.isOpen ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Stats Cards (Stacked in 1 column below each other on small screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">₹{todayRevenue}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">All-time: ₹{totalAllRevenue}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Today's Bookings</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-ink">{todayAppointments.length}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">{appointments.length} Total all-time</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{todayCompleted}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Services finished</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Cancelled</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{todayCancelled}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">All-time: {totalAllCancelled}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">No Show</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-700">{todayNoShow}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">All-time: {totalAllNoShow}</p>
          </div>
        </div>
      </div>

      {/* 3. Analytics Visualizations Section */}
      <div className="space-y-6">
        
        {/* ROW 1: Full-Width Revenue Trend Area Chart (Scrollable on small screens) */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-ink">Revenue Overview (Last 7 Days)</h3>
                <p className="text-xs text-muted mt-0.5">Daily earnings from completed customer services across the last 7 days</p>
              </div>
            </div>

            <div className="hidden sm:block px-3.5 py-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">7-Day Total</p>
              <p className="text-base sm:text-lg font-black text-emerald-700">₹{sevenDayRevenueTotal}</p>
            </div>
          </div>

          {/* Horizontal Scroll wrapper for small devices */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="h-72 min-w-[540px] sm:min-w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip content={<CustomRevenueTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#revenueGradient)" 
                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2: Bar Chart (1/2) + Pie Chart (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 2: Customer Volume Bar Chart (1/2 Width) - Scrollable on small screens */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-ink">Total Bookings & Completed</h3>
                  <p className="text-xs text-muted mt-0.5">Daily total bookings with completed portion highlighted</p>
                </div>
              </div>

              <div className="hidden sm:block px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/60 rounded-xl text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-800">7-Day Total</p>
                <p className="text-sm sm:text-base font-black text-indigo-700">{sevenDayCustomerTotal} Bookings</p>
              </div>
            </div>

            {/* Horizontal Scroll wrapper for small devices */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="h-60 min-w-[480px] sm:min-w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                      allowDecimals={false} 
                    />
                    <Tooltip content={<CustomCustomerTooltip />} />
                    <Bar dataKey="completed" name="Completed" stackId="bookings" fill="#10b981" maxBarSize={36} />
                    <Bar dataKey="other" name="Other / Active" stackId="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Legend Pills for Bar Chart */}
            <div className="flex items-center justify-center gap-5 pt-3 border-t border-zinc-100 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-700 font-bold">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-zinc-700 font-bold">Other / Active (Total Bar)</span>
              </div>
            </div>
          </div>

          {/* Chart 3: 7-Day Outcome Breakdown Donut Chart (1/2 Width) */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-ink">Outcome Breakdown (Last 7 Days)</h3>
                  <p className="text-xs text-muted mt-0.5">Completed, cancelled & no-show outcomes over the week</p>
                </div>
              </div>

              <span className="hidden sm:block px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-black shrink-0">
                {sevenDayOutcomeTotal} Outcomes
              </span>
            </div>

            {pieChartData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                {/* Donut Chart with Centered Total */}
                <div className="h-52 w-52 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name) => [`${val} Bookings`, name]}
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-ink">{sevenDayOutcomeTotal}</span>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Resolved</span>
                  </div>
                </div>

                {/* Status Legend Pills */}
                <div className="flex-1 flex flex-col gap-2 w-full">
                  {allStatusList.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-zinc-700">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-ink">{item.value} <span className="text-[10px] text-muted font-medium">({item.percentage}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-muted">
                <PieIcon className="w-10 h-10 text-zinc-300 mb-2" />
                <p className="text-xs font-semibold">No resolved appointment outcomes in last 7 days</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
