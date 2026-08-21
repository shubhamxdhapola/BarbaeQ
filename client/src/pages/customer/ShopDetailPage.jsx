import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Share2, 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Navigation, 
  Image as ImageIcon, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Scissors, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import { fetchShopById } from '../../redux/slices/shop.slice.js';
import { fetchShopBarbers } from '../../redux/slices/barber.slice.js';
import { fetchShopServices } from '../../redux/slices/service.slice.js';
import { fetchMyAppointments } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export const ShopDetailPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const shop = useSelector((state) => state.shop.selectedShop);
  const barbers = useSelector((state) => state.barber.barbers);
  const services = useSelector((state) => state.service.services);
  const myAppointments = useSelector((state) => state.appointment.myAppointments);
  const { user } = useSelector((state) => state.auth);
  const loading = useSelector((state) => state.shop.loading || state.barber.loading || state.service.loading);

  const [queueInfo, setQueueInfo] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [shopReviews, setShopReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Active view tab state: 'services' | 'barbers' | 'photos' | 'location' | 'reviews'
  const [activeTab, setActiveTab] = useState('services');

  // Photo Lightbox modal state
  const [activePhotoIdx, setActivePhotoIdx] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    dispatch(fetchShopById(shopId));
    dispatch(fetchShopBarbers(shopId));
    dispatch(fetchShopServices({ shopId, activeOnly: true }));

    if (user) {
      dispatch(fetchMyAppointments());
    }

    const fetchQueue = async () => {
      try {
        setQueueLoading(true);
        const res = await axiosInstance.get(API_PATHS.SHOP.QUEUE_INFO(shopId));
        setQueueInfo(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to fetch queue info', err);
      } finally {
        setQueueLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await axiosInstance.get(API_PATHS.REVIEW.SHOP_REVIEWS(shopId));
        setShopReviews(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch shop reviews', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchQueue();
    fetchReviews();
  }, [dispatch, shopId, user]);

  // Find if user already has an active appointment at this shop
  const activeExistingAppt = user ? myAppointments?.find(a => {
    const aShopId = typeof a.shopId === 'object' && a.shopId ? a.shopId._id : a.shopId;
    return aShopId === shopId && [AppointmentStatus.PENDING_APPROVAL, AppointmentStatus.WAITING, AppointmentStatus.IN_SERVICE].includes(a.status);
  }) : null;

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'B';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shop?.name || 'Barber Shop',
        text: `Check out ${shop?.name || 'this shop'} on BarberQueue`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading && (!shop || shop._id !== shopId)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 font-sans text-zinc-900 pb-24">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return <div className="text-center py-20 text-zinc-500 font-semibold">Shop not found</div>;
  }

  // Combine photos array or fallback to registration shop photo
  const photos = (shop.photos && shop.photos.length > 0)
    ? shop.photos
    : (shop.documents?.shopPhoto ? [shop.documents.shopPhoto] : []);

  // Compute Google Maps directions URL
  const googleMapsUrl =
    shop.googleMapsUrl ||
    (shop.latitude && shop.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          shop.name + ', ' + shop.address + ', ' + shop.city
        )}`);

  // Total active in queue
  const totalInQueue = queueInfo.reduce((acc, q) => acc + (q.queueLength || 0), 0);

  const tabs = [
    { id: 'services', label: 'Services', count: services.length },
    { id: 'barbers', label: 'Barbers & Queue', count: barbers.length },
    { id: 'photos', label: 'Photos', count: photos.length },
    { id: 'location', label: 'Location' },
    { id: 'reviews', label: 'Reviews', count: shopReviews.length },
  ];

  return (
    <div className="min-h-screen pb-28 lg:pb-16 font-sans text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {/* 1. Shop Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
                  {shop.name}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  shop.isOpen 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {shop.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-zinc-500">
                <div className="flex items-center font-semibold text-zinc-900">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                  <span>{shop.averageRating ? shop.averageRating.toFixed(1) : 'New'}</span>
                  <span className="text-zinc-400 font-normal ml-0.5">
                    ({shop.reviewCount || shopReviews.length || 0})
                  </span>
                </div>

                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-zinc-400 shrink-0" />
                  <span>{shop.address || shop.city}, <span className="capitalize">{shop.city}</span></span>
                </div>

                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-400 shrink-0" />
                  <span>{shop.openingTime && shop.closingTime ? `${shop.openingTime} — ${shop.closingTime}` : '09:00 AM — 09:00 PM'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleShare}
                className="py-2 px-3.5 rounded-xl text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Share</span>
              </button>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Directions</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Active Appointment Alert Card (if exists) */}
        {activeExistingAppt && (
          <div 
            onClick={() => navigate(`/appointments/${activeExistingAppt._id}`)}
            className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
            <div className="pl-2 space-y-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Active booking exists
              </span>
              <h3 className="font-semibold text-zinc-900 text-sm">
                You have an ongoing appointment here
              </h3>
              <p className="text-xs text-zinc-500">
                Track your live queue turn instead of booking a new slot
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 shrink-0 pr-1">
              <span>Track Turn</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        )}

        {/* 3. Horizontal Scroll Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Area (2 Columns) - Tab Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TAB 1: Services & Pricing */}
            {activeTab === 'services' && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">Services & Pricing</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Select a service to book with your barber</p>
                  </div>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg">
                    {services.length} Service{services.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                  {services.length > 0 ? services.map((service) => (
                    <div 
                      key={service._id} 
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors gap-3"
                    >
                      <div>
                        <h3 className="font-semibold text-zinc-900 text-sm">{service.name}</h3>
                        <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{service.duration} mins</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-sm text-zinc-900">₹{service.price}</span>
                        <button
                          onClick={() => navigate(`/booking/${shopId}`)}
                          disabled={!shop.isOpen || !!activeExistingAppt}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                        >
                          {activeExistingAppt ? 'Booked' : 'Book'}
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-zinc-400 text-xs">No services listed yet</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Barbers & Live Queue */}
            {activeTab === 'barbers' && (
              <div className="space-y-4">
                {/* Live Queue Cards */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500" />
                        Live Chair Queue Status
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">Real-time availability and wait times</p>
                    </div>
                    <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-lg">
                      {totalInQueue} Waiting
                    </span>
                  </div>

                  {queueLoading ? (
                    <Skeleton className="h-16 w-full rounded-xl" />
                  ) : queueInfo.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {queueInfo.map((q) => (
                        <div key={q.barberId} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                              {q.barberAvatar ? (
                                <img src={q.barberAvatar} alt={q.barberName} className="w-full h-full object-cover" />
                              ) : (
                                getInitials(q.barberName)
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 text-xs sm:text-sm">{q.barberName}</p>
                              <p className="text-[11px] text-zinc-500">
                                {q.queueLength === 0 ? 'No wait' : `${q.queueLength} in line`}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            q.queueLength === 0 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {q.queueLength === 0 ? 'Ready Now' : `~${q.estimatedWait || 0}m wait`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-xs italic">Queue is currently clear. Appointments welcome!</p>
                  )}
                </div>

                {/* Barbers Grid */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                  <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Barber Team ({barbers.length})
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {barbers.length > 0 ? barbers.map(barber => {
                      const name = typeof barber.userId === 'object' && barber.userId ? barber.userId.name : 'Barber';
                      const avatar = typeof barber.userId === 'object' && barber.userId ? barber.userId.avatar : '';
                      const isAvailable = barber.isAvailable !== false && barber.isActive !== false;
                      return (
                        <div key={barber._id} className="flex flex-col items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-center">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold mb-1.5 overflow-hidden border border-zinc-200/80 ${
                            isAvailable ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              getInitials(name)
                            )}
                          </div>
                          <span className="text-xs font-semibold text-zinc-900 truncate w-full">{name}</span>
                          {barber.specialty && (
                            <span className="text-[11px] text-amber-700 font-medium truncate w-full mt-0.5">
                              {barber.specialty}
                            </span>
                          )}
                          <span className={`text-[10px] font-medium mt-0.5 ${isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isAvailable ? '● Available' : '● Off Duty'}
                          </span>
                          <div className="flex items-center text-[10px] font-bold text-zinc-700 bg-white px-2 py-0.5 rounded-md border border-zinc-200 mt-1.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-1" />
                            {barber.averageRating > 0 ? barber.averageRating.toFixed(1) : 'New'}
                            {barber.reviewCount > 0 && <span className="text-zinc-400 font-normal ml-0.5">({barber.reviewCount})</span>}
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-zinc-400 text-xs col-span-full">No barbers currently listed</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Shop Photos Gallery */}
            {activeTab === 'photos' && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Shop Gallery ({photos.length})
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Explore ambience and salon interiors</p>
                  </div>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className="relative aspect-4/3 rounded-xl overflow-hidden group cursor-pointer bg-zinc-100 border border-zinc-200/60"
                      >
                        <img
                          src={photo}
                          alt={`Shop photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <ImageIcon className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-xs text-zinc-400 font-medium">No gallery photos added yet</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Location & Info */}
            {activeTab === 'location' && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500" /> Location & Contact
                  </h2>
                </div>

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">{shop.name}</p>
                    <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">{shop.address}, <span className="capitalize">{shop.city}</span></p>
                    {shop.landmark && (
                      <p className="text-xs text-zinc-600 font-medium mt-1">
                        📍 Landmark: {shop.landmark}
                      </p>
                    )}
                    {shop.pincode && (
                      <p className="text-xs text-zinc-400">Pincode: {shop.pincode}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{shop.openingTime || '09:00 AM'} - {shop.closingTime || '09:00 PM'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{shop.phone}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer shadow-xs"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Customer Reviews */}
            {activeTab === 'reviews' && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      Customer Reviews ({shopReviews.length})
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Verified customer feedback</p>
                  </div>
                  {shop.averageRating > 0 && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      ⭐ {shop.averageRating.toFixed(1)} / 5
                    </span>
                  )}
                </div>

                {reviewsLoading ? (
                  <Skeleton className="h-24 w-full rounded-xl" />
                ) : shopReviews.length > 0 ? (
                  <div className="space-y-3">
                    {shopReviews.map((rev) => (
                      <div key={rev._id} className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {rev.customerId?.avatar ? (
                              <img src={rev.customerId.avatar} alt={rev.customerId.name} className="w-7 h-7 rounded-lg object-cover border border-zinc-200" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-[10px]">
                                {getInitials(rev.customerId?.name || 'C')}
                              </div>
                            )}
                            <span className="font-semibold text-zinc-900 text-xs sm:text-sm">
                              {rev.customerId?.name || 'Verified Customer'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.shopRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.barberId?.userId?.name && (
                          <p className="text-xs text-zinc-600 font-medium">
                            Barber: <span className="text-zinc-900">{rev.barberId.userId.name}</span> (⭐ {rev.barberRating}/5)
                          </p>
                        )}

                        {rev.comment && (
                          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-zinc-100">
                            "{rev.comment}"
                          </p>
                        )}

                        <p className="text-[10px] text-zinc-400">
                          {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    ))}

                    <div className="pt-1">
                      <button
                        onClick={() => navigate(`/shops/${shopId}/reviews`)}
                        className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold text-xs rounded-xl border border-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>View All Reviews</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs">
                    No reviews yet. Be the first customer to rate this shop after your service!
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Sidebar (1 Column) - Desktop Info Panel */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 lg:sticky lg:top-20">
            
            {/* Right Card 1: Open For Bookings */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900">
                  {shop.isOpen ? 'Open for bookings' : 'Currently Closed'}
                </h3>
                <div className="flex items-center text-xs font-semibold text-zinc-700 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                  <span>{shop.averageRating ? `${shop.averageRating.toFixed(1)} rating` : 'New rating'}</span>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-1.5 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 font-semibold">✓</span>
                  <span>Real-time queue tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 font-semibold">✓</span>
                  <span>{barbers.length} verified professional barbers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{shop.openingTime || '09:00 AM'} — {shop.closingTime || '09:00 PM'}</span>
                </div>
              </div>

              {/* Active Booking Alert Box (if exists) or Book Button */}
              {activeExistingAppt ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                  <p className="font-semibold text-xs">Active booking exists</p>
                  <p className="text-[11px] leading-snug">You already have an appointment booked at this shop.</p>
                </div>
              ) : (
                <button 
                  onClick={() => navigate(`/booking/${shopId}`)}
                  disabled={!shop.isOpen}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    shop.isOpen 
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm' 
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  {shop.isOpen ? 'Book Appointment' : 'Shop Closed'}
                </button>
              )}
            </div>

            {/* Quick Photos Strip in Sidebar */}
            {photos.length > 0 && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> Photos ({photos.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('photos')}
                    className="text-[11px] font-medium text-zinc-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {photos.slice(0, 4).map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className="w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-zinc-200 bg-zinc-100 hover:opacity-80 transition-opacity"
                    >
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 5. Mobile Fixed Bottom Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-100 px-4 py-2.5 shadow-md">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-xs font-semibold text-zinc-900">
                {activeExistingAppt ? 'Active Booking' : shop.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {activeExistingAppt 
                ? (activeExistingAppt.status === AppointmentStatus.PENDING_APPROVAL ? 'Pending Approval' : `Position #${activeExistingAppt.position ?? (activeExistingAppt.queuePosition?.position ?? 1)}`)
                : (totalInQueue === 0 ? 'No queue' : `${totalInQueue} waiting in line`)}
            </p>
          </div>

          {activeExistingAppt ? (
            <button
              onClick={() => navigate(`/appointments/${activeExistingAppt._id}`)}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all shrink-0 cursor-pointer"
            >
              View Turn →
            </button>
          ) : (
            <button
              onClick={() => navigate(`/booking/${shopId}`)}
              disabled={!shop.isOpen}
              className={`py-2 px-4 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer ${
                shop.isOpen 
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white' 
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {shop.isOpen ? 'Book Slot →' : 'Shop Closed'}
            </button>
          )}
        </div>
      </div>

      {/* High-Resolution Photo Lightbox Modal */}
      {activePhotoIdx !== null && photos[activePhotoIdx] && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActivePhotoIdx(null)}
        >
          <button
            onClick={() => setActivePhotoIdx(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-50 cursor-pointer"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-50 cursor-pointer"
              title="Previous Photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div 
            className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[activePhotoIdx]}
              alt={`Shop photo ${activePhotoIdx + 1}`}
              className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <p className="text-white/80 text-xs font-medium mt-3">
              Photo {activePhotoIdx + 1} of {photos.length}
            </p>
          </div>

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-50 cursor-pointer"
              title="Next Photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopDetailPage;
