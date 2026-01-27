import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/services/api';

const SubscriptionContext = createContext(null);

// Free tier calculators
const FREE_CALCULATORS = [
  '/future-value',
  '/compound-interest',
  '/bond',
  '/car-finance'
];

// Feature definitions
const TIER_FEATURES = {
  free: {
    calculators: FREE_CALCULATORS,
    maxClients: 0,
    pdfReports: false,
    advancedTools: false,
    marketTracker: false,
    goalPlanner: false,
    meetingScheduler: false,
    portfolioTracker: false,
  },
  standard: {
    calculators: 'all',
    maxClients: 5,
    pdfReports: true,
    advancedTools: false,
    marketTracker: true,
    goalPlanner: false,
    meetingScheduler: false,
    portfolioTracker: false,
  },
  premium: {
    calculators: 'all',
    maxClients: -1, // unlimited
    pdfReports: true,
    advancedTools: true,
    marketTracker: true,
    goalPlanner: true,
    meetingScheduler: true,
    portfolioTracker: true,
  },
};

export const SubscriptionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'free',
    status: 'active',
    features: TIER_FEATURES.free,
    loading: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      setSubscription({
        tier: 'free',
        status: 'active',
        features: TIER_FEATURES.free,
        loading: false,
      });
    }
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    try {
      const data = await subscriptionApi.getCurrentSubscription();
      setSubscription({
        tier: data.tier,
        status: data.status,
        features: TIER_FEATURES[data.tier] || TIER_FEATURES.free,
        trialEndsAt: data.trial_ends_at,
        periodEnd: data.current_period_end,
        loading: false,
      });
    } catch (error) {
      // If error, default to free tier
      setSubscription({
        tier: 'free',
        status: 'active',
        features: TIER_FEATURES.free,
        loading: false,
      });
    }
  };

  const canAccessCalculator = (path) => {
    const { features } = subscription;
    if (features.calculators === 'all') return true;
    return FREE_CALCULATORS.includes(path);
  };

  const canAccessFeature = (feature) => {
    const { features } = subscription;
    return features[feature] === true || features[feature] === 'all' || features[feature] === -1;
  };

  const canAddMoreClients = (currentCount) => {
    const { features } = subscription;
    if (features.maxClients === -1) return true; // unlimited
    return currentCount < features.maxClients;
  };

  const getClientLimit = () => {
    const { features } = subscription;
    return features.maxClients;
  };

  const isPremium = () => subscription.tier === 'premium';
  const isStandard = () => subscription.tier === 'standard';
  const isFree = () => subscription.tier === 'free';
  const isTrialing = () => subscription.status === 'trialing';

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      canAccessCalculator,
      canAccessFeature,
      canAddMoreClients,
      getClientLimit,
      isPremium,
      isStandard,
      isFree,
      isTrialing,
      refreshSubscription: fetchSubscription,
      FREE_CALCULATORS,
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
