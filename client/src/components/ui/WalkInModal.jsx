import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Clock, Phone, User, Scissors } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createWalkIn, fetchBarberQueue } from '../../redux/slices/appointment.slice.js';
import { fetchMyBarberProfile } from '../../redux/slices/barber.slice.js';
import { fetchShopServices } from '../../redux/slices/service.slice.js';
import toast from 'react-hot-toast';

export const WalkInModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  const { myProfile } = useSelector((state) => state.barber);
  const { services } = useSelector((state) => state.service);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Fetch barber profile to get shopId, then fetch services
      dispatch(fetchMyBarberProfile());
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen && myProfile?.shopId) {
      const shopId = typeof myProfile.shopId === 'object' ? myProfile.shopId._id : myProfile.shopId;
      if (shopId) {
        dispatch(fetchShopServices({ shopId, activeOnly: true }));
      }
    }
  }, [isOpen, myProfile, dispatch]);

  const activeServices = (services || []).filter(s => s.isActive !== false);
  const selectedService = activeServices.find(s => s._id === serviceId);

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setServiceId('');
    setSuccessInfo(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
      return;
    }
    if (!serviceId) {
      toast.error('Please select a service');
      return;
    }
    setSubmitting(true);
    try {
      const result = await dispatch(createWalkIn({
        customerName: customerName.trim(),
        phone: phone.trim() || undefined,
        serviceId,
      })).unwrap();

      const appt = result.appointment || result;
      const queuePos = result.queuePosition;

      setSuccessInfo({
        name: appt.customerName || customerName,
        service: appt.serviceName,
        position: queuePos?.position || appt.queueNumber,
        estimatedWait: queuePos?.estimatedWait || 0,
      });

      dispatch(fetchBarberQueue());
      toast.success('Walk-in customer added to queue!');
    } catch (err) {
      toast.error(err || 'Failed to add walk-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Full-screen Backdrop Overlay with zero top gap */}
      <div 
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200/80 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="walk-in-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200/80 text-zinc-900 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="walk-in-modal-title" className="text-lg font-bold text-ink tracking-tight">
                Add Walk-in Customer
              </h2>
              <p className="text-xs text-muted font-medium">Add directly to your queue</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-zinc-200/70 transition-colors text-zinc-400 hover:text-zinc-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {successInfo ? (
            /* Success State */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/80 text-emerald-600 shadow-2xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Walk-in Added</h3>
                <p className="text-muted text-sm mt-0.5">{successInfo.name}</p>
                <p className="text-zinc-400 text-xs">{successInfo.service}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">Queue Position</span>
                  <span className="font-bold text-ink text-sm">#{successInfo.position}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">Estimated Wait</span>
                  <span className="font-bold text-ink text-sm">~{successInfo.estimatedWait} min</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="btn-primary w-full py-3 rounded-2xl font-bold text-xs shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rakesh Sharma"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-xs font-medium transition-all shadow-2xs"
                  autoFocus
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
                  Phone Number
                  <span className="text-zinc-400 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-xs font-medium transition-all shadow-2xs"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">
                  <Scissors className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
                  Service
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-xs font-medium transition-all appearance-none cursor-pointer shadow-2xs"
                  required
                >
                  <option value="">Select a service</option>
                  {activeServices.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — ₹{s.price} ({s.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration display */}
              {selectedService && (
                <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200/80 px-4 py-2.5 rounded-2xl text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-600">Duration:</span>
                  <span className="font-bold text-zinc-900">{selectedService.duration} mins</span>
                  <span className="text-zinc-300 mx-1">•</span>
                  <span className="text-zinc-600">Price:</span>
                  <span className="font-bold text-zinc-900">₹{selectedService.price}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !customerName.trim() || !serviceId}
                className="btn-primary w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer mt-2"
              >
                {submitting ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Adding...</span>
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Add to Queue</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
