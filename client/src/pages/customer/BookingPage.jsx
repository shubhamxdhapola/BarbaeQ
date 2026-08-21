import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  Clock, 
  User, 
  Scissors, 
  ChevronLeft, 
  Users, 
  Star, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Store,
  Calendar,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShopById } from '../../redux/slices/shop.slice.js';
import { fetchShopBarbers } from '../../redux/slices/barber.slice.js';
import { fetchShopServices } from '../../redux/slices/service.slice.js';
import { bookAppointment, fetchMyAppointments } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const BookingPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [shopQueueInfo, setShopQueueInfo] = useState([]);

  const shop = useSelector((state) => state.shop.selectedShop);
  const barbers = useSelector((state) => state.barber.barbers);
  const services = useSelector((state) => state.service.services);
  const myAppointments = useSelector((state) => state.appointment.myAppointments);
  const loading = useSelector((state) => state.shop.loading || state.barber.loading || state.service.loading);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    dispatch(fetchShopById(shopId));
    dispatch(fetchShopBarbers(shopId));
    dispatch(fetchShopServices({ shopId, activeOnly: true }));
    dispatch(fetchMyAppointments());

    // Fetch live queue info for all barbers in this shop
    axiosInstance.get(API_PATHS.SHOP.QUEUE_INFO(shopId))
      .then(res => setShopQueueInfo(res.data.data || []))
      .catch(() => {});
  }, [dispatch, shopId]);

  // Automatically scroll to top whenever changing steps (Services -> Barber -> Confirmation)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  // Find if user already has an active appointment at this shop
  const activeExistingAppt = myAppointments?.find(a => {
    const aShopId = typeof a.shopId === 'object' && a.shopId ? a.shopId._id : a.shopId;
    return aShopId === shopId && [AppointmentStatus.PENDING_APPROVAL, AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE].includes(a.status);
  });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BQ';
  const getBarberName = (b) => typeof b.userId === 'object' && b.userId ? b.userId.name : 'Barber';

  const toggleServiceSelect = (service) => {
    const isSelected = selectedServices.some(s => s._id === service._id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s._id !== service._id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  const handleBook = async () => {
    if (!shopId || selectedServices.length === 0 || !selectedBarber) return;
    if (selectedBarber.isAvailable === false || selectedBarber.isActive === false) {
      toast.error('Selected barber is currently off duty and unavailable for booking');
      return;
    }
    try {
      setSubmitting(true);
      const result = await dispatch(bookAppointment({
        shopId,
        serviceId: selectedServices[0]._id,
        serviceIds: selectedServices.map(s => s._id),
        barberId: selectedBarber._id
      })).unwrap();

      const apptId = result?.appointment?._id || result?._id;
      if (apptId) {
        toast.success('Appointment requested!');
        navigate(`/booking/success/${apptId}`);
      }
    } catch (err) {
      console.error('Booking failed', err);
      toast.error(err || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans text-zinc-900 pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else navigate(-1);
            }}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back
          </button>

          <span className="text-xs font-semibold text-zinc-500">
            {shop?.name || 'Salon Booking'}
          </span>
        </div>

        {/* Step Indicator Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900">
              {step === 1 ? 'Step 1: Select Services' : step === 2 ? 'Step 2: Choose Barber' : 'Step 3: Review & Confirm'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === 1 ? 'Pick one or more grooming services' : step === 2 ? 'Choose your preferred styling specialist' : 'Confirm your appointment reservation'}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div 
                  onClick={() => {
                    if (s < step) setStep(s);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s <= step ? 'bg-zinc-900 text-white cursor-pointer' : 'bg-zinc-100 text-zinc-400'
                  }`} 
                >
                  {s < step ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s}
                </div>
                {i < 2 && (
                  <div className={`w-8 sm:w-12 h-0.5 ${s < step ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (2 Cols) - Step Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Services Selection */}
            {step === 1 && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">Service Menu</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Select multiple services if needed</p>
                  </div>
                  <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-lg">
                    {selectedServices.length} Selected
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                  {services.length > 0 ? services.map((service) => {
                    const isSelected = selectedServices.some(s => s._id === service._id);
                    return (
                      <div 
                        key={service._id} 
                        onClick={() => toggleServiceSelect(service)}
                        className={`p-4 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-zinc-900">{service.name}</p>
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span>{service.duration} mins duration</span>
                            </p>
                          </div>
                        </div>

                        <span className="font-bold text-sm text-zinc-900">₹{service.price}</span>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-zinc-500 p-8 text-center">No services available</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Barber Selection */}
            {step === 2 && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">Select Barber Chair</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose your preferred barber or first available</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {barbers.map((barber) => {
                    const name = getBarberName(barber);
                    const isSelected = selectedBarber?._id === barber._id;
                    const qInfo = shopQueueInfo.find(q => q.barberId === barber._id);
                    const isAvailable = barber.isAvailable !== false && barber.isActive !== false;

                    return (
                      <div
                        key={barber._id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedBarber(barber);
                          } else {
                            toast.error(`${name} is currently off duty and not accepting bookings`);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          !isAvailable
                            ? 'opacity-60 bg-zinc-50/70 border-zinc-200 cursor-not-allowed select-none'
                            : isSelected 
                            ? 'border-zinc-900 bg-zinc-50/80 shadow-xs cursor-pointer' 
                            : 'border-zinc-200 bg-white hover:border-zinc-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                            isAvailable ? 'text-zinc-900' : 'text-zinc-400 grayscale'
                          }`}>
                            {barber.userId?.avatar ? (
                              <img src={barber.userId.avatar} alt={name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              getInitials(name)
                            )}
                          </div>
                          <div>
                            <h3 className={`font-semibold text-sm ${isAvailable ? 'text-zinc-900' : 'text-zinc-500'}`}>{name}</h3>
                            {barber.specialty && (
                              <p className="text-xs text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>{barber.specialty}</span>
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
                                isAvailable ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {isAvailable ? 'Available' : 'Off Duty'}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {isAvailable 
                                  ? (qInfo?.queueLength > 0 ? `${qInfo.queueLength} in line (~${qInfo.estimatedWait}m)` : 'No wait')
                                  : 'Not accepting bookings'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          !isAvailable
                            ? 'border-zinc-200 bg-zinc-100 text-transparent cursor-not-allowed'
                            : isSelected 
                            ? 'bg-zinc-900 border-zinc-900 text-white' 
                            : 'border-zinc-300'
                        }`}>
                          {isSelected && isAvailable && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Confirmation Details */}
            {step === 3 && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900">Review Booking Details</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Please review your appointment summary before booking</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Salon</p>
                      <p className="font-semibold text-zinc-900 text-sm mt-1">{shop?.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{shop?.address}, {shop?.city}</p>
                    </div>

                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stylist</p>
                      <p className="font-semibold text-zinc-900 text-sm mt-1">{selectedBarber ? getBarberName(selectedBarber) : 'Any Barber'}</p>
                      {selectedBarber?.specialty && (
                        <p className="text-xs text-zinc-600 font-medium mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{selectedBarber.specialty}</span>
                        </p>
                      )}
                      <p className="text-xs text-amber-700 font-medium mt-0.5">
                        {(() => {
                          const q = shopQueueInfo.find(item => item.barberId === selectedBarber?._id);
                          if (!q || q.queueLength === 0) return '0 in queue • No wait';
                          return `${q.queueLength} in queue (~${q.estimatedWait}m wait)`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="border border-zinc-100 rounded-xl divide-y divide-zinc-100">
                    <div className="p-3.5 bg-zinc-50/50 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <span>Service Item</span>
                      <span>Price</span>
                    </div>
                    {selectedServices.map(s => (
                      <div key={s._id} className="p-3.5 flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium text-zinc-900">{s.name}</span>
                          <span className="text-xs text-zinc-400 ml-2">({s.duration} mins)</span>
                        </div>
                        <span className="font-semibold text-zinc-900">₹{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column (1 Col) - Live Booking Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                <span>Reservation Summary</span>
                <span className="text-xs font-medium text-zinc-500">{shop?.name}</span>
              </h3>

              <div className="space-y-3 text-xs text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Selected Services</span>
                  <span className="font-semibold text-zinc-900">{selectedServices.length}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Est. Duration</span>
                  <span className="font-semibold text-zinc-900">{totalDuration} mins</span>
                </div>

                <div className="flex justify-between items-start">
                  <span>Barber</span>
                  <div className="text-right">
                    <span className="font-semibold text-zinc-900 block">{selectedBarber ? getBarberName(selectedBarber) : 'Not selected'}</span>
                    {selectedBarber?.specialty && (
                      <span className="text-[11px] text-amber-700 font-medium block mt-0.5">{selectedBarber.specialty}</span>
                    )}
                  </div>
                </div>

                {selectedBarber && (
                  <div className="flex justify-between items-center">
                    <span>Live Queue</span>
                    <span className="font-semibold text-amber-700">
                      {(() => {
                        const q = shopQueueInfo.find(item => item.barberId === selectedBarber._id);
                        return q?.queueLength > 0 ? `${q.queueLength} waiting (~${q.estimatedWait}m)` : 'No queue (0 waiting)';
                      })()}
                    </span>
                  </div>
                )}

                <div className="border-t border-zinc-100 pt-3 flex justify-between items-center text-sm">
                  <span className="font-semibold text-zinc-900">Total Payable</span>
                  <span className="text-lg font-bold text-zinc-900">₹{totalPrice}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedServices.length === 0}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <span>Choose Barber</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {step === 2 && (
                  <button
                    onClick={() => {
                      if (!selectedBarber || selectedBarber.isAvailable === false || selectedBarber.isActive === false) {
                        toast.error('Please select an available on-duty barber');
                        return;
                      }
                      setStep(3);
                    }}
                    disabled={!selectedBarber || selectedBarber.isAvailable === false || selectedBarber.isActive === false}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {step === 3 && (
                  <button 
                    onClick={handleBook}
                    disabled={submitting}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl px-4 py-3.5 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submitting ? 'Confirming...' : 'Confirm & Reserve Token'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-xs text-zinc-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Advance Payment</span>
              </div>
              <p>Pay directly at the salon after your haircut or styling service.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BookingPage;
