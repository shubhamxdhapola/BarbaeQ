import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBarberAppointments } from '../../redux/slices/appointment.slice.js';
import { fetchMyBarberProfile } from '../../redux/slices/barber.slice.js';
import { AppointmentStatus, AppointmentSource } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { BarberDeactivatedState } from '../../components/ui/BarberDeactivatedState.jsx';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Filter, 
  Phone,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Search,
  CalendarRange
} from 'lucide-react';

export const AppointmentsPage = () => {
  const dispatch = useDispatch();
  const { barberAppointments = [], loading } = useSelector((state) => state.appointment);
  const { myProfile } = useSelector((state) => state.barber);
  const [selectedRange, setSelectedRange] = useState('today');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filterOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 15 Days', value: '15days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'All Time', value: 'all' },
  ];

  const statusFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Completed', value: AppointmentStatus.COMPLETED },
    { label: 'In Service', value: AppointmentStatus.IN_SERVICE },
    { label: 'Waiting', value: AppointmentStatus.WAITING },
    { label: 'Pending', value: AppointmentStatus.PENDING_APPROVAL },
    { label: 'Cancelled / Rejected', value: 'CANCELLED_OR_REJECTED' },
    { label: 'No Show', value: AppointmentStatus.NO_SHOW },
  ];

  useEffect(() => {
    dispatch(fetchMyBarberProfile());
    dispatch(fetchBarberAppointments(selectedRange));
    setCurrentPage(1);
  }, [dispatch, selectedRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const getCustomerName = (a) => {
    if (typeof a.customerId === 'object' && a.customerId) return a.customerId.name;
    if (a.customerName) return a.customerName;
    return 'Customer';
  };

  const getCustomerPhone = (a) => {
    if (typeof a.customerId === 'object' && a.customerId) return a.customerId.phone || '-';
    if (a.customerPhone) return a.customerPhone;
    return '-';
  };

  const getCustomerAvatar = (a) => {
    if (typeof a.customerId === 'object' && a.customerId?.avatar) return a.customerId.avatar;
    if (a.customerAvatar) return a.customerAvatar;
    return null;
  };

  const renderStatusBadge = (apt) => {
    switch (apt.status) {
      case AppointmentStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case AppointmentStatus.IN_SERVICE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            In Service
          </span>
        );
      case AppointmentStatus.WAITING:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Waiting (Token #{apt.queueNumber || '-'})
          </span>
        );
      case AppointmentStatus.PENDING_APPROVAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Approval
          </span>
        );
      case AppointmentStatus.CANCELLED: {
        const by = apt.cancelledBy === 'CUSTOMER' 
          ? 'by Customer' 
          : apt.cancelledBy === 'BARBER' 
          ? 'by You' 
          : apt.cancelledBy === 'SHOP_OWNER' 
          ? 'by Owner' 
          : '';
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled {by}
          </span>
        );
      }
      case AppointmentStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case AppointmentStatus.NO_SHOW:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 whitespace-nowrap">
            {apt.status}
          </span>
        );
    }
  };

  // Stats calculation
  const totalCount = barberAppointments.length;
  const completedCount = barberAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  const cancelledCount = barberAppointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED).length;
  const noShowCount = barberAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;

  // Filter appointments by search & status
  const filteredAppointments = useMemo(() => {
    return barberAppointments.filter(apt => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CANCELLED_OR_REJECTED') {
          if (apt.status !== AppointmentStatus.CANCELLED && apt.status !== AppointmentStatus.REJECTED) return false;
        } else if (apt.status !== statusFilter) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const custName = getCustomerName(apt).toLowerCase();
        const custPhone = getCustomerPhone(apt).toLowerCase();
        const servName = (apt.serviceName || '').toLowerCase();
        if (!custName.includes(query) && !custPhone.includes(query) && !servName.includes(query)) return false;
      }

      return true;
    });
  }, [barberAppointments, statusFilter, searchTerm]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Group Filtered Appointments by Date
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
          appointments: []
        };
      }

      groups[groupTitle].appointments.push(a);
    });

    return Object.values(groups).sort((a, b) => b.dateObj - a.dateObj);
  }, [paginatedAppointments]);

  if (myProfile?.isActive === false) {
    return <BarberDeactivatedState />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Filter Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">Appointment History</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                {totalCount} Total
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">Your Queue, Simplified. Filter and track customer appointment logs across past dates.</p>
          </div>
        </div>

        {/* Range Filter Select Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="relative">
            <Filter className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-zinc-50/90 hover:bg-zinc-100/90 border border-zinc-200/80 text-xs font-bold text-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 cursor-pointer transition-colors appearance-none shadow-2xs min-w-[155px]"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Stats Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{totalCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">In selected range</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{completedCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Finished appointments</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cancelled / Rejected</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{cancelledCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Cancelled requests</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">No Shows</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{noShowCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Missed queue turns</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Status Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name, phone, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50/80 border border-zinc-200/80 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
          />
        </div>

        {/* Horizontal Scrollable Status Chips (Single Row) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 w-full lg:w-auto scrollbar-none">
          {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
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
      {loading && barberAppointments.length === 0 ? (
        <div className="p-8 bg-white rounded-3xl border border-zinc-200 shadow-card">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : groupedAppointments.length > 0 ? (
        <div className="space-y-4">
          {groupedAppointments.map((group) => (
            <div key={group.title} className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
              {/* Date Group Header (No revenue shown as requested) */}
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
                </div>
              </div>

              {/* Table for this date */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse whitespace-nowrap min-w-[700px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-white text-[11px] uppercase tracking-wider font-bold text-zinc-500 whitespace-nowrap">
                      <th className="px-5 py-3.5 whitespace-nowrap">Customer</th>
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
                                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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

                          {/* Service */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-zinc-900">{apt.serviceName}</div>
                            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                              {apt.serviceDuration} min
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
                          <td className="px-5 py-3.5 whitespace-nowrap">
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
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-card text-zinc-500 font-medium">
          <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-zinc-700">No appointments found</p>
          <p className="text-xs text-zinc-400 mt-0.5">There are no records for the selected time range or search filter.</p>
        </div>
      )}

      {/* 5. Standalone Pagination Card */}
      {filteredAppointments.length > 0 && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalItems={filteredAppointments.length}
            pageSize={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
};
