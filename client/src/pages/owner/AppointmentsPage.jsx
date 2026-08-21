import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyShop } from '../../redux/slices/shop.slice.js';
import { fetchShopAppointments } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus, AppointmentSource } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { 
  CalendarRange, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Search, 
  Phone, 
  Scissors, 
  User,
  Filter,
  Sparkles,
  Inbox,
  ChevronDown
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: AppointmentStatus.PENDING_APPROVAL },
  { label: 'Waiting', value: AppointmentStatus.WAITING },
  { label: 'In Service', value: AppointmentStatus.IN_SERVICE },
  { label: 'Completed', value: AppointmentStatus.COMPLETED },
  { label: 'Cancelled', value: AppointmentStatus.CANCELLED },
  { label: 'No Show', value: AppointmentStatus.NO_SHOW }
];

export const AppointmentsPage = () => {
  const dispatch = useDispatch();
  const { myShop } = useSelector((state) => state.shop);
  const { shopAppointments: appointments = [], loading } = useSelector((state) => state.appointment);

  const [dateRange, setDateRange] = useState('today');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const rangeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 15 Days', value: '15days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'All Time', value: 'all' },
  ];

  useEffect(() => {
    if (!myShop) {
      dispatch(fetchMyShop());
    }
  }, [dispatch, myShop]);

  useEffect(() => {
    if (myShop?._id) {
      dispatch(fetchShopAppointments({ shopId: myShop._id, range: 'all' }));
    }
  }, [dispatch, myShop?._id]);

  const getCustomerName = (a) => {
    if (typeof a.customerId === 'object' && a.customerId) return a.customerId.name;
    if (a.customerName) return a.customerName;
    return 'Customer';
  };

  const getCustomerPhone = (a) => {
    if (typeof a.customerId === 'object' && a.customerId) return a.customerId.phone || '—';
    if (a.customerPhone) return a.customerPhone;
    return '—';
  };

  const getCustomerAvatar = (a) => {
    if (typeof a.customerId === 'object' && a.customerId?.avatar) return a.customerId.avatar;
    if (a.customerAvatar) return a.customerAvatar;
    return null;
  };

  const getBarberName = (a) =>
    typeof a.barberId === 'object' && a.barberId && typeof a.barberId.userId === 'object'
      ? a.barberId.userId.name
      : 'Barber';

  // 1. Filter by Selected Date Range (Today by default)
  const dateFilteredAppointments = useMemo(() => {
    if (dateRange === 'all') return appointments;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return appointments.filter((a) => {
      const rawDate = a.date || a.bookedAt || a.createdAt;
      if (!rawDate) return true;
      const aptDate = new Date(rawDate);
      if (isNaN(aptDate.getTime())) return true;

      if (dateRange === 'today') {
        const aptDay = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
        return aptDay.getTime() === startOfToday.getTime();
      }
      if (dateRange === '7days') {
        const threshold = new Date(startOfToday);
        threshold.setDate(threshold.getDate() - 6);
        return aptDate >= threshold;
      }
      if (dateRange === '15days') {
        const threshold = new Date(startOfToday);
        threshold.setDate(threshold.getDate() - 14);
        return aptDate >= threshold;
      }
      if (dateRange === '30days') {
        const threshold = new Date(startOfToday);
        threshold.setDate(threshold.getDate() - 29);
        return aptDate >= threshold;
      }
      return true;
    });
  }, [appointments, dateRange]);

  // Overall calculations for KPI cards
  const totalCount = dateFilteredAppointments.length;
  const completedCount = useMemo(() => {
    return dateFilteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  }, [dateFilteredAppointments]);

  const totalRevenue = useMemo(() => {
    return dateFilteredAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
  }, [dateFilteredAppointments]);

  const activeCount = useMemo(() => {
    return dateFilteredAppointments.filter(a => [
      AppointmentStatus.WAITING, 
      AppointmentStatus.IN_SERVICE, 
      AppointmentStatus.PENDING_APPROVAL
    ].includes(a.status)).length;
  }, [dateFilteredAppointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return dateFilteredAppointments.filter((a) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && a.status !== statusFilter) {
        return false;
      }

      // 2. Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const custName = getCustomerName(a).toLowerCase();
        const custPhone = getCustomerPhone(a).toLowerCase();
        const barbName = getBarberName(a).toLowerCase();
        const servName = (a.serviceName || '').toLowerCase();

        const match = custName.includes(query) || 
                      custPhone.includes(query) || 
                      barbName.includes(query) || 
                      servName.includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [dateFilteredAppointments, statusFilter, searchTerm]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, statusFilter, searchTerm]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredAppointments.slice(start, start + 10);
  }, [filteredAppointments, currentPage]);

  // Group Filtered Appointments by Date (10 items per page)
  const groupedAppointments = useMemo(() => {
    const groups = {};
    paginatedAppointments.forEach(a => {
      const dateObj = new Date(a.bookedAt || a.createdAt);
      const isAptToday = new Date().toDateString() === dateObj.toDateString();
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isAptYesterday = yesterday.toDateString() === dateObj.toDateString();

      let groupTitle = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      if (isAptToday) groupTitle = `Today — ${groupTitle}`;
      else if (isAptYesterday) groupTitle = `Yesterday — ${groupTitle}`;

      if (!groups[groupTitle]) {
        groups[groupTitle] = {
          title: groupTitle,
          dateObj,
          appointments: [],
          totalRevenue: 0
        };
      }

      groups[groupTitle].appointments.push(a);
      if (a.status === AppointmentStatus.COMPLETED) {
        groups[groupTitle].totalRevenue += (a.totalPrice || 0);
      }
    });

    return Object.values(groups).sort((a, b) => b.dateObj - a.dateObj);
  }, [paginatedAppointments]);

  const renderStatusBadge = (apt) => {
    switch (apt.status) {
      case AppointmentStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case AppointmentStatus.IN_SERVICE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            In Service
          </span>
        );
      case AppointmentStatus.WAITING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Waiting (Queue #{apt.queueNumber || '—'})
          </span>
        );
      case AppointmentStatus.PENDING_APPROVAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Approval
          </span>
        );
      case AppointmentStatus.CANCELLED: {
        const by = apt.cancelledBy === 'CUSTOMER' 
          ? 'by Customer' 
          : apt.cancelledBy === 'BARBER' 
          ? 'by Barber' 
          : apt.cancelledBy === 'SHOP_OWNER' 
          ? 'by Owner' 
          : '';
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled {by}
          </span>
        );
      }
      case AppointmentStatus.REJECTED: {
        const by = (apt.rejectedBy === 'BARBER' || apt.cancelledBy === 'BARBER') 
          ? 'by Barber' 
          : 'by Shop';
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected {by}
          </span>
        );
      }
      case AppointmentStatus.NO_SHOW:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/70">
            {apt.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header & Minimal Date Range Selector */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Shop Appointments</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {totalCount} Total
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              View customer bookings, queue timelines, and revenue history
            </p>
          </div>
        </div>

        {/* Clean & Minimal Date Range Select Dropdown */}
        <div className="relative shrink-0 self-start lg:self-auto">
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3.5 text-zinc-500 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-zinc-100 hover:bg-zinc-200/70 text-zinc-900 font-bold text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer shadow-2xs min-w-[155px]"
            >
              {rangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-zinc-900 font-medium">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Top KPI Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{totalCount}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Appointments recorded</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{completedCount}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Served successfully</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Active in Queue</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{activeCount}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Waiting & in-service</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">₹{totalRevenue}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">From completed visits</p>
          </div>
        </div>
      </div>

      {/* 3. Clean & Minimal Status Filter Bar & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search customer, phone, barber or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* Minimal Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {STATUS_FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Grouped Appointments Tables by Date */}
      {loading ? (
        <div className="p-8 bg-white rounded-3xl border border-zinc-200 shadow-card">
          <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-center text-xs font-semibold text-muted">Loading appointments...</p>
        </div>
      ) : groupedAppointments.length > 0 ? (
        <div className="space-y-4">
          {groupedAppointments.map((group) => (
            <div key={group.title} className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
              {/* Date Group Header */}
              <div className="px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-zinc-900 text-sm tracking-tight">{group.title}</h4>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200/70">
                    {group.appointments.length} Booking{group.appointments.length > 1 ? 's' : ''}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    ₹{group.totalRevenue} Revenue
                  </span>
                </div>
              </div>

              {/* Table for this date */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse whitespace-nowrap min-w-[700px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-white text-[11px] uppercase tracking-wider font-bold text-zinc-500 whitespace-nowrap">
                      <th className="px-5 py-3.5 whitespace-nowrap">Customer</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Barber</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Service</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Source</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Time</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 whitespace-nowrap">
                    {group.appointments.map(apt => {
                      const bookedDate = new Date(apt.bookedAt || apt.createdAt);
                      const isWalkIn = apt.source === AppointmentSource.WALK_IN;

                      return (
                        <tr key={apt._id} className="hover:bg-zinc-50/70 transition-colors whitespace-nowrap">
                          {/* Customer */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {getCustomerAvatar(apt) ? (
                                <img
                                  src={getCustomerAvatar(apt)}
                                  alt={getCustomerName(apt)}
                                  className="w-9 h-9 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200/80">
                                  {getCustomerName(apt).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-zinc-900 text-sm leading-snug">{getCustomerName(apt)}</div>
                                <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span>{getCustomerPhone(apt)}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Barber */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2 font-semibold text-zinc-800">
                              <Scissors className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>{getBarberName(apt)}</span>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-zinc-900">{apt.serviceName}</div>
                            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                              {apt.serviceDuration} min • <span className="font-bold text-emerald-700">₹{apt.totalPrice || 0}</span>
                            </div>
                          </td>

                          {/* Source */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                              isWalkIn
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            }`}>
                              {apt.source || 'ONLINE'}
                            </span>
                          </td>

                          {/* Time */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-zinc-600 font-semibold text-xs whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>{bookedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStatusBadge(apt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAppointments.length}
              pageSize={10}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-zinc-200/80 shadow-card text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-zinc-900">No appointments found</h4>
          <p className="text-xs text-muted mt-1 max-w-sm">
            {searchTerm || statusFilter !== 'ALL' 
              ? 'No appointments matched your current search and status filter criteria.' 
              : 'There are no customer appointments recorded for this timeframe.'}
          </p>
        </div>
      )}
    </div>
  );
};
