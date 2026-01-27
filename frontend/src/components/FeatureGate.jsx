import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FeatureGate = ({ 
  feature, 
  requiredTier = 'standard',
  children, 
  fallback = null,
  showUpgradePrompt = true 
}) => {
  const { canAccessFeature, subscription } = useSubscription();

  if (canAccessFeature(feature)) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-700">
      <CardContent className="py-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <Lock className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">
          {requiredTier === 'premium' ? 'Premium Feature' : 'Standard Feature'}
        </h3>
        <p className="text-slate-500 mb-4">
          Upgrade to {requiredTier} to unlock this feature
        </p>
        <Link to="/pricing">
          <Button className="btn-premium">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export const CalculatorGate = ({ path, children }) => {
  const { canAccessCalculator, isFree } = useSubscription();

  if (canAccessCalculator(path)) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <Badge className="mb-4 bg-amber-100 text-amber-700">
            Premium Calculator
          </Badge>
          <h2 className="font-display text-2xl font-bold mb-2">
            Upgrade Required
          </h2>
          <p className="text-slate-500 mb-6">
            This calculator is available on Standard and Premium plans. 
            Upgrade to access all 15 professional financial calculators.
          </p>
          <div className="space-y-3">
            <Link to="/pricing">
              <Button className="w-full btn-premium">
                <Sparkles className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const LockedOverlay = ({ message = "Upgrade to unlock" }) => (
  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
    <div className="text-center">
      <Lock className="h-8 w-8 mx-auto text-slate-400 mb-2" />
      <p className="text-sm text-slate-500">{message}</p>
      <Link to="/pricing">
        <Button size="sm" className="mt-2">
          Upgrade
        </Button>
      </Link>
    </div>
  </div>
);

export const UpgradeBadge = ({ tier = 'standard' }) => (
  <Badge className={cn(
    "text-xs",
    tier === 'premium' 
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  )}>
    {tier === 'premium' ? (
      <><Crown className="h-3 w-3 mr-1" /> Premium</>
    ) : (
      <><Sparkles className="h-3 w-3 mr-1" /> Standard</>
    )}
  </Badge>
);
