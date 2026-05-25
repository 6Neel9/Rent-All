import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
  CreditCard, Calendar, CheckSquare, Shield, ShieldCheck, AlertCircle, ArrowLeft, ArrowRight, Star, Info
} from 'lucide-react';

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Checkout flow states
  const [kycAgreed, setKycAgreed] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axiosInstance.get(`/bookings/${bookingId}`);
        setBooking(res.data.data);
        
        // Check if razorpay key is mock
        if (res.data.data.paymentOrderId?.startsWith('order_mock_')) {
          setIsTestMode(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load checkout details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!kycAgreed) {
      setError('Please agree to the KYC check and user guidelines.');
      return;
    }

    setPaymentStarted(true);
    setError('');

    try {
      // 1. Create Checkout Session Order
      const orderRes = await axiosInstance.post('/payments/create-order', {
        bookingId: booking.id
      });
      const { orderId, amount, currency, keyId } = orderRes.data.data;

      // Check if it's test mode/mock
      if (orderId.startsWith('order_mock_')) {
        setIsTestMode(true);
        // We will let user trigger mock simulation in the UI, so we stop here
        setPaymentStarted(false);
        return;
      }

      // 2. Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway SDK. Please check your internet connection.');
        setPaymentStarted(false);
        return;
      }

      // 3. Configure Checkout Modal Options
      const options = {
        key: keyId,
        amount: amount * 100, // in paise
        currency: currency,
        name: 'RentAll Marketplace',
        description: `Rental payment for booking: ${booking.id.substring(0, 8)}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            await axiosInstance.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: booking.id
            });
            setPaymentSuccess(true);
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: booking.renter?.fullName,
          email: booking.renter?.email,
          contact: booking.renter?.phone
        },
        theme: {
          color: '#8b5cf6' // Violet primary brand color
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment session.');
    } finally {
      setPaymentStarted(false);
    }
  };

  // Mock Payment Simulator callback
  const handleSimulatePayment = async () => {
    setPaymentStarted(true);
    setError('');
    
    try {
      const mockOrderId = booking.paymentOrderId || `order_mock_${Date.now().toString(36)}`;
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
      const mockSignature = 'mock_signature';

      await axiosInstance.post('/payments/verify', {
        razorpayOrderId: mockOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature,
        bookingId: booking.id
      });

      setPaymentSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Mock payment simulation failed.');
    } finally {
      setPaymentStarted(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h3 className="text-lg font-bold text-red-600">{error || 'Booking session not found'}</h3>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md text-center rounded-3xl border border-slate-100 bg-white p-8 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
            <ShieldCheck className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Payment Successful!</h2>
          <p className="text-sm text-slate-400">
            Your booking request has been successfully completed. If this is an instant book listing, it is now confirmed. Otherwise, the host has been notified to review your request.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
          >
            Go to My Rentals
          </button>
        </div>
      </div>
    );
  }

  const itemImage = booking.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 space-y-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Cancel & Go Back</span>
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
        {/* Left Column: Booking details & KYC Checklist */}
        <div className="md:col-span-3 space-y-6">
          {/* Item details */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex gap-4">
            <div className="h-20 w-24 overflow-hidden rounded-xl bg-slate-50">
              <img src={itemImage} alt={booking.listing?.title} className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Booking Summary</span>
              <h2 className="text-sm font-bold text-slate-700 mt-0.5">{booking.listing?.title}</h2>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3.5 w-3.5 text-primary-500" />
                <span className="text-xs text-slate-500 font-semibold">
                  {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">({booking.totalDays} days)</span>
              </div>
            </div>
          </div>

          {/* KYC check */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary-600" />
              <span>Safety & Identity Guidelines</span>
            </h3>
            
            <div className="space-y-3 border-t border-slate-50 pt-4 text-xs text-slate-500 leading-relaxed">
              <p>To keep the RentAll sharing community secure, you agree that:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You will return the rental in the exact same condition.</li>
                <li>You will present a valid government ID to the host upon handoff.</li>
                <li>Any damages will be claimed using pictures logged prior to pickup.</li>
              </ul>
            </div>

            <div className="flex items-start gap-2.5 pt-3">
              <input
                type="checkbox"
                id="kyc"
                checked={kycAgreed}
                onChange={(e) => setKycAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="kyc" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                I verify that my profile details are accurate and agree to present my ID upon pickup.
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Pricing */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-50">Price Breakdown</h3>

            <div className="space-y-3.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Rental Fees ({booking.totalDays} days)</span>
                <span className="font-semibold text-slate-700">₹{booking.totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Refundable Security Deposit</span>
                <span className="font-semibold text-slate-700">₹{booking.depositAmount}</span>
              </div>
              
              <div className="border-t border-slate-100 pt-3.5 flex justify-between text-base font-extrabold text-slate-800">
                <span>Due Now</span>
                <span>₹{Number(booking.totalPrice) + Number(booking.depositAmount)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 flex gap-2 text-xs font-semibold text-red-600">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* If Mock/Test key is detected, display mock payment simulator */}
            {isTestMode ? (
              <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-4 space-y-3.5">
                <div className="flex gap-1.5 items-center text-xs font-bold text-indigo-700">
                  <Info className="h-4.5 w-4.5" />
                  <span>Test Gateway Simulator</span>
                </div>
                <p className="text-[10px] leading-normal text-indigo-500">
                  RentAll is running with mock Razorpay API keys. Click below to simulate a successful checkout payment.
                </p>
                <button
                  disabled={paymentStarted}
                  onClick={handleSimulatePayment}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow hover:bg-indigo-700"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Simulate Payment (Success)</span>
                </button>
              </div>
            ) : (
              <button
                disabled={paymentStarted}
                onClick={handlePayment}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
              >
                <CreditCard className="h-4 w-4" />
                <span>{paymentStarted ? 'Connecting...' : 'Proceed to Pay'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
