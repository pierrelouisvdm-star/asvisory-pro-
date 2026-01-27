import React, { createContext, useContext, useState } from 'react';

const SubscriptionContext = createContext(null);

// All features unlocked for everyone (free access)
const FULL_ACCESS_FEATURES = {
  calculators: 'all',
  maxClients: -1, // unlimited
  pdfReports: true,
  advancedTools: true,
  marketTracker: true,
  goalPlanner: true,
  meetingScheduler: true,
  portfolioTracker: true,
};

export const SubscriptionProvider = ({ children }) => {
  // Everyone gets full premium access for free
  const [subscription] = useState({
    tier: 'premium',
    status: 'active',
    features: FULL_ACCESS_FEATURES,
    loading: false,
  });

  // All features always accessible
  const hasFeature = () => true;
  const canAccessCalculator = () => true;
  const canAddClient = () => true;
  const canAccessFeature = () => true;
  const canAddMoreClients = () => true;
  const getClientLimit = () => -1;
  const isPremium = () => true;
  const isStandard = () => false;
  const isFree = () => false;
  const isTrialing = () => false;

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      hasFeature,
      canAccessCalculator,
      canAddClient,
      canAccessFeature,
      canAddMoreClients,
      getClientLimit,
      isPremium,
      isStandard,
      isFree,
      isTrialing,
      refreshSubscription: () => {},
      FREE_CALCULATORS: [],
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
