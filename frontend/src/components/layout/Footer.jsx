import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Shield, Award, Clock, AlertTriangle } from 'lucide-react';
import { FullDisclaimer } from '@/components/calculators/Disclaimer';

export const Footer = () => {
  return (
    <footer className="border-t border-navy-800 bg-navy-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Secure</p>
              <p className="text-xs text-slate-400">Bank-level security</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Award className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Certified</p>
              <p className="text-xs text-slate-400">Industry standard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Calculator className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Accurate</p>
              <p className="text-xs text-slate-400">Precise calculations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Clock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Real-time</p>
              <p className="text-xs text-slate-400">Instant results</p>
            </div>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-8">
          <FullDisclaimer />
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <span className="text-navy-950 font-bold text-sm">A</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Financial Advisory Pro
            </span>
          </div>
          <p className="text-sm text-slate-400 text-center">
            © {new Date().getFullYear()} Financial Advisory Pro. Professional Financial Calculator Suite.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
            <Link to="/refund-policy" className="hover:text-emerald-400 transition-colors">Refunds</Link>
            <a href="mailto:support@advisorypro.co.za" className="hover:text-emerald-400 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
