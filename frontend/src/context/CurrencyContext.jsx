import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const currencies = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    locale: 'en-ZA',
  },
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('ZAR');

  const currentCurrency = currencies[currency];

  const formatCurrency = (value, options = {}) => {
    const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
    
    if (typeof value !== 'number' || isNaN(value)) {
      return `${currentCurrency.symbol}0.00`;
    }

    return new Intl.NumberFormat(currentCurrency.locale, {
      style: 'currency',
      currency: currentCurrency.code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  };

  const formatNumber = (value, options = {}) => {
    const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;
    
    if (typeof value !== 'number' || isNaN(value)) {
      return '0';
    }

    return new Intl.NumberFormat(currentCurrency.locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currentCurrency,
      formatCurrency,
      formatNumber,
      symbol: currentCurrency.symbol,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
