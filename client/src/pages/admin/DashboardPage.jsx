import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  PieChart as PieChartIcon,
  Store,
  ArrowRight,
  UserCheck,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  fetchPendingShops,
  fetchApprovedShopsAdmin,
  fetchRejectedShopsAdmin,
  fetchManagersAdmin,
} from '../../redux/slices/admin.slice.js';
import { CardSkeleton } from '../../components/ui/Skeleton';

// Custom Tooltip for Daily Requests Bar Chart
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-zinc-800 text-xs backdrop-blur-md min-w-[170px]">
        <p className="font-bold text-zinc-300 pb-1.5 border-b border-zinc-800 mb-2">
          {data.fullDate || label}
        </p>
        <div className="space-y-1.5 font-medium">
          <div className="flex justify-between items-center text-indigo-300">
            <span>Total Requests:</span>
            <span className="font-bold text-white text-sm">{data.total}</span>
          </div>
          <div className="flex justify-between items-center text-amber-400 text-[11px]">
            <span>Pending:</span>
            <span className="font-bold">{data.pending}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400 text-[11px]">
            <span>Approved:</span>
            <span className="font-bold">{data.approved}</span>
          </div>
          <div className="flex justify-between items-center text-rose-400 text-[11px]">
            <span>Rejected:</span>
            <span className="font-bold">{data.rejected}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Status Distribution Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-zinc-900/95 text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-zinc-800 text-xs backdrop-blur-md">
        <p className="font-bold text-zinc-300 mb-1">{data.name}</p>
        <p className="text-zinc-100 font-extrabold text-sm">
          {data.value} {data.value === 1 ? 'Shop' : 'Shops'}{' '}
          <span className="text-zinc-400 text-xs font-normal">
            ({data.payload.percentage}%)
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    pendingShops = [],
    approvedShops = [],
    rejectedShops = [],
    managers = [],
    loading: isLoading,
  } = useSelector((state) => state.admin);

  useEffect(() => {
    if (pendingShops.length === 0) dispatch(fetchPendingShops());
    if (approvedShops.length === 0) dispatch(fetchApprovedShopsAdmin());
    if (rejectedShops.length === 0) dispatch(fetchRejectedShopsAdmin());
    if (managers.length === 0) dispatch(fetchManagersAdmin());
  }, [dispatch, pendingShops.length, approvedShops.length, rejectedShops.length, managers.length]);

  // Combine all shops to track timeline and registration analytics
  const allShops = useMemo(() => {
    return [
      ...(pendingShops || []).map((s) => ({ ...s, derivedStatus: 'PENDING' })),
      ...(approvedShops || []).map((s) => ({ ...s, derivedStatus: 'APPROVED' })),
      ...(rejectedShops || []).map((s) => ({ ...s, derivedStatus: 'REJECTED' })),
    ];
  }, [pendingShops, approvedShops, rejectedShops]);

  // 1. Last 7 Days Daily Shop Registration Requests (Bar Chart)
  const dailyRequestsData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const shortLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const dayShops = allShops.filter((s) => {
        if (!s.createdAt) return false;
        const sDate = new Date(s.createdAt).toISOString().split('T')[0];
        return sDate === dateKey;
      });

      const pendingCount = dayShops.filter((s) => s.derivedStatus === 'PENDING').length;
      const approvedCount = dayShops.filter((s) => s.derivedStatus === 'APPROVED').length;
      const rejectedCount = dayShops.filter((s) => s.derivedStatus === 'REJECTED').length;

      days.push({
        date: shortLabel,
        fullDate,
        rawDate: dateKey,
        total: dayShops.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      });
    }
    return days;
  }, [allShops]);

  const sevenDayTotalRequests = useMemo(() => {
    return dailyRequestsData.reduce((sum, d) => sum + d.total, 0);
  }, [dailyRequestsData]);

  // 2. Request Status Pie Chart Data (Pending, Approved, Rejected)
  const { pieChartData, totalApplications } = useMemo(() => {
    const pCount = pendingShops?.length || 0;
    const aCount = approvedShops?.length || 0;
    const rCount = rejectedShops?.length || 0;
    const total = pCount + aCount + rCount;
    const denom = total || 1;

    const data = [
      {
        name: 'Pending Approvals',
        value: pCount,
        color: '#f59e0b', // Amber 500
        percentage: Math.round((pCount / denom) * 100),
      },
      {
        name: 'Approved Shops',
        value: aCount,
        color: '#10b981', // Emerald 500
        percentage: Math.round((aCount / denom) * 100),
      },
      {
        name: 'Rejected Requests',
        value: rCount,
        color: '#f43f5e', // Rose 500
        percentage: Math.round((rCount / denom) * 100),
      },
    ];

    return {
      pieChartData: data,
      totalApplications: total,
    };
  }, [pendingShops, approvedShops, rejectedShops]);

  // 3. Recent Submissions Feed (Sorted newest first)
  const recentSubmissions = useMemo(() => {
    return [...allShops]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [allShops]);

  if (isLoading && allShops.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <CardSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const pending = pendingShops?.length || 0;
  const approved = approvedShops?.length || 0;
  const rejected = rejectedShops?.length || 0;
  const managerCount = managers?.length || 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight">
                Admin Dashboard Overview
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                <Sparkles className="w-3 h-3" />
                Live Control Center
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Platform metrics, shop registration intake pipeline, and verification statistics
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-50/90 border border-zinc-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-900 font-black text-sm">
            <Store className="w-4 h-4 text-indigo-600" />
            <span>{totalApplications}</span>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-bold text-zinc-600">Total Applications</span>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Pending Approvals */}
        <div
          onClick={() => navigate('/admin/shops/pending')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{pending}</div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
              {pending > 0 ? '⚠️ Action required' : 'All clear & caught up'}
            </p>
          </div>
        </div>

        {/* Approved Shops */}
        <div
          onClick={() => navigate('/admin/shops/approved')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Approved Shops
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{approved}</div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Active on platform</p>
          </div>
        </div>

        {/* Rejected Requests */}
        <div
          onClick={() => navigate('/admin/shops/rejected')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Rejected Shops
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{rejected}</div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Declined submissions</p>
          </div>
        </div>

        {/* Review Managers */}
        <div
          onClick={() => navigate('/admin/managers')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Review Managers
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-indigo-700">{managerCount}</div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Authorized staff accounts</p>
          </div>
        </div>
      </div>

      {/* 3. Analytics Visualizations Grid (Bar Chart + Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BAR CHART: Requests Per Day */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-card border border-zinc-200/80 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900">
                    Registration Requests Per Day
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Daily shop registration intake volume over the last 7 days
                  </p>
                </div>
              </div>

              <div className="hidden sm:block px-3 py-1 bg-indigo-50/80 border border-indigo-200/60 rounded-xl text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-700">
                  7-Day Total:{' '}
                </span>
                <span className="text-sm font-black text-indigo-900">
                  {sevenDayTotalRequests}
                </span>
              </div>
            </div>

            {/* Horizontal Scroll wrapper for small devices */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="h-64 sm:h-72 min-w-[480px] sm:min-w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRequestsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Requests"
                      fill="#4f46e5"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Incoming Registrations
            </span>
            <span className="text-zinc-400 text-[11px]">Updated in real-time</span>
          </div>
        </div>

        {/* PIE CHART: Status Distribution */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-card border border-zinc-200/80 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900">
                  Request Status Distribution
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Proportion of pending, approved, and rejected shops
                </p>
              </div>
            </div>

            {/* Pie Chart Container */}
            <div className="h-56 sm:h-64 w-full relative flex items-center justify-center">
              {totalApplications > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-zinc-400 text-xs font-semibold">
                  No applications recorded yet
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Legend Pill Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-zinc-100">
            {pieChartData.map((item) => (
              <div
                key={item.name}
                className="p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 text-center flex items-center justify-between sm:flex-col sm:justify-center"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1 sm:mt-0.5">
                  <span className="text-sm sm:text-base font-black text-zinc-900">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Registration Requests Table */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">Recent Applications</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Latest barbershop registration requests submitted to platform</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/shops/pending')}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>Review Pending ({pending})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-500">
                  <th className="px-6 py-4">Shop Details</th>
                  <th className="px-6 py-4">Owner Info</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                {recentSubmissions.map((s) => {
                  const ownerName = typeof s.ownerId === 'object' && s.ownerId?.name ? s.ownerId.name : 'Shop Owner';
                  const ownerPhone = typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : '';
                  const dateStr = s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={s._id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Shop Name & Logo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {s.avatar || s.shopImage || (s.photos && s.photos.length > 0 ? s.photos[0] : null) ? (
                            <img
                              src={s.avatar || s.shopImage || s.photos[0]}
                              alt={s.name}
                              className="w-9 h-9 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 text-sm leading-snug">{s.name}</p>
                            <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[220px]">
                              {s.address || 'Address pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900">{ownerName}</p>
                        {ownerPhone && <p className="text-[11px] text-zinc-500 font-medium">{ownerPhone}</p>}
                      </td>

                      {/* City */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-700 capitalize">{s.city}</span>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-6 py-4">
                        <span className="text-zinc-600 font-medium text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          {dateStr}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {s.derivedStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        ) : s.derivedStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (s.derivedStatus === 'PENDING') navigate('/admin/shops/pending');
                            else if (s.derivedStatus === 'APPROVED') navigate('/admin/shops/approved');
                            else navigate('/admin/shops/rejected');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-500 text-xs font-semibold">
            No shop registrations recorded yet
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
