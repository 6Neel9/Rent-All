import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
  TrendingUp, Calendar, Layout, Award, Check, X, ShieldAlert, Plus, Power, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function HostDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);

  // Statistics
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalBookings: 0,
    activeRentals: 0,
    avgRating: 5.0
  });

  useEffect(() => {
    fetchHostData();
  }, []);

  const fetchHostData = async () => {
    setLoading(true);
    try {
      // 1. Fetch host listings
      const listRes = await axiosInstance.get('/listings/host');
      setListings(listRes.data.data);

      // 2. Fetch host booking requests
      const reqRes = await axiosInstance.get('/bookings/host');
      const reqData = reqRes.data.data;
      setRequests(reqData);

      // 3. Compute stats
      const earnings = reqData
        .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
        .reduce((sum, b) => sum + Number(b.totalPrice), 0);

      const active = reqData.filter((b) => {
        const now = new Date();
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        return b.status === 'CONFIRMED' && start <= now && end >= now;
      }).length;

      const ratings = listRes.data.data.filter((l) => l.avgRating > 0);
      const avgRate = ratings.length 
        ? ratings.reduce((sum, l) => sum + l.avgRating, 0) / ratings.length 
        : 5.0;

      setStats({
        totalEarnings: earnings,
        totalBookings: reqData.length,
        activeRentals: active,
        avgRating: avgRate
      });
    } catch (err) {
      console.warn('Failed to load host dashboard details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, statusAction) => {
    try {
      await axiosInstance.put(`/bookings/${bookingId}/status`, { status: statusAction });
      fetchHostData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const handleToggleAvailability = async (listingId, currentActive) => {
    try {
      await axiosInstance.put(`/listings/${listingId}`, {
        isActive: !currentActive
      });
      fetchHostData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update listing status.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Host Dashboard</h1>
          <p className="text-xs text-slate-400">Manage your listings, incoming requests, and performance stats</p>
        </div>

        <Link
          to="/listings/new"
          className="flex items-center gap-1.5 rounded-2xl bg-primary-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Listing</span>
        </Link>
      </div>

      {/* Analytics Row */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Card 1 */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Earnings</span>
            <h3 className="text-xl font-extrabold text-slate-700 mt-1">₹{stats.totalEarnings}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <h3 className="text-xl font-extrabold text-slate-700 mt-1">{stats.totalBookings}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Rentals</span>
            <h3 className="text-xl font-extrabold text-slate-700 mt-1">{stats.activeRentals}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Layout className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Rating</span>
            <h3 className="text-xl font-extrabold text-slate-700 mt-1">{stats.avgRating.toFixed(1)} / 5.0</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 gap-6 mb-6">
        {['requests', 'listings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'requests' ? 'Booking Requests' : 'My Listings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : activeTab === 'requests' ? (
        /* Requests Tab View */
        requests.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-3xl bg-white border border-slate-100 text-center p-8">
            <Calendar className="h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-xs font-bold text-slate-600">No booking requests</h3>
            <p className="text-[10px] text-slate-400 mt-1">Incoming bookings from renters will show up here.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Item</th>
                  <th className="p-4">Renter</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/40">
                    <td className="p-4">
                      <span className="font-bold text-slate-700">{req.listing?.title}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-700">{req.renter?.fullName}</p>
                        <p className="text-[10px] text-slate-400">{req.renter?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-600">
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-700">₹{req.totalPrice}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                        req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                        req.status === 'CONFIRMED' ? 'bg-green-50 text-green-600' :
                        req.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                            className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            title="Reject Request"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'CONFIRMED')}
                            className="rounded-lg border border-green-200 bg-green-50 p-2 text-green-600 hover:bg-green-100"
                            title="Accept Request"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      
                      {req.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Listings Tab View */
        listings.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-3xl bg-white border border-slate-100 text-center p-8">
            <Layout className="h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-xs font-bold text-slate-600">No active listings</h3>
            <p className="text-[10px] text-slate-400 mt-1">Start listing items to generate rental earnings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => {
              const image = item.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800';
              
              return (
                <div 
                  key={item.id} 
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-20 overflow-hidden rounded-xl bg-slate-50">
                      <img src={image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="line-clamp-1 text-sm font-bold text-slate-700">{item.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>₹{item.pricePerDay} / day</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    {/* Active toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAvailability(item.id, item.isActive)}
                        className="text-slate-500 hover:text-slate-700"
                        title={item.isActive ? 'Block Availability' : 'Make Active'}
                      >
                        {item.isActive ? (
                          <ToggleRight className="h-8 w-8 text-primary-600 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-slate-350 cursor-pointer" />
                        )}
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/listings/${item.id}`)}
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
