import React, { createContext, useContext, useState, useEffect } from 'react';
import { marketApi } from '@/services/api';

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
  const [exchangeRate, setExchangeRate] = useState(18.5); // Default USD/ZAR rate

  // Fetch current exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const data = await marketApi.getData();
        const usdZar = data.currencies?.find(c => c.pair === 'USD/ZAR');
        if (usdZar && usdZar.rate) {
          setExchangeRate(usdZar.rate);
        }
      } catch (err) {
        console.log('Using default exchange rate');
      }
    };
    fetchExchangeRate();
  }, []);

  const currentCurrency = currencies[currency];

  // Convert value from ZAR to selected currency
  const convertFromZAR = (zarValue) => {
    if (typeof zarValue !== 'number' || isNaN(zarValue)) return 0;
    if (currency === 'ZAR') return zarValue;
    // Convert ZAR to USD
    return zarValue / exchangeRate;
  };

  // Convert value from USD to selected currency
  const convertFromUSD = (usdValue) => {
    if (typeof usdValue !== 'number' || isNaN(usdValue)) return 0;
    if (currency === 'USD') return usdValue;
    // Convert USD to ZAR
    return usdValue * exchangeRate;
  };

  // Convert any value to display currency (assumes input is in ZAR)
  const convert = (value, fromCurrency = 'ZAR') => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    if (fromCurrency === currency) return value;
    
    if (fromCurrency === 'ZAR' && currency === 'USD') {
      return value / exchangeRate;
    }
    if (fromCurrency === 'USD' && currency === 'ZAR') {
      return value * exchangeRate;
    }
    return value;
  };

  const formatCurrency = (value, options = {}) => {
    const { minimumFractionDigits = 2, maximumFractionDigits = 2, fromCurrency = 'ZAR' } = options;
    
    const convertedValue = convert(value, fromCurrency);
    
    if (typeof convertedValue !== 'number' || isNaN(convertedValue)) {
      return `${currentCurrency.symbol}0.00`;
    }

    return new Intl.NumberFormat(currentCurrency.locale, {
      style: 'currency',
      currency: currentCurrency.code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(convertedValue);
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
      convert,
      convertFromZAR,
      convertFromUSD,
      exchangeRate,
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
