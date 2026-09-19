import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  UserPlus,
  Coffee,
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
  cancelAppointment,
} from '../../redux/slices/appointment.slice.js';
import {
  fetchMyBarberProfile,
  toggleMyAvailability,
  updateQueueDelay,
} from '../../redux/slices/barber.slice.js';
import { fetchMyBarberReviews } from '../../redux/slices/review.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { WalkInModal } from '../../components/ui/WalkInModal';
import { BarberDeactivatedState } from '../../components/ui/BarberDeactivatedState.jsx';

import { CurrentServiceCard } from '../../components/barber/dashboard/CurrentServiceCard';
import { PendingApprovalsCard } from '../../components/barber/dashboard/PendingApprovalsCard';
import { WaitingQueueCard } from '../../components/barber/dashboard/WaitingQueueCard';
import { QueueDelayBufferCard } from '../../components/barber/dashboard/QueueDelayBufferCard';

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const { barberQueue: appointments = [], barberAppointments = [] } = useSelector(
    (state) => state.appointment
  );
  const { myProfile } = useSelector((state) => state.barber);

  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    type: 'start',
    appointmentId: null,
  });
  const [walkInOpen, setWalkInOpen] = useState(false);

  const isShopClosed =
    myProfile?.shopId?.isOpen === false || myProfile?.shopId?.isActive === false;
  const isAvailable = myProfile?.isAvailable !== false && !isShopClosed;
  const isDeactivatedByShop = myProfile?.isActive === false;

  const loadQueue = () => {
    dispatch(fetchMyBarberProfile());
    dispatch(fetchBarberQueue());
    dispatch(fetchBarberAppointments('all'));
    dispatch(fetchMyBarberReviews());
  };

  useEffect(() => {
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

  const pendingAppointments = appointments.filter(
    (a) => a.status === AppointmentStatus.PENDING_APPROVAL
  );
  const currentAppointment = appointments.find(
    (a) => a.status === AppointmentStatus.IN_SERVICE
  );
  const waitingAppointments = appointments
    .filter((a) => a.status === AppointmentStatus.WAITING)
    .sort((a, b) => a.queueNumber - b.queueNumber);

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

  // Stats
  const todayHistory = useMemo(() => {
    return barberAppointments.filter((a) => isToday(a.bookedAt || a.createdAt));
  }, [barberAppointments]);

  const completedCount = useMemo(() => {
    return todayHistory.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
  }, [todayHistory]);

  const waitingCount = waitingAppointments.length;

  const cancelledCount = useMemo(() => {
    return todayHistory.filter(
      (a) =>
        a.status === AppointmentStatus.CANCELLED ||
        a.status === AppointmentStatus.REJECTED
    ).length;
  }, [todayHistory]);

  const todayTotal = useMemo(() => {
    return todayHistory.length > 0 ? todayHistory.length : appointments.length;
  }, [todayHistory, appointments]);

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
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Barber Station Dashboard
              </h2>
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ${
                  isDeactivatedByShop
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                    : isShopClosed
                    ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    : isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDeactivatedByShop
                      ? 'bg-rose-500'
                      : isShopClosed
                      ? 'bg-zinc-400'
                      : isAvailable
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                {isDeactivatedByShop
                  ? 'Station Deactivated'
                  : isShopClosed
                  ? 'Off Duty (Shop Closed)'
                  : isAvailable
                  ? 'Station Active'
                  : 'On Break'}
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Your Queue, Simplified. Manage live customer line, approval requests & active cuts.
            </p>
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
          <PendingApprovalsCard
            pendingAppointments={pendingAppointments}
            getCustomerName={getCustomerName}
            getCustomerPhone={getCustomerPhone}
            isCarriedOver={isCarriedOver}
            handleReject={handleReject}
            handleApprove={handleApprove}
          />

          <CurrentServiceCard
            currentAppointment={currentAppointment}
            waitingAppointments={waitingAppointments}
            getCustomerName={getCustomerName}
            getCustomerPhone={getCustomerPhone}
            setActionDialog={setActionDialog}
          />

          <WaitingQueueCard
            waitingAppointments={waitingAppointments}
            currentAppointment={currentAppointment}
            getCustomerName={getCustomerName}
            getCustomerPhone={getCustomerPhone}
            isCarriedOver={isCarriedOver}
            setActionDialog={setActionDialog}
          />
        </div>

        <QueueDelayBufferCard
          delayMinutes={delayMinutes}
          handleAdjustDelay={handleAdjustDelay}
          isDeactivatedByShop={isDeactivatedByShop}
          isShopClosed={isShopClosed}
          isAvailable={isAvailable}
          myProfile={myProfile}
          pendingCount={pendingAppointments.length}
          waitingCount={waitingAppointments.length}
        />
      </div>

      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, type: 'start', appointmentId: null })}
        onConfirm={handleAction}
        title={
          actionDialog.type === 'start'
            ? 'Start Service'
            : actionDialog.type === 'complete'
            ? 'Complete Service'
            : actionDialog.type === 'noshow'
            ? 'Mark No-Show'
            : 'Cancel Appointment'
        }
        message={`Are you sure you want to ${actionDialog.type} this customer service?`}
        confirmText="Confirm"
        type={
          actionDialog.type === 'start' || actionDialog.type === 'complete' ? 'primary' : 'danger'
        }
      />

      <WalkInModal isOpen={walkInOpen} onClose={() => setWalkInOpen(false)} />
    </div>
  );
};
