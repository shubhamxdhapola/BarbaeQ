import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Clock, 
  Scissors, 
  ArrowRight, 
  Sparkles, 
  Store, 
  Compass, 
  CheckCircle2, 
  Calendar, 
  X, 
  ChevronDown,
  Sun,
  SunMedium,
  Moon,
  Flame
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApprovedShops } from '../../redux/slices/shop.slice.js';
import { fetchMyAppointments } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';

const POPULAR_CITIES = ['All cities', 'Indore', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Jaipur'];

export const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { shops = [], loading } = useSelector((state) => state.shop);
  const myAppointments = useSelector((state) => state.appointment.myAppointments);

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All cities');

  const loadShops = () => {
    const targetCity = city === 'All cities' ? undefined : city;
    dispatch(fetchApprovedShops({ city: targetCity, search }));
  };

  useEffect(() => {
    if (user) {
      dispatch(fetchMyAppointments());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadShops();
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, search, city]);

  const activeAppointment = user ? myAppointments?.find(a => 
    [AppointmentStatus.PENDING_APPROVAL, AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE].includes(a.status)
  ) : null;

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-amber-500', badgeClass: 'bg-amber-50/80 border-amber-200/70 text-amber-900' };
    if (hour < 18) return { text: 'Good afternoon', icon: SunMedium, color: 'text-amber-500', badgeClass: 'bg-amber-50/80 border-amber-200/70 text-amber-900' };
    return { text: 'Good evening', icon: Moon, color: 'text-indigo-400', badgeClass: 'bg-indigo-50/80 border-indigo-200/70 text-indigo-900' };
  };

  const greetingData = getGreetingData();
  const GreetingIcon = greetingData.icon;

  const formattedBookedTime = activeAppointment?.bookedAt || activeAppointment?.createdAt
    ? new Date(activeAppointment.bookedAt || activeAppointment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans text-zinc-900 pb-24 md:pb-12">
      
      {/* 1. Top Hero Greeting Banner */}
      <div className="bg-gradient-to-br from-white via-white to-zinc-50/80 border border-zinc-100/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Ambient Decorative Backlight Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-amber-100/35 via-indigo-50/25 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${greetingData.badgeClass}`}>
                <GreetingIcon className={`w-3.5 h-3.5 ${greetingData.color}`} />
                <span>{greetingData.text}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              {user?.name ? user.name : 'Welcome back'}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed">
              Find verified barbershops near you, check real-time queue lengths, and reserve your chair without waiting in line.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={() => navigate('/appointments')}
              className="bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-xs sm:text-sm font-medium rounded-xl px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-sm active:scale-98"
            >
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>My Bookings</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & City Filters Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
              Discover verified salons
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Browse top-rated barbershops and view live waiting times
            </p>
          </div>

          <p className="hidden md:block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {shops.length} verified salon{shops.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by salon name, service, or locality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-sm font-medium cursor-pointer focus:outline-none appearance-none transition-colors"
            >
              {Array.from(
                new Set([
                  'All cities',
                  ...POPULAR_CITIES.filter((c) => c !== 'All cities'),
                  ...shops
                    .map((s) =>
                      s.city
                        ? s.city.charAt(0).toUpperCase() + s.city.slice(1).toLowerCase()
                        : null
                    )
                    .filter(Boolean),
                ])
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {POPULAR_CITIES.map((c) => {
            const isSelected = city === c;
            return (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Active Queue Alert Banner (if exists) */}
      {activeAppointment && (
        <div 
          onClick={() => navigate(`/appointments/${activeAppointment._id}`)}
          className="bg-white border border-zinc-100 border-l-4 border-l-amber-500 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-zinc-200 transition-all relative overflow-hidden group"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeAppointment.status === AppointmentStatus.IN_SERVICE 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : activeAppointment.status === AppointmentStatus.PENDING_APPROVAL
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-zinc-100 text-zinc-800'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeAppointment.status === AppointmentStatus.IN_SERVICE 
                    ? 'bg-emerald-500' 
                    : activeAppointment.status === AppointmentStatus.PENDING_APPROVAL
                    ? 'bg-amber-500'
                    : 'bg-zinc-900'
                } animate-pulse`} />
                {activeAppointment.status === AppointmentStatus.IN_SERVICE 
                  ? 'In Service Now' 
                  : activeAppointment.status === AppointmentStatus.PENDING_APPROVAL
                  ? 'Approval Pending'
                  : 'In Active Queue'}
              </span>
              <span className="text-xs text-zinc-400">
                Requested {formattedBookedTime}
              </span>
            </div>
            
            <h3 className="font-semibold text-zinc-900 text-base sm:text-lg">
              {typeof activeAppointment.shopId === 'object' ? activeAppointment.shopId.name : 'Barber Shop'} — {activeAppointment.serviceName}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500">
              Barber: <strong className="text-zinc-700 font-medium">{typeof activeAppointment.barberId === 'object' && activeAppointment.barberId?.userId?.name ? activeAppointment.barberId.userId.name : 'Barber'}</strong>
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 shrink-0">
            <div className="text-left sm:text-right">
              {activeAppointment.status === AppointmentStatus.IN_SERVICE ? (
                <>
                  <p className="text-sm sm:text-base font-bold text-emerald-600 leading-tight">
                    In Chair
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">
                    Being Served
                  </p>
                </>
              ) : activeAppointment.status === AppointmentStatus.PENDING_APPROVAL ? (
                <>
                  <p className="text-sm sm:text-base font-bold text-amber-600 leading-tight">
                    Pending
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">
                    Awaiting Barber
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-none">
                    #{activeAppointment.position ?? (activeAppointment.queuePosition?.position ?? 1)}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">
                    Queue Position
                  </p>
                </>
              )}
            </div>

            <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white flex items-center gap-1.5 group-hover:bg-zinc-800 transition-colors shrink-0">
              <span>Track Turn</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      )}

      {/* 4. Verified Barbershops Responsive Multi-Column Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
            Salons Near You
          </h2>
          <p className="text-xs sm:text-sm font-medium text-zinc-500">
            {shops.length} salon{shops.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {(loading && (!shops || shops.length === 0)) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-zinc-100 rounded-2xl shadow-sm p-4 space-y-3">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : shops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shops.map((shop) => {
              const coverImg = shop.photos && shop.photos.length > 0 ? shop.photos[0] : null;

              return (
                <div
                  key={shop._id}
                  onClick={() => navigate(`/shops/${shop._id}`)}
                  className="bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-zinc-200 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group"
                >
                  {/* Photo Section */}
                  <div className="relative h-44 bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {coverImg ? (
                      <img 
                        src={coverImg} 
                        alt={shop.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <Store className="w-10 h-10 text-zinc-300" />
                    )}

                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-xs backdrop-blur-xs ${
                        shop.isOpen ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200/60' : 'bg-rose-50/90 text-rose-800 border border-rose-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {shop.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/95 text-zinc-800 shadow-xs backdrop-blur-xs">
                        {shop.averageRating > 0 ? (
                          <>
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{shop.averageRating.toFixed(1)}</span>
                          </>
                        ) : (
                          'New'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-zinc-900 text-base group-hover:text-zinc-700 transition-colors line-clamp-1">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{shop.address || shop.city}, <span className="capitalize">{shop.city}</span></span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{shop.openingTime || '09:00 AM'} - {shop.closingTime || '09:00 PM'}</span>
                      </div>
                      
                      <span className="font-semibold text-zinc-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        View
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-8 sm:p-12 border border-zinc-100 rounded-2xl text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">
                No salons found
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                We couldn't find any approved barbershops matching your current search or city filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setCity('All cities');
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors cursor-pointer shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default HomePage;
