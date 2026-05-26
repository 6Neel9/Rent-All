import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
  Calendar, CreditCard, MessageSquare, Trash, Star, CheckSquare, Clock, MapPin, XCircle, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/bookings');
      setBookings(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await axiosInstance.put(`/bookings/${bookingId}/cancel`, {
        cancelReason: 'Cancelled by renter'
      });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setReviewError('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');

    try {
      await axiosInstance.post('/reviews', {
        listingId: selectedBooking.listing?.id,
        bookingId: selectedBooking.id,
        rating,
        comment
      });
      setShowReviewModal(false);
      fetchBookings(); // Refresh to hide Review button for this item
      alert('Review submitted successfully!');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Group bookings
  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      
      switch (activeTab) {
        case 'upcoming':
          return (b.status === 'CONFIRMED' || b.status === 'PENDING') && start > now;
        case 'active':
          return b.status === 'CONFIRMED' && start <= now && end >= now;
        case 'completed':
          return b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && end < now);
        case 'cancelled':
          return b.status === 'CANCELLED' || b.status === 'REJECTED';
        default:
          return true;
      }
    });
  };

  const filtered = getFilteredBookings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800">My Rentals</h1>
          <p className="text-xs text-slate-400">Track and manage your bookings and rentals</p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1.5 rounded-2xl bg-white p-1 border border-slate-100 shadow-sm">
          {['upcoming', 'active', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-colors ${
                activeTab === tab 
                  ? 'bg-primary-600 text-white' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 text-center">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No bookings found</h3>
          <p className="text-xs text-slate-400 mt-1">You don't have any bookings in this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booking) => {
            const image = booking.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800';
            
            return (
              <div 
                key={booking.id} 
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Product Info */}
                <div className="flex gap-4">
                  <div className="h-16 w-20 overflow-hidden rounded-xl bg-slate-50">
                    <img src={image} alt={booking.listing?.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-700">{booking.listing?.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Status info */}
                <div className="flex items-center justify-between border-t border-b border-slate-50 py-3 text-xs">
                  <div>
                    <span className="text-slate-400">Total Price</span>
                    <p className="font-extrabold text-slate-700 mt-0.5">₹{booking.totalPrice}</p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                    booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-600' :
                    booking.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-red-55 bg-red-50 text-red-600'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                {/* Dashboard Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/listings/${booking.listing?.id}`)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    View Listing
                  </button>

                  {/* Cancel if pending */}
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="flex-1 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 py-2.5 text-center text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Review if Completed and not reviewed */}
                  {booking.status === 'COMPLETED' && !booking.hasReviewed && (
                    <button
                      onClick={() => handleOpenReviewModal(booking)}
                      className="flex-1 rounded-xl bg-primary-600 text-white hover:bg-primary-700 py-2.5 text-center text-xs font-bold shadow"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal popup */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Review {selectedBooking?.listing?.title}</h3>
            
            {reviewError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 flex gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rating selection stars */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating</label>
                <div className="mt-1 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`h-6 w-6 ${rating >= star ? 'fill-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Share your experience</label>
                <textarea
                  required
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the item? Was it clean, functional, and delivered on time?"
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 rounded-xl bg-primary-600 py-2.5 text-xs font-bold text-white hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
