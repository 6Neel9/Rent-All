import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">My Profile</h1>
          <p className="text-xs text-slate-400">Manage your contact information and rental location</p>
        </div>

        {message && (
          <div className="rounded-xl bg-green-50 p-4 text-xs font-semibold text-green-600">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Profile Card Summary */}
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-primary-600 text-xl">
                {user?.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{user?.fullName}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                user?.kycStatus === 'VERIFIED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {user?.kycStatus || 'PENDING'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">KYC Status</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address (Readonly)</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-350">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avatar Image URL</label>
              <input
                name="avatarUrl"
                type="text"
                value={formData.avatarUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <input
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <input
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}
