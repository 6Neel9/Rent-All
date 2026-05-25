import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
  FileText, Shield, Image, MapPin, DollarSign, List, ArrowLeft, ArrowRight, Zap 
} from 'lucide-react';

export default function CreateListing() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    pricePerDay: '',
    pricePerWeek: '',
    depositAmount: '',
    rules: '',
    cancellationPolicy: 'FLEXIBLE',
    city: '',
    state: '',
    country: 'India',
    latitude: 19.076, // Mumbai default
    longitude: 72.8777,
    instantBook: false
  });

  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create listing
      const res = await axiosInstance.post('/listings', {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
        pricePerWeek: formData.pricePerWeek ? Number(formData.pricePerWeek) : undefined,
        depositAmount: Number(formData.depositAmount),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude)
      });
      const listing = res.data.data;

      // 2. Attach image URL if provided
      if (imageUrl) {
        await axiosInstance.post(`/listings/${listing.id}/images`, {
          url: imageUrl,
          isPrimary: true
        });
      } else {
        // Fallback default image
        await axiosInstance.post(`/listings/${listing.id}/images`, {
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800',
          isPrimary: true
        });
      }

      navigate('/dashboard/host');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing. Please check input formats.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickImage = (url) => {
    setImageUrl(url);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      {/* Header back */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Rent Out an Item</h1>
          <p className="text-xs text-slate-400">Fill in details to list your item on the marketplace</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <List className="h-4 w-4 text-primary-500" />
              <span>Basic Information</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="e.g. Sony Alpha 7 IV Camera Body"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                <select
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="Describe your item, its specifications, and package contents..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Image URL Mock */}
          <div className="space-y-4 border-t border-slate-50 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Image className="h-4 w-4 text-primary-500" />
              <span>Image Upload</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                placeholder="https://images.unsplash.com/... or leave blank for default mock image"
              />

              {/* Sample Unsplash selectors for testing */}
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or select a demo photo:</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleQuickImage('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    📷 Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickImage('https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=600')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    🎧 Headphones
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickImage('https://images.unsplash.com/photo-1507537362848-9c7e70b77948?q=80&w=600')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    🎒 Backpack
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Deposit */}
          <div className="space-y-4 border-t border-slate-50 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-primary-500" />
              <span>Pricing & Security Deposit</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price per day (₹)</label>
                <input
                  name="pricePerDay"
                  type="number"
                  required
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price per week (Optional, ₹)</label>
                <input
                  name="pricePerWeek"
                  type="number"
                  value={formData.pricePerWeek}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="3000"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Deposit (₹)</label>
                <input
                  name="depositAmount"
                  type="number"
                  required
                  value={formData.depositAmount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="2000"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Rules & Policies */}
          <div className="space-y-4 border-t border-slate-50 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary-500" />
              <span>Rental Guidelines & Settings</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cancellation Policy</label>
                <select
                  name="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                >
                  <option value="FLEXIBLE">Flexible (24h before)</option>
                  <option value="MODERATE">Moderate (5 days before)</option>
                  <option value="STRICT">Strict (7 days before)</option>
                </select>
              </div>

              {/* Instant Book */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  name="instantBook"
                  id="instantBook"
                  checked={formData.instantBook}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <label htmlFor="instantBook" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>Instant Book</span>
                  </label>
                  <span className="text-[9px] text-slate-400 leading-none mt-0.5">Renters can book instantly without host approval.</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rental Rules / Guidelines</label>
                <textarea
                  name="rules"
                  rows="3"
                  value={formData.rules}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="e.g. Return in original box. Charge battery before returning. No water usage..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 5: Location */}
          <div className="space-y-4 border-t border-slate-50 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary-500" />
              <span>Location Coordinates</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</label>
                <input
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="Mumbai"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State</label>
                <input
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="Maharashtra"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Country</label>
                <input
                  name="country"
                  type="text"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                  placeholder="India"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Publishing...' : 'Publish Listing'}</span>
            {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}
