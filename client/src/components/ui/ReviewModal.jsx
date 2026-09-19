import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare, Store, User } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const ReviewModal = ({ isOpen, onClose, shopId, barberId, appointmentId, shopName, barberName, onReviewSubmitted }) => {
  const [shopRating, setShopRating] = useState(5);
  const [barberRating, setBarberRating] = useState(5);
  const [shopHover, setShopHover] = useState(0);
  const [barberHover, setBarberHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    if (isOpen && shopId && barberId) {
      setCheckingExisting(true);
      axiosInstance
        .get(API_PATHS.REVIEW.CHECK, {
          params: { shopId, barberId },
        })
        .then((res) => {
          if (res.data?.hasReviewed && res.data.data) {
            const existing = res.data.data;
            setShopRating(existing.shopRating || 5);
            setBarberRating(existing.barberRating || 5);
            setComment(existing.comment || '');
            setIsEditing(true);
          } else {
            setShopRating(5);
            setBarberRating(5);
            setComment('');
            setIsEditing(false);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingExisting(false));
    }
  }, [isOpen, shopId, barberId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopRating || !barberRating) {
      toast.error('Please provide ratings for both shop and barber');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post(API_PATHS.REVIEW.SUBMIT, {
        shopId,
        barberId,
        appointmentId,
        shopRating,
        barberRating,
        comment,
      });

      toast.success(isEditing ? 'Review updated successfully!' : 'Thank you for your feedback!');
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (rating, setRating, hover, setHover) => {
    return (
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                (hover || rating) >= star
                  ? 'fill-amber-500 text-amber-500'
                  : 'text-zinc-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-bold text-zinc-900">
          {(hover || rating)} / 5
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {isEditing ? 'Edit Your Review' : 'Rate Your Experience'}
              </h2>
              <p className="text-xs text-zinc-500">
                {shopName || 'Barber Shop'} • {barberName || 'Barber'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-zinc-900 flex items-center">
                <Store className="w-4 h-4 mr-2 text-zinc-500" />
                Rate Shop Ambience & Service
              </label>
              <span className="text-xs font-medium text-zinc-500">{shopName}</span>
            </div>
            {renderStarSelector(shopRating, setShopRating, shopHover, setShopHover)}
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-zinc-900 flex items-center">
                <User className="w-4 h-4 mr-2 text-zinc-500" />
                Rate Barber's Skill & Behavior
              </label>
              <span className="text-xs font-medium text-zinc-500">{barberName}</span>
            </div>
            {renderStarSelector(barberRating, setBarberRating, barberHover, setBarberHover)}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-zinc-400" />
              Write a Review <span className="text-zinc-400 font-normal text-xs ml-1">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others what you loved or how the experience could be improved..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors placeholder:text-zinc-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-medium rounded-xl px-4 py-2.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || checkingExisting}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
