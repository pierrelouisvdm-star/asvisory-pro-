import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionApi, couponApi } from '@/services/api';

const SubscriptionContext = createContext(null);

// Free tier has limited calculators
const TIER_FEATURES = {
  free: {
    calculators: ['tfsa-calculator', 'bond', 'future-value', 'compound-interest'],
    maxClients: 3,
    pdfReports: false,
    advancedTools: false,
    marketTracker: false,
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

// Free calculators available without subscription
const FREE_CALCULATORS = ['tfsa-calculator', 'bond', 'future-value', 'compound-interest'];

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
    if (subscription.tier === 'premium') return true;
    return subscription.features[featureName] || false;
  };

  // Check if user can access a specific calculator
  const canAccessCalculator = (path) => {
    // Clean the path
    const cleanPath = path.replace(/^\//, '');
    
    // Premium users have access to all
    if (subscription.tier === 'premium') return true;
    
    // Admin users have access to all
    if (user?.is_admin) return true;
    
    // Check if calculator is in free tier
    return FREE_CALCULATORS.includes(cleanPath);
  };

  // Check if user can add more clients
  const canAddMoreClients = (currentClientCount = 0) => {
    if (subscription.tier === 'premium') return true;
    const limit = subscription.features.maxClients;
    return limit === -1 || currentClientCount < limit;
  };

  // Get client limit
  const getClientLimit = () => {
    return subscription.features.maxClients;
  };

  // Check subscription tier
  const isPremium = () => subscription.tier === 'premium';
  const isFree = () => subscription.tier === 'free';
  const isTrialing = () => subscription.status === 'trialing';

  // Redeem coupon code
  const redeemCoupon = async (code) => {
    try {
      const result = await couponApi.redeem(code);
      if (result.success) {
        await fetchSubscription(true);
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
