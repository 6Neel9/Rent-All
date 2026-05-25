import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import { ProtectedRoute, HostRoute } from './components/RouteGuards';

// Pages
import LandingPage from './pages/LandingPage';
import SearchResults from './pages/SearchResults';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateListing from './pages/CreateListing';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import HostDashboard from './pages/HostDashboard';
import Inbox from './pages/Inbox';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="flex min-h-screen flex-col bg-slate-50 font-sans antialiased text-slate-800">
            {/* Header Navigation */}
            <Header />

            {/* Main Content View */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Renter Routes */}
                <Route 
                  path="/checkout/:bookingId" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/inbox" 
                  element={
                    <ProtectedRoute>
                      <Inbox />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wishlist" 
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  } 
                />

                {/* Host Controlled Routes */}
                <Route 
                  path="/listings/new" 
                  element={
                    <HostRoute>
                      <CreateListing />
                    </HostRoute>
                  } 
                />
                <Route 
                  path="/dashboard/host" 
                  element={
                    <HostRoute>
                      <HostDashboard />
                    </HostRoute>
                  } 
                />

                {/* Redirect any other path to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer Information */}
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
