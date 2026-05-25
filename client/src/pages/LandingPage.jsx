import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import ListingCard from '../components/ListingCard';
import { Search, MapPin, Calendar, Compass, Wrench, Shield, CheckCircle, RefreshCcw } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(true);

  // Load categories and initial listings
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const catRes = await axiosInstance.get('/search/categories');
        setCategories(catRes.data.data);

        const listRes = await axiosInstance.get('/listings');
        setListings(listRes.data.data);
      } catch (err) {
        console.warn('Failed to load explore data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Filter listings when category changes
  const handleCategorySelect = async (category) => {
    setLoading(true);
    try {
      if (selectedCategory?.id === category.id) {
        // Toggle off
        setSelectedCategory(null);
        const res = await axiosInstance.get('/listings');
        setListings(res.data.data);
      } else {
        setSelectedCategory(category);
        const res = await axiosInstance.get(`/listings?categoryId=${category.id}`);
        setListings(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to filter listings by category:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Construct query parameters
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (city) params.append('city', city);
    if (startDate) params.append('startDate', new Date(startDate).toISOString());
    if (endDate) params.append('endDate', new Date(endDate).toISOString());
    if (selectedCategory) params.append('categoryId', selectedCategory.id);

    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 border-b border-slate-100">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-indigo-100/30 blur-3xl"></div>

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl md:text-6xl">
            Rent <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">Anything</span>, Nearby.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400 sm:text-lg">
            A secure, premium peer-to-peer sharing marketplace. Rent cars, electronics, cameras, tools, fashion, and gear from verified people.
          </p>

          {/* Search Form Panel */}
          <form 
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-10 grid grid-cols-1 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl md:grid-cols-4 md:gap-2"
          >
            {/* Search Query */}
            <div className="relative flex items-center border-b border-slate-50 pb-2 md:border-b-0 md:border-r md:pb-0 md:pr-2">
              <Search className="absolute left-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-10 pr-2 text-sm text-slate-800 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* City Location */}
            <div className="relative flex items-center border-b border-slate-50 pb-2 md:border-b-0 md:border-r md:pb-0 md:pr-2">
              <MapPin className="absolute left-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="City/Location"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent pl-10 pr-2 text-sm text-slate-800 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Start & End Dates */}
            <div className="relative flex items-center border-b border-slate-50 pb-2 md:border-b-0 md:pb-0 md:pr-2">
              <Calendar className="absolute left-3 h-4.5 w-4.5 text-slate-400" />
              <div className="flex w-full gap-1 pl-10 pr-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-500 focus:outline-none"
                  title="Start Date"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-500 focus:outline-none"
                  title="End Date"
                />
              </div>
            </div>

            {/* Search Trigger Button */}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-700 active:scale-95"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Browse Categories
          </h2>
        </div>
        
        <div className="mt-4 flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all ${
                selectedCategory?.id === cat.id
                  ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Items Grid */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h2 className="text-lg font-black text-slate-800">
          {selectedCategory ? `Featured in ${selectedCategory.name}` : 'Explore Featured Rentals'}
        </h2>

        {loading ? (
          <div className="mt-12 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-12 text-center text-sm text-slate-400">
            No items available in this category.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>

      {/* How it Works / Trust Section */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800">Rent with Absolute Confidence</h2>
            <p className="mt-2 text-sm text-slate-400">Safety, quality, and simplicity built into every transaction.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-700">Verified Users</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Complete KYC verifications and ratings history ensures trusted hosts and renters.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-700">Protected Deposits</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Rental security deposits are securely escrowed and released automatically when returned.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-700">Fair Damage Claim</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Our support team arbitrates using pre and post-rental pictures logged inside the app.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
