import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
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

import { ShopDetailHero } from '../../components/customer/shop-detail/ShopDetailHero';
import { ShopServicesTab } from '../../components/customer/shop-detail/ShopServicesTab';
import { ShopBarbersTab } from '../../components/customer/shop-detail/ShopBarbersTab';
import { ShopReviewsTab } from '../../components/customer/shop-detail/ShopReviewsTab';
import { PhotoLightboxModal } from '../../components/customer/shop-detail/PhotoLightboxModal';

export const ShopDetailPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const shop = useSelector((state) => state.shop.selectedShop);
  const barbers = useSelector((state) => state.barber.barbers);
  const services = useSelector((state) => state.service.services);
  const myAppointments = useSelector((state) => state.appointment.myAppointments);
  const { user } = useSelector((state) => state.auth);
  const loading = useSelector(
    (state) => state.shop.loading || state.barber.loading || state.service.loading
  );

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
  const activeExistingAppt = user
    ? myAppointments?.find((a) => {
        const aShopId = typeof a.shopId === 'object' && a.shopId ? a.shopId._id : a.shopId;
        return (
          aShopId === shopId &&
          [
            AppointmentStatus.PENDING_APPROVAL,
            AppointmentStatus.WAITING,
            AppointmentStatus.IN_SERVICE,
          ].includes(a.status)
        );
      })
    : null;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: shop?.name || 'Barber Shop',
          text: `Check out ${shop?.name || 'this shop'} on BarberQueue`,
          url: window.location.href,
        })
        .catch(() => {});
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

  const photos =
    shop.photos && shop.photos.length > 0
      ? shop.photos
      : shop.documents?.shopPhoto
      ? [shop.documents.shopPhoto]
      : [];

  const googleMapsUrl =
    shop.googleMapsUrl ||
    (shop.latitude && shop.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          shop.name + ', ' + shop.address + ', ' + shop.city
        )}`);

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
        {/* 1. Header & Hero Section */}
        <ShopDetailHero
          shop={shop}
          shopReviews={shopReviews}
          googleMapsUrl={googleMapsUrl}
          handleShare={handleShare}
          activeExistingAppt={activeExistingAppt}
        />

        {/* 2. Horizontal Scroll Navigation Tabs */}
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
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Area (2 Columns) - Tab Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB 1: Services */}
            {activeTab === 'services' && (
              <ShopServicesTab
                services={services}
                shopId={shopId}
                isOpen={shop.isOpen}
                activeExistingAppt={activeExistingAppt}
              />
            )}

            {/* TAB 2: Barbers & Queue */}
            {activeTab === 'barbers' && (
              <ShopBarbersTab
                queueLoading={queueLoading}
                queueInfo={queueInfo}
                totalInQueue={totalInQueue}
                barbers={barbers}
                isOpen={shop.isOpen}
              />
            )}

            {/* TAB 3: Photos Gallery */}
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
                    <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                      {shop.address}, <span className="capitalize">{shop.city}</span>
                    </p>
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
                      <span>
                        {shop.openingTime || '09:00 AM'} - {shop.closingTime || '09:00 PM'}
                      </span>
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
              <ShopReviewsTab
                shopReviews={shopReviews}
                reviewsLoading={reviewsLoading}
                averageRating={shop.averageRating}
                shopId={shopId}
              />
            )}
          </div>

          {/* Right Sidebar (1 Column) - Desktop Info Panel */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900">
                  {shop.isOpen ? 'Open for bookings' : 'Currently Closed'}
                </h3>
                <div className="flex items-center text-xs font-semibold text-zinc-700 mt-0.5">
                  <span className="font-bold text-amber-600">★ </span>
                  <span>
                    {shop.averageRating
                      ? `${shop.averageRating.toFixed(1)} rating`
                      : 'New rating'}
                  </span>
                </div>
              </div>

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
                  <span>
                    {shop.openingTime || '09:00 AM'} — {shop.closingTime || '09:00 PM'}
                  </span>
                </div>
              </div>

              {activeExistingAppt ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                  <p className="font-semibold text-xs">Active booking exists</p>
                  <p className="text-[11px] leading-snug">
                    You already have an appointment booked at this shop.
                  </p>
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

            {/* Quick Photos Strip */}
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
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-100 px-4 py-2.5 shadow-md">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-semibold text-zinc-900">
                {activeExistingAppt ? 'Active Booking' : shop.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {activeExistingAppt
                ? activeExistingAppt.status === AppointmentStatus.PENDING_APPROVAL
                  ? 'Pending Approval'
                  : `Position #${
                      activeExistingAppt.position ??
                      (activeExistingAppt.queuePosition?.position ?? 1)
                    }`
                : totalInQueue === 0
                ? 'No queue'
                : `${totalInQueue} waiting in line`}
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
      <PhotoLightboxModal
        activePhotoIdx={activePhotoIdx}
        setActivePhotoIdx={setActivePhotoIdx}
        photos={photos}
      />
    </div>
  );
};

export default ShopDetailPage;
