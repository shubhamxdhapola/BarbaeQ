import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Scissors, 
  Calendar, 
  ArrowRight, 
  Home, 
  ListOrdered,
  Sparkles,
  Ticket
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppointmentById } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';

export const BookingSuccessPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentAppointmentDetails, loading } = useSelector((state) => state.appointment);
  const appointment = currentAppointmentDetails?.appointment || currentAppointmentDetails;

  useEffect(() => {
    if (appointmentId) {
      dispatch(fetchAppointmentById(appointmentId));
    }
  }, [dispatch, appointmentId]);

  if (loading && !appointment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4 font-sans text-zinc-900 pb-24">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 font-sans text-zinc-900">
        <h2 className="text-lg font-bold text-zinc-900">Booking Not Found</h2>
        <p className="text-sm text-zinc-500">We could not retrieve the appointment details.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const shopName = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId.name : 'Barber Shop';
  const shopAddress = typeof appointment.shopId === 'object' && appointment.shopId ? appointment.shopId.address : '';
  const barberName = typeof appointment.barberId === 'object' && appointment.barberId && typeof appointment.barberId.userId === 'object' 
    ? appointment.barberId.userId.name 
    : 'Barber';

  const isPending = appointment.status === AppointmentStatus.PENDING_APPROVAL;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center max-w-lg mx-auto px-4 py-6 sm:py-10 font-sans text-zinc-900 pb-24">
      
      {/* Top Confirmation Card */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm text-center relative overflow-hidden mb-4">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
              {isPending ? 'Booking Requested' : 'Booking Confirmed'}
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
              {isPending 
                ? 'Your appointment request has been sent to the barber. You will receive a queue token upon approval.'
                : 'Your spot in line is reserved. Track your turn in real time.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 rounded-full text-xs font-medium text-zinc-600 border border-zinc-200/60">
            <span>Ref:</span>
            <span className="font-semibold text-zinc-900">#{(appointment._id || '').substring(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Appointment Details Card */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-4 mb-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Appointment Details</span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Confirmed</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center text-zinc-600">
            <span>Barber Salon</span>
            <span className="font-semibold text-zinc-900 text-right">{shopName}</span>
          </div>

          <div className="flex justify-between items-center text-zinc-600">
            <span>Assigned Barber</span>
            <span className="font-semibold text-zinc-900">{barberName}</span>
          </div>

          <div className="flex justify-between items-center text-zinc-600">
            <span>Service</span>
            <span className="font-semibold text-zinc-900">{appointment.serviceName}</span>
          </div>

          <div className="flex justify-between items-center text-zinc-600">
            <span>Duration</span>
            <span className="font-semibold text-zinc-900">{appointment.serviceDuration} mins</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => navigate(`/appointments/${appointment._id}`)}
          className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          <span>Track Live Queue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/appointments')}
            className="py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            <span>My Bookings</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            <span>Explore More</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default BookingSuccessPage;
