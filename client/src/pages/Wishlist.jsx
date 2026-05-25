import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import ListingCard from '../components/ListingCard';
import { Heart } from 'lucide-react';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await axiosInstance.get('/wishlist');
      setItems(res.data.data);
    } catch (err) {
      console.warn('Failed to load wishlist:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = (listingId, isWishlisted) => {
    if (!isWishlisted) {
      // Remove from UI list immediately
      setItems((prev) => prev.filter((item) => item.id !== listingId));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">My Wishlist</h1>
        <p className="text-xs text-slate-400">Items you have saved for later</p>
      </div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <Heart className="h-12 w-12 text-slate-350 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Wishlist is empty</h3>
          <p className="text-xs text-slate-400 mt-1">Tap the heart icon on listings to save them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((listing) => (
            <ListingCard 
              key={listing.id} 
              listing={{ ...listing, isWishlisted: true }} 
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
