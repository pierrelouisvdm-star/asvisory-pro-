import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

// Compact disclaimer for calculator pages
export const Disclaimer = () => {
  return (
    <div className="flex items-start gap-2 text-xs text-amber-200/80 bg-amber-950/30 border border-amber-500/20 px-3 py-2 rounded-md mb-6">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
      <span>
        <strong>Not Financial Advice:</strong> This is financial software for informational purposes only. 
        Please consult a professional financial advisor before making any financial decisions.
      </span>
    </div>
  );
};

// Full disclaimer for footer and legal pages
export const FullDisclaimer = ({ className = '' }) => {
  return (
    <div className={`text-xs text-slate-500 leading-relaxed ${className}`}>
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500/70" />
        <p className="font-medium text-slate-400">Important Disclaimer</p>
      </div>
      <p className="mb-2">
        Financial Advisory Pro is <strong>financial software</strong> designed for informational and educational purposes only. 
        The calculators, tools, and content provided do not constitute financial, investment, tax, or legal advice.
      </p>
      <p className="mb-2">
        We strongly recommend that you consult with a <strong>qualified professional financial advisor</strong>, 
        tax consultant, or other appropriate professional before making any financial decisions based on 
        information obtained from this software.
      </p>
      <p>
        Financial Advisory Pro, its owners, and affiliates accept no responsibility or liability for any 
        loss or damage arising from the use of this software or reliance on its content.
      </p>
    </div>
  );
};

// Banner disclaimer for prominent display
export const DisclaimerBanner = () => {
  return (
    <div className="bg-amber-950/50 border-y border-amber-500/20 py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm text-amber-200/90">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
        <span>
          <strong>Disclaimer:</strong> Financial Advisory Pro is financial software, not financial advice. 
          Please consult a professional financial advisor for personalized guidance.
        </span>
      </div>
    </div>
  );
};
