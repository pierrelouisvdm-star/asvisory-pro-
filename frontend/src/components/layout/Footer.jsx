import React from 'react';
import { Calculator, Shield, Award, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-navy-700 bg-navy-900/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Secure</p>
              <p className="text-xs text-slate-400">Bank-level security</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Certified</p>
              <p className="text-xs text-slate-400">Industry standard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Accurate</p>
              <p className="text-xs text-slate-400">Precise calculations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Real-time</p>
              <p className="text-xs text-slate-400">Instant results</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-navy-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-white">
              <Calculator className="h-4 w-4 text-white dark:text-slate-900" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              AdvisoryPro
            </span>
          </div>
          <p className="text-sm text-slate-400 text-center">
            © {new Date().getFullYear()} AdvisoryPro. Professional Financial Calculator Suite.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
