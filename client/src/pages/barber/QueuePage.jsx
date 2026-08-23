import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBarberQueue, 
  startService, 
  completeService, 
  approveAppointment, 
  rejectAppointment, 
  markNoShow, 
  cancelAppointment 
} from '../../redux/slices/appointment.slice.js';
import { fetchMyBarberProfile, updateQueueDelay } from '../../redux/slices/barber.slice.js';
import { AppointmentStatus, AppointmentSource } from '../../utils/constants.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { WalkInModal } from '../../components/ui/WalkInModal';
import { BarberDeactivatedState } from '../../components/ui/BarberDeactivatedState.jsx';
import { Skeleton } from '../../components/ui/Skeleton';
import { Play, Check, X, AlertTriangle, UserPlus, Phone, Scissors, CheckCircle, ListOrdered, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const QueuePage = () => {
  const dispatch = useDispatch();
  const { barberQueue: appointments = [], loading } = useSelector((state) => state.appointment);
  const { myProfile } = useSelector((state) => state.barber);
  const [actionDialog, setActionDialog] = useState({
    isOpen: false, type: 'start', appointmentId: null
  });
  const [walkInOpen, setWalkInOpen] = useState(false);

  const isShopClosed = myProfile?.shopId?.isOpen === false || myProfile?.shopId?.isActive === false;
  const isDeactivatedByShop = myProfile?.isActive === false;
  const isOffDuty = myProfile?.isAvailable === false || isShopClosed;

  const fetchQueue = useCallback(() => {
    dispatch(fetchBarberQueue());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMyBarberProfile());
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue, dispatch]);

  const handleAdjustDelay = async (addedMins) => {
    if (isDeactivatedByShop) {
      toast.error('Your barber station is deactivated by the shop owner');
      return;
    }
    if (isShopClosed) {
      toast.error('Cannot adjust buffer while the shop is closed');
      return;
    }
    if (isOffDuty) {
      toast.error('Cannot adjust buffer while off duty');
      return;
    }
    try {
      const current = myProfile?.delayMinutes || 0;
      const newDelay = addedMins === 0 ? 0 : Math.max(0, current + addedMins);
      await dispatch(updateQueueDelay(newDelay)).unwrap();
      toast.success(newDelay > 0 ? `Delay: +${newDelay} mins` : 'Delay reset');
      fetchQueue();
    } catch (err) {
      toast.error('Failed to update delay');
    }
  };

  const delayMinutes = myProfile?.delayMinutes || 0;

  const handleApprove = async (id) => {
    try {
      await dispatch(approveAppointment(id)).unwrap();
      toast.success('Appointment approved!');
      fetchQueue();
    } catch (err) {
      toast.error(err || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await dispatch(rejectAppointment(id)).unwrap();
      toast.success('Appointment rejected');
      fetchQueue();
    } catch (err) {
      toast.error(err || 'Rejection failed');
    }
  };

  const handleAction = async () => {
    const { type, appointmentId } = actionDialog;
    if (!appointmentId) return;
    try {
      if (type === 'start') {
        await dispatch(startService(appointmentId)).unwrap();
        toast.success('Service started');
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
      fetchQueue();
      setActionDialog({ isOpen: false, type: 'start', appointmentId: null });
    } catch (err) {
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

  const activeAppointments = appointments.filter(a => 
    a.status === AppointmentStatus.PENDING_APPROVAL || 
    a.status === AppointmentStatus.WAITING || 
    a.status === AppointmentStatus.IN_SERVICE
  );
  const current = activeAppointments.find(a => a.status === AppointmentStatus.IN_SERVICE);

  if (myProfile?.isActive === false) {
    return <BarberDeactivatedState />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Delay Adjustment */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-card flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">Manage Live Queue</h2>
              <span className="hidden sm:inline-flex bg-zinc-100 text-zinc-800 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 rounded-full border border-zinc-200">
                {activeAppointments.length} Active
              </span>
              <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                delayMinutes > 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
              }`}>
                {delayMinutes > 0 ? `+${delayMinutes}m Buffer Delay` : 'On Schedule'}
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">Your Queue, Simplified. Real-time sequence, approvals, and station progression.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
          {/* Quick Delay Adjustment Pills */}
          <div className={`flex items-center justify-between sm:justify-start gap-1 p-1 sm:p-1.5 rounded-2xl border transition-colors ${
            isShopClosed || isDeactivatedByShop || isOffDuty 
              ? 'bg-zinc-100/70 border-zinc-200 opacity-60' 
              : 'bg-zinc-50/80 border-zinc-200/80'
          }`}>
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" /> Buffer:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAdjustDelay(5)}
                disabled={isShopClosed || isDeactivatedByShop || isOffDuty}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                  isShopClosed || isDeactivatedByShop || isOffDuty
                    ? 'text-zinc-400 cursor-not-allowed'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer'
                }`}
                title="Add 5 min delay"
              >
                +5m
              </button>
              <button
                onClick={() => handleAdjustDelay(10)}
                disabled={isShopClosed || isDeactivatedByShop || isOffDuty}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                  isShopClosed || isDeactivatedByShop || isOffDuty
                    ? 'text-zinc-400 cursor-not-allowed'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer'
                }`}
                title="Add 10 min delay"
              >
                +10m
              </button>
              <button
                onClick={() => handleAdjustDelay(15)}
                disabled={isShopClosed || isDeactivatedByShop || isOffDuty}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                  isShopClosed || isDeactivatedByShop || isOffDuty
                    ? 'text-zinc-400 cursor-not-allowed'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer'
                }`}
                title="Add 15 min delay"
              >
                +15m
              </button>
              {delayMinutes > 0 && (
                <button
                  onClick={() => handleAdjustDelay(0)}
                  disabled={isShopClosed || isDeactivatedByShop || isOffDuty}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                    isShopClosed || isDeactivatedByShop || isOffDuty
                      ? 'text-zinc-400 bg-zinc-100 cursor-not-allowed'
                      : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                  }`}
                  title="Reset delay to 0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={() => {
              if (isShopClosed) {
                toast.error('Cannot add walk-in while the shop is closed');
                return;
              }
              if (isOffDuty) {
                toast.error('Cannot add walk-in while off duty');
                return;
              }
              setWalkInOpen(true);
            }}
            disabled={isShopClosed || isDeactivatedByShop || isOffDuty}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors ${
              isShopClosed || isDeactivatedByShop || isOffDuty
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Walk-in</span>
          </button>
        </div>
      </div>

      {/* 2. Table Card */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        {loading && appointments.length === 0 ? (
          <div className="p-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : activeAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-500 whitespace-nowrap">
                  <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-6 py-4 whitespace-nowrap">Position / Token</th>
                  <th className="px-6 py-4 whitespace-nowrap">Service</th>
                  <th className="px-6 py-4 whitespace-nowrap">Source</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm whitespace-nowrap">
                {activeAppointments.sort((a,b) => a.queueNumber - b.queueNumber).map((apt, idx) => {
                  const isPending = apt.status === AppointmentStatus.PENDING_APPROVAL;
                  const isCurrent = apt.status === AppointmentStatus.IN_SERVICE;
                  const canStart = !current && idx === 0 && apt.status === AppointmentStatus.WAITING;

                  return (
                    <tr 
                      key={apt._id} 
                      className={`transition-colors whitespace-nowrap ${
                        isCurrent 
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/60' 
                          : isPending 
                          ? 'bg-amber-50/30 hover:bg-amber-50/50' 
                          : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      {/* Customer (First Column) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {apt.customerId?.avatar ? (
                            <img
                              src={apt.customerId.avatar}
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
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-zinc-900 text-sm leading-snug">{getCustomerName(apt)}</p>
                              {isCarriedOver(apt.bookedAt) && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                  Previous Day
                                </span>
                              )}
                            </div>
                            {getCustomerPhone(apt) && (
                              <a 
                                href={`tel:${getCustomerPhone(apt)}`}
                                className="text-[11px] text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1 mt-0.5"
                                title="Call Customer"
                              >
                                <Phone className="w-3 h-3 text-zinc-400" />
                                <span>{getCustomerPhone(apt)}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position / Token (Second Column) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            PENDING
                          </span>
                        ) : isCurrent ? (
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </span>
                            <div>
                              <span className="font-black text-emerald-800 block text-xs">NOW SERVING</span>
                              <span className="text-[11px] text-zinc-500 font-medium">Token #{apt.queueNumber}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 font-black text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium">Token #{apt.queueNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Service */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-zinc-900">{apt.serviceName}</p>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">{apt.serviceDuration} min • <span className="font-bold text-emerald-700">₹{apt.totalPrice || 0}</span></p>
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SourceBadge source={apt.source} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                          isCurrent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' :
                          isPending ? 'bg-amber-50 text-amber-800 border border-amber-200/70' :
                          'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isCurrent ? 'bg-emerald-500 animate-pulse' :
                            isPending ? 'bg-amber-500' :
                            'bg-blue-500'
                          }`} />
                          {isCurrent ? 'IN SERVICE' : isPending ? 'PENDING APPROVAL' : 'WAITING'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <button 
                                onClick={() => handleApprove(apt._id)} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5"/> Accept
                              </button>
                              <button 
                                onClick={() => handleReject(apt._id)} 
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5"/> Decline
                              </button>
                            </>
                          ) : isCurrent ? (
                            <button 
                              onClick={() => setActionDialog({ isOpen: true, type: 'complete', appointmentId: apt._id })} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4"/> Complete Service
                            </button>
                          ) : (
                            <>
                              {canStart && (
                                <button 
                                  onClick={() => setActionDialog({ isOpen: true, type: 'start', appointmentId: apt._id })} 
                                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white"/> Start
                                </button>
                              )}
                              <button 
                                onClick={() => setActionDialog({ isOpen: true, type: 'noshow', appointmentId: apt._id })} 
                                className="bg-white hover:bg-amber-50 text-amber-800 border border-zinc-200 hover:border-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Mark No Show"
                              >
                                <AlertTriangle className="w-3.5 h-3.5"/>
                              </button>
                              <button 
                                onClick={() => setActionDialog({ isOpen: true, type: 'cancel', appointmentId: apt._id })} 
                                className="bg-white hover:bg-rose-50 text-rose-700 border border-zinc-200 hover:border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Cancel Appointment"
                              >
                                <X className="w-3.5 h-3.5"/>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500 font-medium">
            <ListOrdered className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-700">No customers currently in queue</p>
            <p className="text-xs text-zinc-400 mt-0.5">When customers book or walk in, they will appear here live.</p>
          </div>
        )}
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
        confirmLabel="Confirm"
        type={actionDialog.type === 'start' || actionDialog.type === 'complete' ? 'primary' : 'danger'}
        confirmVariant={actionDialog.type === 'start' || actionDialog.type === 'complete' ? 'primary' : 'danger'}
      />

      <WalkInModal isOpen={walkInOpen} onClose={() => setWalkInOpen(false)} />
    </div>
  );
};
