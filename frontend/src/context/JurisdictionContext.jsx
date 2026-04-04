import React, { createContext, useContext, useState, useEffect } from 'react';

const JurisdictionContext = createContext();

export const jurisdictions = {
  ZA: { 
    code: 'ZA', 
    name: 'South Africa', 
    flag: '🇿🇦', 
    currency: 'ZAR',
    currencySymbol: 'R',
    available: true,
    taxYear: '2026/2027',
  },
  US: { 
    code: 'US', 
    name: 'United States', 
    flag: '🇺🇸', 
    currency: 'USD',
    currencySymbol: '$',
    available: true,
    taxYear: '2024/2025',
  },
  CA: { 
    code: 'CA', 
    name: 'Canada', 
    flag: '🇨🇦', 
    currency: 'CAD',
    currencySymbol: 'C$',
    available: false,
  },
  UK: { 
    code: 'UK', 
    name: 'United Kingdom', 
    flag: '🇬🇧', 
    currency: 'GBP',
    currencySymbol: '£',
    available: false,
  },
  AU: { 
    code: 'AU', 
    name: 'Australia', 
    flag: '🇦🇺', 
    currency: 'AUD',
    currencySymbol: 'A$',
    available: false,
  },
};

export const JurisdictionProvider = ({ children }) => {
  const [jurisdiction, setJurisdiction] = useState(() => {
    const saved = localStorage.getItem('jurisdiction');
    return saved && jurisdictions[saved]?.available ? saved : 'ZA';
  });

  useEffect(() => {
    localStorage.setItem('jurisdiction', jurisdiction);
  }, [jurisdiction]);

  const currentJurisdiction = jurisdictions[jurisdiction];
  
  const switchJurisdiction = (code) => {
    if (jurisdictions[code]?.available) {
      setJurisdiction(code);
    }
  };

  const isUS = jurisdiction === 'US';
  const isZA = jurisdiction === 'ZA';

  return (
    <JurisdictionContext.Provider value={{
      jurisdiction,
      currentJurisdiction,
      switchJurisdiction,
      isUS,
      isZA,
      jurisdictions: Object.values(jurisdictions),
    }}>
      {children}
    </JurisdictionContext.Provider>
  );
};

export const useJurisdiction = () => {
  const context = useContext(JurisdictionContext);
  if (!context) {
    throw new Error('useJurisdiction must be used within a JurisdictionProvider');
  }
  return context;
};
