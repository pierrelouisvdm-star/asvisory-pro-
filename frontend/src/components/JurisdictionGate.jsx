import React, { useState } from 'react';
import { useJurisdiction } from '@/context/JurisdictionContext';

const GATE_STORAGE_KEY = 'advisorypro_jurisdiction_chosen';

export const JurisdictionGate = () => {
  const { switchJurisdiction } = useJurisdiction();
  const [chosen, setChosen] = useState(() => {
    try {
      return localStorage.getItem(GATE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (chosen) return null;

  const choose = (code) => {
    switchJurisdiction(code);
    try {
      localStorage.setItem(GATE_STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable; gate will just re-show next visit
    }
    setChosen(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070a0f]/95 backdrop-blur-sm px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
          Where are you based?
        </h1>
        <p className="text-slate-400 mb-8">
          We'll tailor calculators, tax rules and pricing to your country.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => choose('ZA')}
            data-testid="jurisdiction-gate-za"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-emerald-500/50 transition-colors"
          >
            <span className="text-5xl">🇿🇦</span>
            <span className="text-white font-semibold">South Africa</span>
          </button>
          <button
            onClick={() => choose('US')}
            data-testid="jurisdiction-gate-us"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-emerald-500/50 transition-colors"
          >
            <span className="text-5xl">🇺🇸</span>
            <span className="text-white font-semibold">United States</span>
          </button>
        </div>
      </div>
    </div>
  );
};
