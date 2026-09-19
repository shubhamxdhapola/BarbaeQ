import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Store, 
  User, 
  MessageSquare, 
  CheckCircle2,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShopById } from '../../redux/slices/shop.slice.js';
import { fetchShopBarbers } from '../../redux/slices/barber.slice.js';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import { Skeleton } from '../../components/ui/Skeleton';

export const ShopReviewsPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const shop = useSelector((state) => state.shop.selectedShop);
  const barbers = useSelector((state) => state.barber.barbers);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BOTH'); 
  const [selectedBarberId, setSelectedBarberId] = useState('ALL');

  useEffect(() => {
    if (!shopId) return;
    dispatch(fetchShopById(shopId));
    dispatch(fetchShopBarbers(shopId));

    const loadReviews = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(API_PATHS.REVIEW.SHOP_REVIEWS(shopId));
        setReviews(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [dispatch, shopId]);

  const filteredReviews = reviews.filter((rev) => {
    if (selectedBarberId !== 'ALL') {
      const bId = rev.barberId?._id || rev.barberId;
      if (bId !== selectedBarberId) return false;
    }
    return true;
  });

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'
            }`}
          />
        ))}
        <span className="text-xs font-semibold text-zinc-900 ml-1">{rating}/5</span>
      </div>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans text-zinc-900 pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer mb-2 inline-flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight">Verified Client Reviews</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Read honest feedback from customers who visited this salon</p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (1 Col Sticky) - Rating Overview & Barber Filter */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
            {shop && (
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">{shop.name}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{shop.address}, {shop.city}</p>
                </div>

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Overall Rating</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                    <span className="text-3xl font-bold text-zinc-900">
                      {shop.averageRating ? shop.averageRating.toFixed(1) : 'New'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Based on {shop.reviewCount || reviews.length || 0} reviews
                  </p>
                </div>

                {/* Filter by Barber */}
                {barbers.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Filter by Stylist
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBarberId}
                        onChange={(e) => setSelectedBarberId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 cursor-pointer focus:outline-none appearance-none"
                      >
                        <option value="ALL">All Stylists ({reviews.length})</option>
                        {barbers.map((b) => {
                          const name = typeof b.userId === 'object' && b.userId ? b.userId.name : 'Barber';
                          return (
                            <option key={b._id} value={b._id}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (2 Cols) - Reviews Stream */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-zinc-900">
                Customer Feedback ({filteredReviews.length})
              </h3>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredReviews.length > 0 ? (
              <div className="space-y-4">
                {filteredReviews.map((rev) => {
                  const customerName = rev.customerId?.name || 'Verified Client';
                  const barberName = rev.barberId?.userId?.name || 'Stylist';
                  const dateStr = new Date(rev.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={rev._id}
                      className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-3 hover:border-zinc-200 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {rev.customerId?.avatar ? (
                              <img
                                src={rev.customerId.avatar}
                                alt={customerName}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              getInitials(customerName)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-zinc-900">{customerName}</h4>
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified Visit
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{dateStr}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 self-start sm:self-auto">
                          <span className="text-xs text-zinc-500 font-medium">Salon Ambience</span>
                          {renderStars(rev.shopRating)}
                        </div>
                      </div>

                      {rev.barberRating && (
                        <div className="bg-zinc-50/60 p-3 rounded-xl border border-zinc-100 flex items-center justify-between text-xs">
                          <span className="text-zinc-600 font-medium">
                            Stylist: <strong className="text-zinc-900 font-semibold">{barberName}</strong>
                          </span>
                          <div className="flex items-center gap-1">
                            {renderStars(rev.barberRating)}
                          </div>
                        </div>
                      )}

                      {rev.comment && (
                        <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic bg-zinc-50/40 p-3.5 rounded-xl border border-zinc-100">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-10 sm:p-14 border border-zinc-100 rounded-2xl text-center shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">No reviews found</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                    No reviews matching the selected filter criteria.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default ShopReviewsPage;
