import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

export default function ListingCard({ listing, onWishlistToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(listing.isWishlisted || false);
  const [loading, setLoading] = useState(false);

  const primaryImage = listing.images?.find(img => img.isPrimary)?.url || 
                       listing.images?.[0]?.url || 
                       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800';

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post(`/wishlist/${listing.id}`);
      setWishlisted(res.data.data.wishlisted);
      if (onWishlistToggle) {
        onWishlistToggle(listing.id, res.data.data.wishlisted);
      }
    } catch (err) {
      console.warn('Failed to update wishlist:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link 
      to={`/listings/${listing.id}`} 
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image Gallery Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
        <img 
          src={primaryImage} 
          alt={listing.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Wishlist Heart Icon */}
        <button
          disabled={loading}
          onClick={handleWishlistClick}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-slate-600 shadow-sm transition-all hover:bg-white hover:text-red-500 disabled:opacity-50"
        >
          <Heart className={`h-4.5 w-4.5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
        </button>

        {/* Instant Book Badge */}
        {listing.instantBook && (
          <div className="absolute left-3 top-3 flex items-center gap-0.5 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            <Zap className="h-3 w-3 fill-white" />
            <span>INSTANT</span>
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="mt-3 flex flex-1 flex-col">
        {/* Category & Location */}
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>{listing.category?.name || 'Item'}</span>
          <span>{listing.city}, {listing.state}</span>
        </div>

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-800 transition-colors group-hover:text-primary-600">
          {listing.title}
        </h3>

        {/* Description Snippet */}
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
          {listing.description}
        </p>

        {/* Price and Rating row */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-50">
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-extrabold text-slate-800">₹{listing.pricePerDay}</span>
            <span className="text-[10px] text-slate-400 font-medium">/ day</span>
          </div>

          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700">
              {listing.avgRating > 0 ? listing.avgRating.toFixed(1) : 'New'}
            </span>
            {listing.totalReviews > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                ({listing.totalReviews})
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
