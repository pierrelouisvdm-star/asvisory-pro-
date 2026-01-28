import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionApi, couponApi } from '@/services/api';

const SubscriptionContext = createContext(null);

// Feature configuration by tier
const TIER_FEATURES = {
  free: {
    calculators: ['future_value', 'compound_interest', 'bond', 'car_finance'],
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

// Free calculators available to all
const FREE_CALCULATORS = ['/future-value', '/compound-interest', '/bond', '/car-finance'];

export const SubscriptionProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'free',
    status: 'active',
    features: TIER_FEATURES.free,
    loading: true,
  });

  const fetchSubscription = useCallback(async (forceRefresh = false) => {
    // Check token directly from localStorage for explicit refreshes
    // This handles the case where React state hasn't updated yet after registration
    const hasToken = forceRefresh 
      ? !!localStorage.getItem('advisorypro_token')
      : isAuthenticated;
    
    if (!hasToken) {
      setSubscription({
        tier: 'free',
        status: 'active',
        features: TIER_FEATURES.free,
        loading: false,
      });
      return;
    }

    try {
      const result = await subscriptionApi.getCurrentSubscription();
      const tier = result.tier || 'free';
      setSubscription({
        tier,
        status: result.status || 'active',
        features: TIER_FEATURES[tier] || TIER_FEATURES.free,
        billingCycle: result.billing_cycle,
        trialEndsAt: result.trial_ends_at,
        currentPeriodEnd: result.current_period_end,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      // Default to free tier on error
      setSubscription({
        tier: 'free',
        status: 'active',
        features: TIER_FEATURES.free,
        loading: false,
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if user has access to a specific feature
  const hasFeature = (featureName) => {
    const features = subscription.features || TIER_FEATURES.free;
    return !!features[featureName];
  };

  // Check if user can access a specific calculator
  const canAccessCalculator = (path) => {
    // Free calculators available to all
    if (FREE_CALCULATORS.includes(path)) return true;
    
    const tier = subscription.tier || 'free';
    const features = TIER_FEATURES[tier] || TIER_FEATURES.free;
    
    // If calculators is 'all', user has access to all
    if (features.calculators === 'all') return true;
    
    // Check if path is in allowed calculators
    const calcName = path.replace('/', '').replace(/-/g, '_');
    return Array.isArray(features.calculators) && features.calculators.includes(calcName);
  };

  // Check if user can add more clients
  const canAddMoreClients = (currentClientCount = 0) => {
    const maxClients = subscription.features?.maxClients ?? 0;
    if (maxClients === -1) return true; // Unlimited
    return currentClientCount < maxClients;
  };

  // Get client limit
  const getClientLimit = () => {
    return subscription.features?.maxClients ?? 0;
  };

  // Check subscription tier
  const isPremium = () => subscription.tier === 'premium';
  const isStandard = () => subscription.tier === 'standard';
  const isFree = () => subscription.tier === 'free';
  const isTrialing = () => subscription.status === 'trialing';

  // Redeem coupon code
  const redeemCoupon = async (code) => {
    try {
      const result = await couponApi.redeem(code);
      if (result.success) {
        await fetchSubscription(); // Refresh subscription
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      hasFeature,
      canAccessCalculator,
      canAddClient: canAddMoreClients,
      canAccessFeature: hasFeature,
      canAddMoreClients,
      getClientLimit,
      isPremium,
      isStandard,
      isFree,
      isTrialing,
      refreshSubscription: () => fetchSubscription(true),
      redeemCoupon,
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
