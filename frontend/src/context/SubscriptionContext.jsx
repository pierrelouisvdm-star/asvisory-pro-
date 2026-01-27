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

  return (
    <SubscriptionContext.Provider value={{
      ...subscription,
      hasFeature,
      canAccessCalculator,
      canAddClient,
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
