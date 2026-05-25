import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axiosInstance from '../api/axiosInstance';
import { 
  Search, Bell, MessageSquare, User, LogOut, LayoutDashboard, PlusCircle, Menu, X, CheckSquare, Heart
} from 'lucide-react';

export default function Header() {
  const { user, logout, isHost } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef();
  const profileRef = useRef();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await axiosInstance.get('/notifications');
          setNotifications(res.data.data);
          
          const countRes = await axiosInstance.get('/notifications/unread');
          setUnreadCount(countRes.data.data.count);
        } catch (err) {
          console.warn('Failed to load notifications:', err.message);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  // Listen to socket notifications
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Show browser audio beep or simple custom alert if desired
      };

      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket]);

  const handleMarkAsRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-2xl font-black tracking-tight text-transparent">
            RentAll
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'}`}
          >
            Explore
          </Link>
          {user && (
            <>
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'}`}
              >
                My Rentals
              </Link>
              {isHost && (
                <Link 
                  to="/dashboard/host" 
                  className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/dashboard/host') ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'}`}
                >
                  Host Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Inbox Link */}
              <Link 
                to="/inbox" 
                className="relative p-2 text-slate-500 hover:text-primary-600"
                title="Messages"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>

              {/* Notification Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 text-slate-500 hover:text-primary-600"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5">
                    <div className="border-b border-slate-50 px-4 py-2 font-semibold text-slate-700">
                      Notifications
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex flex-col gap-1 p-3 transition-colors hover:bg-slate-50 border-b border-slate-50/50 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-xs font-bold text-slate-700">{notif.title}</span>
                              {!notif.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="text-[10px] font-medium text-primary-600 hover:underline"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{notif.body}</p>
                            {notif.link && (
                              <Link
                                to={notif.link}
                                onClick={() => {
                                  setNotifDropdownOpen(false);
                                  handleMarkAsRead(notif.id);
                                }}
                                className="mt-1 text-[10px] font-semibold text-primary-600 hover:underline"
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-primary-600 text-sm">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-1 shadow-xl ring-1 ring-black/5">
                    <div className="border-b border-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Rentals Dashboard
                      </Link>
                      {(!isHost && user.role !== 'BOTH') && (
                        <button
                          onClick={async () => {
                            setProfileDropdownOpen(false);
                            // Upgrade to host: quick put profile endpoint update
                            try {
                              await updateProfile({ role: 'BOTH' });
                              navigate('/dashboard/host');
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Start Renting Out
                        </button>
                      )}
                    </div>
                    <div className="border-t border-slate-50 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-primary-600"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggler */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Explore
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  My Rentals
                </Link>
                {isHost && (
                  <Link
                    to="/dashboard/host"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Host Dashboard
                  </Link>
                )}
                <Link
                  to="/inbox"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Messages
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  My Profile
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Wishlist
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-50 pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
