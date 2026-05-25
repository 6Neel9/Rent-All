import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-xl font-black tracking-tight text-transparent">
              RentAll
            </span>
            <p className="text-sm text-slate-400">
              The premium peer-to-peer sharing marketplace. Rent anything, anywhere, anytime.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</h3>
            <ul className="mt-4 flex flex-col gap-2">
              <li><Link to="/about" className="text-sm text-slate-500 hover:text-primary-600">About Us</Link></li>
              <li><Link to="/careers" className="text-sm text-slate-500 hover:text-primary-600">Careers</Link></li>
              <li><Link to="/press" className="text-sm text-slate-500 hover:text-primary-600">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Support</h3>
            <ul className="mt-4 flex flex-col gap-2">
              <li><Link to="/help" className="text-sm text-slate-500 hover:text-primary-600">Help Center</Link></li>
              <li><Link to="/trust" className="text-sm text-slate-500 hover:text-primary-600">Trust & Safety</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-500 hover:text-primary-600">Contact Support</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</h3>
            <ul className="mt-4 flex flex-col gap-2">
              <li><Link to="/privacy" className="text-sm text-slate-500 hover:text-primary-600">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-slate-500 hover:text-primary-600">Terms of Service</Link></li>
              <li><Link to="/cancellation" className="text-sm text-slate-500 hover:text-primary-600">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-50 pt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} RentAll Inc. All rights reserved. Made with ❤️ for peer-sharing.
        </div>
      </div>
    </footer>
  );
}
