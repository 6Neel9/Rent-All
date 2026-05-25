import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { 
  Star, MapPin, ShieldAlert, Calendar, MessageSquare, Shield, Check, Info, FileText, Zap, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Gallery index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Card States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingDays, setBookingDays] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await axiosInstance.get(`/listings/${id}`);
        setListing(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  // Recalculate price breakdown when dates change
  useEffect(() => {
    if (!startDate || !endDate || !listing) {
      setBookingDays(0);
      setPriceBreakdown(null);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      setBookingError('End date must be after start date.');
      setBookingDays(0);
      setPriceBreakdown(null);
      return;
    }

    setBookingError('');
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    setBookingDays(days);

    const pricePerDay = Number(listing.pricePerDay);
    const depositAmount = Number(listing.depositAmount);
    let rentalPrice;

    if (days >= 7 && listing.pricePerWeek) {
      const pricePerWeek = Number(listing.pricePerWeek);
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      rentalPrice = (weeks * pricePerWeek) + (remainingDays * pricePerDay);
    } else {
      rentalPrice = days * pricePerDay;
    }

    setPriceBreakdown({
      days,
      rentalPrice,
      depositAmount,
      totalAmount: rentalPrice + depositAmount
    });
  }, [startDate, endDate, listing]);

  const handleBookNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listings/${id}` } } });
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Please select both start and end dates.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await axiosInstance.post('/bookings', {
        listingId: listing.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });
      
      const { booking } = res.data.data;
      // Redirect to checkout with the created booking ID
      navigate(`/checkout/${booking.id}`);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleChatHost = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await axiosInstance.post('/messages/conversations', {
        listingId: listing.id,
        recipientId: listing.hostId
      });
      const conversation = res.data.data;
      navigate(`/inbox?active=${conversation.id}`);
    } catch (err) {
      console.warn('Failed to start chat:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h3 className="text-lg font-bold text-red-600">{error || 'Listing not found'}</h3>
      </div>
    );
  }

  const images = listing.images || [];
  const primaryImage = images[activeImageIndex]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50">
      {/* Category Pill and Title */}
      <div className="mb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {listing.category?.name}
        </span>
        <h1 className="text-2xl font-black text-slate-800 sm:text-3xl mt-1">{listing.title}</h1>
        
        {/* Rating and Location Header */}
        <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-slate-800">{listing.avgRating.toFixed(1)}</span>
            <span>({listing.totalReviews} reviews)</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary-600" />
            <span>{listing.city}, {listing.state}, {listing.country}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Photos & booking */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Columns: Photo gallery & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photo Gallery component */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-2 shadow-sm">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
              <img 
                src={primaryImage} 
                alt={listing.title} 
                className="h-full w-full object-cover transition-all duration-300"
              />
              
              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector row */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      activeImageIndex === index ? 'border-primary-600 scale-95' : 'border-transparent opacity-75'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Host Info */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {listing.host?.avatarUrl ? (
                  <img src={listing.host.avatarUrl} alt={listing.host.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-primary-600 text-base">
                    {listing.host?.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hosted by {listing.host?.fullName}</h3>
                <p className="text-xs text-slate-400">Joined in {new Date(listing.host?.createdAt).getFullYear()}</p>
              </div>
            </div>

            {user?.id !== listing.hostId && (
              <button
                onClick={handleChatHost}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-primary-600" />
                <span>Message Host</span>
              </button>
            )}
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-700">About this rental</h2>
            <p className="text-sm leading-relaxed text-slate-500 whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Rules and Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rules */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-slate-400" />
                <span>Rental Rules</span>
              </h2>
              <p className="text-xs leading-relaxed text-slate-500 whitespace-pre-line">
                {listing.rules || 'No rules specified by the host.'}
              </p>
            </div>

            {/* Cancellation Policy */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-slate-400" />
                <span>Cancellation Policy</span>
              </h2>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-primary-600">
                  {listing.cancellationPolicy}
                </span>
                <p className="text-xs leading-relaxed text-slate-400">
                  {listing.cancellationPolicy === 'FLEXIBLE' && 'Flexible: Full refund if cancelled more than 24 hours before rental start.'}
                  {listing.cancellationPolicy === 'MODERATE' && 'Moderate: 100% refund up to 5 days before, 50% refund up to 24 hours before.'}
                  {listing.cancellationPolicy === 'STRICT' && 'Strict: No refund if cancelled less than 7 days before rental start.'}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-700">Reviews ({listing.reviews?.length || 0})</h2>
            
            {listing.reviews?.length === 0 ? (
              <p className="text-xs text-slate-400">No reviews yet for this listing.</p>
            ) : (
              <div className="space-y-6">
                {listing.reviews?.map((review) => (
                  <div key={review.id} className="border-b border-slate-50 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                        {review.reviewer?.avatarUrl ? (
                          <img src={review.reviewer.avatarUrl} alt={review.reviewer.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-primary-600 text-xs">
                            {review.reviewer?.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">{review.reviewer?.fullName}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-bold text-slate-600">{review.rating}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Card Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-50 pb-4">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-slate-800">₹{listing.pricePerDay}</span>
                <span className="text-xs text-slate-400 font-medium">/ day</span>
              </div>
              
              {listing.pricePerWeek && (
                <div className="text-xs text-indigo-600 font-bold">
                  ₹{listing.pricePerWeek} / week
                </div>
              )}
            </div>

            {/* Inputs: Select Dates */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Dates</label>
                <div className="mt-1 flex flex-col gap-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[10px] font-bold text-slate-400">START:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-16 pr-4 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[10px] font-bold text-slate-400">RETURN:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-16 pr-4 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="rounded-2xl bg-red-50 p-4 flex gap-2 text-xs font-semibold text-red-600">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Price Calculations */}
            {priceBreakdown && (
              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>₹{listing.pricePerDay} × {priceBreakdown.days} days</span>
                  <span className="font-semibold text-slate-700">₹{priceBreakdown.rentalPrice}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Refundable Deposit</span>
                  <span className="font-semibold text-slate-700">₹{priceBreakdown.depositAmount}</span>
                </div>
                
                {priceBreakdown.days >= 7 && listing.pricePerWeek && (
                  <div className="flex gap-1 text-[10px] text-green-600 font-bold items-center">
                    <Check className="h-3 w-3" />
                    <span>Weekly rate applied!</span>
                  </div>
                )}
                
                <div className="border-t border-slate-200/50 pt-3 flex items-center justify-between text-sm font-bold text-slate-800">
                  <span>Total Amount</span>
                  <span>₹{priceBreakdown.totalAmount}</span>
                </div>
              </div>
            )}

            {/* Book Trigger Button */}
            <button
              disabled={bookingLoading}
              onClick={handleBookNow}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all ${
                listing.instantBook 
                  ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600' 
                  : 'bg-primary-600 shadow-primary-500/20 hover:bg-primary-700'
              }`}
            >
              {listing.instantBook && <Zap className="h-4 w-4 fill-white" />}
              <span>{bookingLoading ? 'Requesting...' : listing.instantBook ? 'Instant Book' : 'Request Rental'}</span>
            </button>

            {/* Security Notice */}
            <div className="flex items-start gap-2.5 text-[10px] text-slate-400 leading-normal">
              <Shield className="h-4 w-4 shrink-0 text-slate-400" />
              <p>Your security deposit is securely escrowed. It is only released when you return the item and the host marks it returned.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
