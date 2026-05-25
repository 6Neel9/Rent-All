import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import ListingCard from '../components/ListingCard';
import { SlidersHorizontal, ArrowUpDown, Tag, MapPin, Star, Calendar, RefreshCcw } from 'lucide-react';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [catId, setCatId] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [instantBook, setInstantBook] = useState(searchParams.get('instantBook') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        setCategories(res.data.data);
      } catch (err) {
        console.warn('Failed to load categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  // Fetch filtered listings when searchParams change
  useEffect(() => {
    const fetchFilteredListings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/search?${searchParams.toString()}`);
        // Support paginated structure
        const data = res.data.data.results || res.data.data;
        setListings(data);
      } catch (err) {
        console.warn('Search query failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredListings();
  }, [searchParams]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (city) params.append('city', city);
    if (catId) params.append('categoryId', catId);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (instantBook) params.append('instantBook', 'true');
    if (sortBy) params.append('sortBy', sortBy);

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCity('');
    setCatId('');
    setMinPrice('');
    setMaxPrice('');
    setInstantBook(false);
    setSortBy('newest');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Side: Sidebar Filters */}
        <aside className="w-full shrink-0 lg:w-64 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-primary-600" />
              <h2 className="text-sm font-bold text-slate-700">Filters</h2>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-primary-600 hover:underline"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="mt-4 space-y-4">
            {/* Search Query */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Title</label>
              <input
                type="text"
                placeholder="Camera, Trek..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* City */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</label>
              <input
                type="text"
                placeholder="Mumbai..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Budget (₹)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Instant Book */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="instantBook"
                checked={instantBook}
                onChange={(e) => setInstantBook(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="instantBook" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                Instant Book Only
              </label>
            </div>

            {/* Apply Button */}
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-primary-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-primary-700 active:scale-95 transition-all"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Right Side: Results Grid */}
        <main className="flex-1">
          {/* Header Row */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-55 bg-white px-6 py-4 shadow-sm mb-6">
            <span className="text-xs font-bold text-slate-400">
              Found {listings.length} items
            </span>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  // Trigger search update immediately
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('sortBy', e.target.value);
                  setSearchParams(newParams);
                }}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
              >
                <option value="newest">Newest Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="most_booked">Most Booked</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <SlidersHorizontal className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-700">No rentals found</h3>
              <p className="text-xs text-slate-400 mt-1">Try relaxing your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
