import React from 'react';
import { Calculator, Shield, Award, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-card/50 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
              <Shield className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Secure</p>
              <p className="text-xs">Bank-level security</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest/10">
              <Award className="h-5 w-5 text-forest" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Certified</p>
              <p className="text-xs">Industry standard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-light/10">
              <Calculator className="h-5 w-5 text-navy-light" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Accurate</p>
              <p className="text-xs">Precise calculations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
              <Clock className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Real-time</p>
              <p className="text-xs">Instant results</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dark">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              Wealth<span className="text-gold">Calc</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} WealthCalc. Professional Financial Calculator Suite.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
