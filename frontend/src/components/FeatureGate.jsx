import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FeatureGate = ({ 
  feature, 
  requiredTier = 'premium',
  children, 
  fallback = null,
  showUpgradePrompt = true 
}) => {
  const { hasFeature, isPremium } = useSubscription();
  
  if (isPremium() || hasFeature(feature)) {
    return children;
  }
  
  if (fallback) return fallback;
  
  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} />;
  }
  
  return null;
};

export const CalculatorGate = ({ path, children }) => {
  const { canAccessCalculator, isPremium } = useSubscription();
  
  // Check if user can access this calculator
  if (canAccessCalculator(path)) {
    return children;
  }
  
  // Show upgrade prompt for gated calculators
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Premium Feature</h2>
          <p className="text-slate-400 mb-6">
            This calculator is available with a Premium subscription. Upgrade to unlock all 19+ financial calculators and tools.
          </p>
          
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-white mb-3">Premium includes:</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                All 19+ financial calculators
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Unlimited client management
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                PDF report generation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                AI-powered document analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Tax planning hub & more
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link to="/pricing" className="block">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium - R249/month
              </Button>
            </Link>
            <Link to="/dashboard" className="block">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UpgradePrompt = ({ feature }) => (
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
    <CardContent className="p-6 text-center">
      <Lock className="h-8 w-8 mx-auto text-amber-400 mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">Premium Feature</h3>
      <p className="text-sm text-slate-400 mb-4">
        Upgrade to access {feature} and all premium features.
      </p>
      <Link to="/pricing">
        <Button className="bg-amber-500 hover:bg-amber-600">
          Upgrade Now
        </Button>
      </Link>
    </CardContent>
  </Card>
);

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

export const UpgradeBadge = ({ tier = 'premium' }) => (
  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
    <Crown className="h-3 w-3 mr-1" /> Premium
  </Badge>
);

export const FreeBadge = () => (
  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
    <CheckCircle className="h-3 w-3 mr-1" /> Free
  </Badge>
);
