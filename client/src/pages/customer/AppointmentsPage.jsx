import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyAppointments } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { 
  Clock, 
  Scissors, 
  ChevronRight, 
  Star, 
  Calendar,
  Sparkles,
  ArrowRight,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { ReviewModal } from '../../components/ui/ReviewModal';

export const AppointmentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myAppointments: appointments = [], loading } = useSelector((state) => state.appointment);

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchMyAppointments());
  }, [dispatch]);

  const activeAppointments = appointments.filter(a => 
    a.status === AppointmentStatus.PENDING_APPROVAL || 
    a.status === AppointmentStatus.WAITING || 
    a.status === AppointmentStatus.IN_SERVICE
  );

  const pastAppointments = appointments.filter(a => 
    a.status === AppointmentStatus.COMPLETED || 
    a.status === AppointmentStatus.CANCELLED || 
    a.status === AppointmentStatus.REJECTED || 
    a.status === AppointmentStatus.NO_SHOW
  );

  // Categorize past appointments by date
  const groupedPastAppointments = pastAppointments.reduce((groups, appointment) => {
    const rawDate = appointment.bookedAt || appointment.createdAt;
    const dateObj = new Date(rawDate);
    
    if (isNaN(dateObj.getTime())) {
      const fallbackKey = 'Previous Bookings';
      if (!groups[fallbackKey]) groups[fallbackKey] = [];
      groups[fallbackKey].push(appointment);
      return groups;
    }

    const today = new Date();
    const isToday =
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      dateObj.getDate() === yesterday.getDate() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getFullYear() === yesterday.getFullYear();

    let dateLabel = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (isToday) {
      dateLabel = `Today • ${dateLabel}`;
    } else if (isYesterday) {
      dateLabel = `Yesterday • ${dateLabel}`;
    }

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(appointment);
    return groups;
  }, {});

  const getStatusBadge = (a) => {
    switch (a.status) {
      case AppointmentStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            Completed
          </span>
        );
      case AppointmentStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
            Cancelled
          </span>
        );
      case AppointmentStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
            Rejected
          </span>
        );
      case AppointmentStatus.NO_SHOW:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            {a.status}
          </span>
        );
    }
  };

  const getShopName = (a) => typeof a.shopId === 'object' && a.shopId ? a.shopId.name : 'Barber Shop';
  const getBarberName = (a) => typeof a.barberId === 'object' && a.barberId && typeof a.barberId.userId === 'object' ? a.barberId.userId.name : 'Barber';

  if (loading && (!appointments || appointments.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans text-zinc-900 pb-24">
        <Skeleton className="h-8 w-1/4 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans text-zinc-900 pb-24 md:pb-12">
      
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <span className="text-xs font-semibold text-zinc-500">
          Bookings & Queue
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage your live queue tokens and browse past styling appointments
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="bg-zinc-100 p-1 rounded-xl flex items-center gap-1 shrink-0 border border-zinc-200/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <span>Active & Live</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
              activeTab === 'active' ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {activeAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'past'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <span>History</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
              activeTab === 'past' ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {pastAppointments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Active Queue Appointments */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeAppointments.map((appointment) => {
                const isInService = appointment.status === AppointmentStatus.IN_SERVICE;
                const isPending = appointment.status === AppointmentStatus.PENDING_APPROVAL;
                const dateString = new Date(appointment.bookedAt || appointment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={appointment._id}
                    onClick={() => navigate(`/appointments/${appointment._id}`)}
                    className="bg-white rounded-2xl p-5 border border-zinc-100 border-l-4 border-l-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isInService 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : isPending 
                            ? 'bg-amber-50 text-amber-800' 
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isInService ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-zinc-900'
                          } animate-pulse`} />
                          {isInService ? 'In Service' : isPending ? 'Pending' : 'In Active Queue'}
                        </span>
                        
                        <span className="text-xs text-zinc-400 font-medium">
                          {dateString}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-zinc-900 text-base group-hover:text-zinc-700 transition-colors">
                          {getShopName(appointment)}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          {appointment.serviceName} • Stylist: <span className="font-medium text-zinc-700">{getBarberName(appointment)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100">
                      <div>
                        {isInService ? (
                          <p className="text-xs font-bold text-emerald-600">In Chair</p>
                        ) : isPending ? (
                          <p className="text-xs font-bold text-amber-600">Pending</p>
                        ) : (
                          <>
                            <p className="text-[10px] text-zinc-400 uppercase font-semibold">Queue</p>
                            <p className="text-base font-bold text-zinc-900">#{appointment.position ?? (appointment.queuePosition?.position ?? 1)}</p>
                          </>
                        )}
                      </div>
                      <span className="bg-zinc-900 text-white p-2 rounded-xl group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 sm:p-14 border border-zinc-100 text-center shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-400 flex items-center justify-center mx-auto">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">No active appointments</h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                  You don't have any ongoing appointments in queue. Discover top salons and book a spot!
                </p>
              </div>
              <button 
                onClick={() => navigate('/')} 
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors cursor-pointer shadow-sm"
              >
                Find Barbershops
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Past Appointments History (Categorized by Date) */}
      {activeTab === 'past' && (
        <div className="space-y-6">
          {pastAppointments.length > 0 ? (
            Object.entries(groupedPastAppointments).map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-2.5">
                {/* Date Category Section Header */}
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {dateGroup}
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    ({items.length})
                  </span>
                </div>

                {/* Date Group Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
                  {items.map((appointment) => {
                    const shopId = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId._id : appointment.shopId;
                    const barberId = typeof appointment.barberId === 'object' && appointment.barberId ? appointment.barberId._id : appointment.barberId;
                    const timeString = new Date(appointment.bookedAt || appointment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div 
                        key={appointment._id} 
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-zinc-900 text-sm sm:text-base">
                              {getShopName(appointment)}
                            </h4>
                            {getStatusBadge(appointment)}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {appointment.serviceName} • Stylist: <span className="font-medium text-zinc-700">{getBarberName(appointment)}</span> • {timeString}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                          {appointment.status === AppointmentStatus.COMPLETED && (
                            <button
                              onClick={() => {
                                setReviewTarget({
                                  shopId,
                                  barberId,
                                  appointmentId: appointment._id,
                                  shopName: getShopName(appointment),
                                  barberName: getBarberName(appointment),
                                });
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>Review</span>
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/shops/${shopId}`)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            Rebook
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-10 sm:p-14 border border-zinc-100 text-center shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">No past bookings</h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                  Completed visits and past styling appointments will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          shopId={reviewTarget.shopId}
          barberId={reviewTarget.barberId}
          appointmentId={reviewTarget.appointmentId}
          shopName={reviewTarget.shopName}
          barberName={reviewTarget.barberName}
          onReviewSubmitted={() => {
            dispatch(fetchMyAppointments());
          }}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
