import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Scissors, 
  CheckCircle2, 
  ChevronLeft, 
  MapPin, 
  Star, 
  Users, 
  Store, 
  Sparkles, 
  Ticket, 
  AlertCircle, 
  Phone,
  Navigation,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppointmentById, cancelAppointment } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ReviewModal } from '../../components/ui/ReviewModal';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const QueueTrackingPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentAppointmentDetails, loading } = useSelector((state) => state.appointment);
  const appointment = currentAppointmentDetails?.appointment || currentAppointmentDetails;
  const queueInfo = currentAppointmentDetails?.queueInfo || null;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [hasPromptedReview, setHasPromptedReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchDetails = useCallback(() => {
    if (appointmentId) {
      dispatch(fetchAppointmentById(appointmentId));
    }
  }, [dispatch, appointmentId]);

  useEffect(() => {
    fetchDetails();
    const intervalId = setInterval(fetchDetails, 15000);
    return () => clearInterval(intervalId);
  }, [fetchDetails]);

  // Check if customer already reviewed or prompt on completion
  useEffect(() => {
    if (appointment?.status === AppointmentStatus.COMPLETED && !hasPromptedReview) {
      const sId = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId._id : appointment.shopId;
      const bId = typeof appointment.barberId === 'object' && appointment.barberId ? appointment.barberId._id : appointment.barberId;
      if (sId && bId) {
        axiosInstance
          .get(API_PATHS.REVIEW.CHECK, { params: { shopId: sId, barberId: bId } })
          .then((res) => {
            const alreadyReviewed = !!res.data?.hasReviewed;
            setHasReviewed(alreadyReviewed);
            if (!alreadyReviewed) {
              setReviewModalOpen(true);
            }
          })
          .catch(() => {})
          .finally(() => setHasPromptedReview(true));
      }
    }
  }, [appointment?.status, appointment?.shopId, appointment?.barberId, hasPromptedReview]);

  const handleCancel = async () => {
    if (!appointmentId) return;
    try {
      setCancelling(true);
      await dispatch(cancelAppointment(appointmentId)).unwrap();
      fetchDetails();
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Failed to cancel', err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !appointment) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-1/4 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 font-sans text-zinc-900">
        <h2 className="text-lg font-bold text-zinc-900">Appointment not found</h2>
        <p className="text-sm text-zinc-500">We could not load the details of this appointment.</p>
        <button 
          onClick={() => navigate('/appointments')} 
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          My Appointments
        </button>
      </div>
    );
  }

  const shopName = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId.name : 'Barber Shop';
  const shopAddress = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId.address : '';
  const shopCity = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId.city : '';
  const shopPhone = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId.phone : '';
  const barberName = typeof appointment.barberId === 'object' && appointment.barberId && typeof appointment.barberId.userId === 'object' ? appointment.barberId.userId.name : 'Barber';
  
  const peopleAhead = queueInfo?.peopleAhead ?? 0;
  const estimatedWait = queueInfo?.estimatedWait ?? 0;
  const displayQueueNumber = appointment.queueNumber || 0;
  
  const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
  const isCancelled = appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.NO_SHOW;
  const isRejected = appointment.status === AppointmentStatus.REJECTED;
  const isInService = appointment.status === AppointmentStatus.IN_SERVICE;
  const isPending = appointment.status === AppointmentStatus.PENDING_APPROVAL;
  const isNear = appointment.status === AppointmentStatus.WAITING && peopleAhead <= 2 && peopleAhead > 0;
  const isTurn = appointment.status === AppointmentStatus.WAITING && peopleAhead === 0;
  
  let currentStepIndex = 2;
  if (isCompleted || isCancelled || isRejected) currentStepIndex = 5;
  else if (isInService) currentStepIndex = 4;
  else if (isTurn) currentStepIndex = 4;
  else if (isNear) currentStepIndex = 3;
  else if (isPending) currentStepIndex = 0;

  const bookedDate = appointment.bookedAt || appointment.createdAt;
  const formattedTime = bookedDate
    ? new Date(bookedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const steps = [
    { label: 'Booked', description: formattedTime },
    { label: isPending ? 'Awaiting Approval' : 'Confirmed', description: isPending ? 'Waiting for barber' : 'By salon' },
    { label: 'In Live Queue', description: `${peopleAhead} people ahead of you` },
    { label: 'Near You', description: 'Arrive at the salon' },
    { label: 'Your Turn / In Service', description: 'Ready for styling' },
  ];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    shopName + ', ' + shopAddress + ', ' + shopCity
  )}`;

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans text-zinc-900 pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back
          </button>

          <span className="text-xs font-semibold text-zinc-500">
            Live Status Tracker
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (2 Cols) - Live Queue Status & Stepper */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Status Board Hero Card */}
            {isCancelled || isRejected ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                    {isRejected ? 'Request Rejected' : 'Appointment Cancelled'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    {isRejected ? 'Booking Rejected' : 'Booking Cancelled'}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {shopName} • {barberName}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs text-zinc-600">
                  {isRejected 
                    ? 'The salon was unable to accept this request at this time.' 
                    : 'This appointment is no longer active in the queue.'}
                </div>
              </div>
            ) : isCompleted ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Service Completed
                  </span>
                  <span className="text-xs text-zinc-400">
                    {shopName}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    All Done!
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                    Stylist: <strong className="text-zinc-700">{barberName}</strong> • Service: {appointment.serviceName}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <p className="text-zinc-600">Thank you for visiting! How was your experience?</p>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{hasReviewed ? 'Edit Review' : 'Rate Experience'}</span>
                  </button>
                </div>
              </div>
            ) : isPending ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Awaiting Barber Approval
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Booking Request Sent
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {shopName} • {barberName}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs text-zinc-600">
                  Your request has been submitted to the barber. You will get a live queue token the moment it is confirmed.
                </div>
              </div>
            ) : isInService ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Currently In Service
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    You're Being Served
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {shopName} • {barberName}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs text-zinc-700 flex justify-between items-center">
                  <span>Service: <strong className="font-semibold text-zinc-900">{appointment.serviceName}</strong></span>
                  <span className="text-emerald-700 font-semibold">{appointment.serviceDuration} mins</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-zinc-100 shadow-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {isTurn ? 'Your Turn Now' : 'In Live Queue'}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {shopName}
                  </span>
                </div>

                <div className="text-center py-3.5 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Booking ID</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-normal mt-1">
                    #{(appointment._id || '').substring(0, 8).toUpperCase()}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Barber Chair: <span className="font-semibold text-zinc-800">{barberName}</span> • Token #{displayQueueNumber}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Ahead of You</p>
                    <p className="text-xl font-bold text-zinc-900 mt-0.5">{peopleAhead}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Queue Pos.</p>
                    <p className="text-xl font-bold text-zinc-900 mt-0.5">#{queueInfo?.position ?? (peopleAhead + 1)}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Est. Wait</p>
                    <p className="text-xl font-bold text-amber-600 mt-0.5">~{estimatedWait}m</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Live Progress Stepper */}
            {!isCancelled && !isCompleted && !isRejected && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 space-y-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                  Live Queue Progress
                </span>

                <div className="space-y-4 pl-1">
                  {steps.map((s, idx) => {
                    const isPast = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const stepNum = idx + 1;

                    return (
                      <div key={idx} className="flex items-start gap-4 relative">
                        {idx < steps.length - 1 && (
                          <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-[1px] ${
                            isPast ? 'bg-zinc-900' : 'bg-zinc-200'
                          }`} />
                        )}

                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                          isPast || isCurrent 
                            ? 'bg-zinc-900 text-white shadow-xs' 
                            : 'bg-white text-zinc-400 border border-zinc-300'
                        }`}>
                          {stepNum}
                        </div>

                        <div className="pt-0.5">
                          <h4 className={`text-sm font-semibold ${
                            isCurrent ? 'text-zinc-900 font-bold' : isPast ? 'text-zinc-700' : 'text-zinc-400'
                          }`}>
                            {s.label}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {s.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (1 Col) - Salon & Appointment Details Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
            
            {/* Salon Info Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 border-b border-zinc-100 pb-3">
                Salon & Contact
              </h3>

              <div className="space-y-3 text-xs text-zinc-600">
                <div>
                  <p className="font-semibold text-sm text-zinc-900">{shopName}</p>
                  <p className="text-zinc-500 mt-0.5">{shopAddress || 'Local Address'}, {shopCity}</p>
                </div>

                {shopPhone && (
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{shopPhone}</span>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            </div>

            {/* Appointment Breakdown Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
              <h3 className="font-semibold text-xs text-zinc-900 border-b border-zinc-100 pb-2">
                Booking Summary
              </h3>

              <div className="space-y-2 text-xs text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Service</span>
                  <span className="font-semibold text-zinc-900">{appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Est. Duration</span>
                  <span className="font-semibold text-zinc-900">{appointment.serviceDuration} mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Assigned Barber</span>
                  <span className="font-semibold text-zinc-900">{barberName}</span>
                </div>
              </div>

              {(appointment.status === AppointmentStatus.WAITING || appointment.status === AppointmentStatus.PENDING_APPROVAL) && (
                <div className="pt-3 border-t border-zinc-100 text-center">
                  <button 
                    onClick={() => setCancelDialogOpen(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer transition-colors"
                  >
                    Cancel this appointment
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? You will lose your position in the queue."
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
        confirmVariant="danger"
      />

      {/* Review Modal */}
      {reviewModalOpen && appointment && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          shopId={typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId._id : appointment.shopId}
          barberId={typeof appointment.barberId === 'object' && appointment.barberId ? appointment.barberId._id : appointment.barberId}
          appointmentId={appointment._id}
          shopName={shopName}
          barberName={barberName}
          onReviewSubmitted={() => {
            setHasReviewed(true);
          }}
        />
      )}
    </div>
  );
};

export default QueueTrackingPage;
