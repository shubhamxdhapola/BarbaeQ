import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Check, 
  X, 
  AlertCircle, 
  UserPlus, 
  Star, 
  Phone, 
  Scissors, 
  Coffee, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBarberQueue, 
  fetchBarberAppointments,
  startService, 
  completeService, 
  approveAppointment, 
  rejectAppointment, 
  markNoShow, 
  cancelAppointment 
} from '../../redux/slices/appointment.slice.js';
import { fetchMyBarberProfile, toggleMyAvailability, updateQueueDelay } from '../../redux/slices/barber.slice.js';
import { AppointmentStatus, AppointmentSource } from '../../utils/constants.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { WalkInModal } from '../../components/ui/WalkInModal';
import { BarberDeactivatedState } from '../../components/ui/BarberDeactivatedState.jsx';

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const { barberQueue: appointments = [], barberAppointments = [], loading } = useSelector((state) => state.appointment);
  const { myProfile } = useSelector((state) => state.barber);

  const [actionDialog, setActionDialog] = useState({
    isOpen: false, type: 'start', appointmentId: null
  });
  const [walkInOpen, setWalkInOpen] = useState(false);

  const isShopClosed = myProfile?.shopId?.isOpen === false || myProfile?.shopId?.isActive === false;
  const isAvailable = myProfile?.isAvailable !== false && !isShopClosed;
  const isDeactivatedByShop = myProfile?.isActive === false;

  const loadQueue = () => {
    dispatch(fetchBarberQueue());
    dispatch(fetchBarberAppointments('today'));
  };

  useEffect(() => {
    dispatch(fetchMyBarberProfile());
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleToggleAvailability = async () => {
    if (isDeactivatedByShop) {
      toast.error('Your barber station is deactivated by the shop owner');
      return;
    }
    if (isShopClosed) {
      toast.error('Cannot go online while the shop is closed');
      return;
    }
    try {
      const nextState = !isAvailable;
      await dispatch(toggleMyAvailability(nextState)).unwrap();
      toast.success(nextState ? 'Status: Online' : 'Status: On Break');
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const handleApprove = async (id) => {
    if (isDeactivatedByShop) {
      toast.error('Your barber station is deactivated by the shop owner');
      return;
    }
    try {
      await dispatch(approveAppointment(id)).unwrap();
      toast.success('Appointment approved!');
      loadQueue();
    } catch (err) {
      toast.error(err || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (isDeactivatedByShop) {
      toast.error('Your barber station is deactivated by the shop owner');
      return;
    }
    try {
      await dispatch(rejectAppointment(id)).unwrap();
      toast.success('Appointment rejected');
      loadQueue();
    } catch (err) {
      toast.error(err || 'Rejection failed');
    }
  };

  const handleAction = async () => {
    if (isDeactivatedByShop) {
      toast.error('Your barber station is deactivated by the shop owner');
      return;
    }
    const { type, appointmentId } = actionDialog;
    if (!appointmentId) return;
    
    try {
      if (type === 'start') {
        await dispatch(startService(appointmentId)).unwrap();
        toast.success('Service started!');
      }
      if (type === 'complete') {
        await dispatch(completeService(appointmentId)).unwrap();
        toast.success('Service completed!');
      }
      if (type === 'cancel') {
        await dispatch(cancelAppointment(appointmentId)).unwrap();
        toast.success('Appointment cancelled');
      }
      if (type === 'noshow') {
        await dispatch(markNoShow(appointmentId)).unwrap();
        toast.success('Marked as no-show');
      }
      
      loadQueue();
      setActionDialog({ isOpen: false, type: 'start', appointmentId: null });
    } catch (err) {
      console.error(`Failed to ${type} appointment`, err);
      toast.error(err || 'Action failed');
    }
  };

  const getCustomerName = (a) => {
    if (typeof a.customerId === 'object' && a.customerId) return a.customerId.name;
    if (a.customerName) return a.customerName;
    return 'Customer';
  };

  const getCustomerPhone = (a) => {
    if (typeof a.customerId === 'object' && a.customerId?.phone) return a.customerId.phone;
    if (a.customerPhone) return a.customerPhone;
    return null;
  };

  const isCarriedOver = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  const SourceBadge = ({ source }) => (
    source === AppointmentSource.WALK_IN
      ? <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/70 rounded-full uppercase tracking-wider">Walk-in</span>
      : <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full uppercase tracking-wider">Online</span>
  );

  const pendingAppointments = appointments.filter(a => a.status === AppointmentStatus.PENDING_APPROVAL);
  const currentAppointment = appointments.find(a => a.status === AppointmentStatus.IN_SERVICE);
  const waitingAppointments = appointments.filter(a => a.status === AppointmentStatus.WAITING).sort((a, b) => a.queueNumber - b.queueNumber);
  
  // Stats
  const todayTotal = barberAppointments.length > 0 ? barberAppointments.length : appointments.length;
  const completedCount = barberAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  const waitingCount = waitingAppointments.length;
  const cancelledCount = barberAppointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED).length;

  const handleAdjustDelay = async (addedMins) => {
    if (isDeactivatedByShop) {
      toast.error('Your barber station is deactivated by the shop owner');
      return;
    }
    if (isShopClosed) {
      toast.error('Cannot adjust queue buffer while the shop is closed');
      return;
    }
    if (!isAvailable) {
      toast.error('Cannot adjust queue buffer while off duty');
      return;
    }
    try {
      const current = myProfile?.delayMinutes || 0;
      const newDelay = addedMins === 0 ? 0 : Math.max(0, current + addedMins);
      await dispatch(updateQueueDelay(newDelay)).unwrap();
      toast.success(newDelay > 0 ? `Delay: +${newDelay} mins` : 'Delay reset');
      loadQueue();
    } catch (err) {
      toast.error('Failed to update delay');
    }
  };

  const delayMinutes = myProfile?.delayMinutes || 0;

  if (isDeactivatedByShop) {
    return <BarberDeactivatedState />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* 1. Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">Barber Station Dashboard</h2>
              <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ${
                isDeactivatedByShop
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                  : isShopClosed
                  ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  : isAvailable 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200/70'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isDeactivatedByShop ? 'bg-rose-500' : isShopClosed ? 'bg-zinc-400' : isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`} />
                {isDeactivatedByShop ? 'Station Deactivated' : isShopClosed ? 'Off Duty (Shop Closed)' : isAvailable ? 'Station Active' : 'On Break'}
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">Your Queue, Simplified. Manage live customer line, approval requests & active cuts.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          {/* Availability Toggle */}
          <button
            onClick={handleToggleAvailability}
            disabled={isDeactivatedByShop || isShopClosed}
            className={`flex-1 lg:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all shadow-2xs ${
              isDeactivatedByShop || isShopClosed
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : isAvailable
                ? 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer'
                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            {isShopClosed ? (
              <>
                <Coffee className="w-4 h-4 text-zinc-400" />
                <span>Shop Closed</span>
              </>
            ) : isAvailable ? (
              <>
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Take a Break</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Go Online</span>
              </>
            )}
          </button>

          {/* Quick Add Walk-in Button */}
          <button
            onClick={() => setWalkInOpen(true)}
            disabled={isDeactivatedByShop || isShopClosed}
            className={`flex-1 lg:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors ${
              isDeactivatedByShop || isShopClosed
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Walk-in</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today Total */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Today's Line</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{todayTotal}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Total registered customers</p>
          </div>
        </div>

        {/* Card 2: Waiting Queue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">In Waiting Queue</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-blue-600">{waitingCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Waiting for their turn</p>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Completed Today</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{completedCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Finished appointments</p>
          </div>
        </div>

        {/* Card 4: Cancelled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cancelled</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{cancelledCount}</div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Cancelled / rejected today</p>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Queue & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Pending Approval Section */}
          {pendingAppointments.length > 0 && (
            <div className="bg-amber-50/60 rounded-3xl p-4 sm:p-6 shadow-card border border-amber-200/80">
              <div className="flex items-center justify-between mb-4 border-b border-amber-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                      Booking Requests ({pendingAppointments.length})
                    </h2>
                    <p className="text-xs text-amber-900/80 font-medium mt-0.5">Action required before adding to queue</p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 bg-amber-200/70 text-amber-900 rounded-full border border-amber-300/80">
                  Needs Approval
                </span>
              </div>

              <div className="space-y-3">
                {pendingAppointments.map((apt) => (
                  <div key={apt._id} className="bg-white rounded-2xl p-4 shadow-2xs border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
                      {apt.customerId?.avatar ? (
                        <img
                          src={apt.customerId.avatar}
                          alt={getCustomerName(apt)}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          {getCustomerName(apt).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug truncate">{getCustomerName(apt)}</h3>
                          <SourceBadge source={apt.source} />
                          {isCarriedOver(apt.bookedAt) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                              Previous Day
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                          {apt.serviceName} • {apt.serviceDuration} min • <span className="text-emerald-700 font-bold">₹{apt.totalPrice || 0}</span>
                        </p>
                        {getCustomerPhone(apt) && (
                          <a
                            href={`tel:${getCustomerPhone(apt)}`}
                            className="text-xs text-zinc-600 hover:text-zinc-900 font-bold inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-zinc-50 border border-zinc-200"
                            title="Call Customer"
                          >
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{getCustomerPhone(apt)}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleReject(apt._id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(apt._id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Queue & Current Turn Section */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-card border border-zinc-200/80 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">Active Queue Station</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">Active customer on the chair</p>
                </div>
              </div>
              <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold ${
                currentAppointment 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                  : 'bg-zinc-100 text-zinc-700 border border-zinc-200/70'
              }`}>
                {currentAppointment ? 'In Service' : 'Chair Free'}
              </span>
            </div>

            {currentAppointment ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-100/80">
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                  {currentAppointment.customerId?.avatar ? (
                    <img
                      src={currentAppointment.customerId.avatar}
                      alt={getCustomerName(currentAppointment)}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-zinc-200 shadow-sm shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-sm">
                      {getCustomerName(currentAppointment).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 truncate">{getCustomerName(currentAppointment)}</h3>
                      <SourceBadge source={currentAppointment.source} />
                    </div>
                    <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                      {currentAppointment.serviceName} • {currentAppointment.serviceDuration} min • <span className="text-emerald-700 font-bold">₹{currentAppointment.totalPrice || 0}</span>
                    </p>
                    {getCustomerPhone(currentAppointment) && (
                      <a
                        href={`tel:${getCustomerPhone(currentAppointment)}`}
                        className="text-xs text-zinc-700 hover:text-zinc-900 font-bold inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{getCustomerPhone(currentAppointment)}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <button 
                    onClick={() => setActionDialog({ isOpen: true, type: 'complete', appointmentId: currentAppointment._id })}
                    className="w-full md:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Service</span>
                  </button>
                </div>
              </div>
            ) : waitingAppointments.length > 0 ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 bg-zinc-50/70 p-4 sm:p-5 rounded-2xl border border-zinc-200/80">
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                  {waitingAppointments[0].customerId?.avatar ? (
                    <img
                      src={waitingAppointments[0].customerId.avatar}
                      alt={getCustomerName(waitingAppointments[0])}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
                      {getCustomerName(waitingAppointments[0]).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 truncate">{getCustomerName(waitingAppointments[0])}</h3>
                      <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200 shrink-0">
                        Next in Line
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                      {waitingAppointments[0].serviceName} ({waitingAppointments[0].serviceDuration} min)
                    </p>
                    {getCustomerPhone(waitingAppointments[0]) && (
                      <a
                        href={`tel:${getCustomerPhone(waitingAppointments[0])}`}
                        className="text-xs text-zinc-700 hover:text-zinc-900 font-bold inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{getCustomerPhone(waitingAppointments[0])}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <button 
                    onClick={() => setActionDialog({ isOpen: true, type: 'start', appointmentId: waitingAppointments[0]._id })}
                    className="w-full md:w-auto justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" /> Start Service
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-10 text-zinc-500 font-medium">
                <Coffee className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-700">No active queue right now</p>
                <p className="text-xs text-zinc-400 mt-0.5">Your chair is ready when new customers walk in or book online.</p>
              </div>
            )}
          </div>

          {/* Upcoming Queue List */}
          <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-card border border-zinc-200/80">
            <div className="flex items-center justify-between mb-4 sm:mb-5 border-b border-zinc-100 pb-3.5 sm:pb-4">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-zinc-900 uppercase tracking-wider">Upcoming Queue Line</h2>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">Customers waiting in line for your station</p>
              </div>
              <span className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                {waitingAppointments.length} Waiting
              </span>
            </div>
            
            {waitingAppointments.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {waitingAppointments.map((apt, index) => (
                  <div key={apt._id} className="py-3.5 flex items-start justify-between gap-2.5 hover:bg-zinc-50/50 transition-colors px-1.5 sm:px-2 rounded-xl">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h4 className="font-bold text-zinc-900 text-sm leading-snug truncate">{getCustomerName(apt)}</h4>
                          <SourceBadge source={apt.source} />
                          {isCarriedOver(apt.bookedAt) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                              Previous Day
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                          {apt.serviceName} • {apt.serviceDuration} min
                        </p>
                        {getCustomerPhone(apt) && (
                          <div className="hidden sm:block mt-1">
                            <a
                              href={`tel:${getCustomerPhone(apt)}`}
                              className="text-[11px] text-zinc-600 hover:text-zinc-900 font-bold inline-flex items-center gap-1"
                              title="Call Customer"
                            >
                              <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{getCustomerPhone(apt)}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons on the same row as customer name */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {index === 0 && !currentAppointment && (
                        <button 
                          onClick={() => setActionDialog({ isOpen: true, type: 'start', appointmentId: apt._id })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Start Service"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Start</span>
                        </button>
                      )}
                      <button 
                        onClick={() => setActionDialog({ isOpen: true, type: 'noshow', appointmentId: apt._id })}
                        className="bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Mark No Show"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400 text-xs font-medium">
                Waiting queue is currently empty.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Info */}
        <div className="space-y-5 sm:space-y-6">
          {/* Station Timing & Queue Delay Adjustment Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-zinc-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">Queue Delay Buffer</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Add buffer to all upcoming queues</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                delayMinutes > 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
              }`}>
                {delayMinutes > 0 ? `+${delayMinutes}m delay` : 'On Schedule'}
              </span>
            </div>

            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              If the current service is taking longer, add extra buffer time to update estimated wait times for all waiting customers in real-time.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAdjustDelay(5)}
                disabled={isDeactivatedByShop || isShopClosed || !isAvailable}
                className={`py-2 px-1 rounded-xl border text-xs font-bold transition-colors shadow-2xs text-center ${
                  isDeactivatedByShop || isShopClosed || !isAvailable
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800 cursor-pointer'
                }`}
              >
                +5 min
              </button>
              <button
                onClick={() => handleAdjustDelay(10)}
                disabled={isDeactivatedByShop || isShopClosed || !isAvailable}
                className={`py-2 px-1 rounded-xl border text-xs font-bold transition-colors shadow-2xs text-center ${
                  isDeactivatedByShop || isShopClosed || !isAvailable
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800 cursor-pointer'
                }`}
              >
                +10 min
              </button>
              <button
                onClick={() => handleAdjustDelay(15)}
                disabled={isDeactivatedByShop || isShopClosed || !isAvailable}
                className={`py-2 px-1 rounded-xl border text-xs font-bold transition-colors shadow-2xs text-center ${
                  isDeactivatedByShop || isShopClosed || !isAvailable
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800 cursor-pointer'
                }`}
              >
                +15 min
              </button>
            </div>

            {delayMinutes > 0 && (
              <button
                onClick={() => handleAdjustDelay(0)}
                disabled={isDeactivatedByShop || isShopClosed || !isAvailable}
                className={`w-full py-2 rounded-xl border text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs ${
                  isDeactivatedByShop || isShopClosed || !isAvailable
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200/80 text-rose-700 cursor-pointer'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Delay (0 min)</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-zinc-200/80 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3">Station Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-medium">Barber Rating:</span>
                <span className="font-bold text-zinc-900 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                  <span>{Number(myProfile?.averageRating || myProfile?.rating || 0) > 0 ? Number(myProfile.averageRating || myProfile.rating).toFixed(1) : '0.0'}</span>
                  <span className="text-zinc-400 text-[10px]">({myProfile?.reviewCount || 0} reviews)</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-medium">Approval Requests:</span>
                <span className="font-bold text-zinc-900">{pendingAppointments.length}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-medium">People Waiting:</span>
                <span className="font-bold text-zinc-900">{waitingAppointments.length}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-medium">Station Mode:</span>
                <span className={`font-bold ${isAvailable ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isAvailable ? 'Online & Available' : 'On Break'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, type: 'start', appointmentId: null })}
        onConfirm={handleAction}
        title={
          actionDialog.type === 'start' ? 'Start Service' :
          actionDialog.type === 'complete' ? 'Complete Service' :
          actionDialog.type === 'noshow' ? 'Mark No-Show' : 'Cancel Appointment'
        }
        message={`Are you sure you want to ${actionDialog.type} this customer service?`}
        confirmText="Confirm"
        type={actionDialog.type === 'start' || actionDialog.type === 'complete' ? 'primary' : 'danger'}
      />

      <WalkInModal isOpen={walkInOpen} onClose={() => setWalkInOpen(false)} />
    </div>
  );
};
