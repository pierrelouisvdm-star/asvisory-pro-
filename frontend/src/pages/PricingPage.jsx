import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi, couponApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Check, X, Calculator, Users, FileText, BarChart3, 
  Target, Calendar, PieChart, TrendingUp, Sparkles, Crown, Zap, PartyPopper, Gift, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const featureIcons = {
  calculators: Calculator,
  max_clients: Users,
  pdf_reports: FileText,
  advanced_tools: BarChart3,
  market_tracker: TrendingUp,
  goal_planner: Target,
  meeting_scheduler: Calendar,
  portfolio_tracker: PieChart,
};

const featureLabels = {
  calculators: 'Financial Calculators',
  max_clients: 'Client Management',
  pdf_reports: 'PDF Reports',
  advanced_tools: 'Advanced Tools',
  market_tracker: 'Live Market Tracker',
  goal_planner: 'Goal Planner',
  meeting_scheduler: 'Meeting Scheduler',
  portfolio_tracker: 'Portfolio Tracker',
};

const tierIcons = {
  free: Zap,
  standard: Sparkles,
  premium: Crown,
};

const tierColors = {
  free: 'border-slate-200 dark:border-slate-700',
  standard: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20',
  premium: 'border-emerald-300 dark:border-emerald-700 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/30',
};

export const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const { isAuthenticated } = useAuth();
  const [pricing, setPricing] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const data = await subscriptionApi.getPricing();
      setPricing(data);
    } catch (error) {
      toast.error('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    if (tier === 'free') {
      toast.info('You already have access to free features!');
      return;
    }

    setCheckoutLoading(tier);
    try {
      const billingCycle = isAnnual ? 'annual' : 'monthly';
      const result = await subscriptionApi.createCheckout(tier, billingCycle);
      window.location.href = result.checkout_url;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleStartTrial = async (tier) => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    setCheckoutLoading(tier);
    try {
      await subscriptionApi.startTrial(tier);
      toast.success('Free trial started!');
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getFeatureValue = (features, key) => {
    const value = features[key];
    if (typeof value === 'boolean') return value;
    if (value === 'all') return true;
    if (Array.isArray(value)) return `${value.length} tools`;
    if (value === -1) return 'Unlimited';
    if (value === 0) return false;
    return value;
  };

  const renderFeatureValue = (value) => {
    if (value === true) return <Check className="h-5 w-5 text-emerald-500" />;
    if (value === false) return <X className="h-5 w-5 text-slate-300" />;
    return <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" data-testid="pricing-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Message for New Users */}
        {isWelcome && (
          <Alert className="mb-8 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
            <PartyPopper className="h-5 w-5 text-emerald-600" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-300 ml-2">
              <span className="font-semibold">Welcome to AdvisoryPro!</span> Your account is ready. 
              Choose a plan below to get started, or continue with the free tier.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Pricing
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {isWelcome ? 'Select Your Plan' : 'Choose Your Plan'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Start free and upgrade as your practice grows. All plans include a {pricing?.trial_days}-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label className={cn("text-sm", !isAnnual && "font-semibold")}>Monthly</Label>
            <Switch 
              checked={isAnnual} 
              onCheckedChange={setIsAnnual}
              data-testid="billing-toggle"
            />
            <Label className={cn("text-sm", isAnnual && "font-semibold")}>
              Annual
              <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">Save 17%</Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pricing?.tiers.map((tier) => {
            const TierIcon = tierIcons[tier.tier];
            const price = isAnnual ? tier.annual_price : tier.monthly_price;
            const isPremium = tier.tier === 'premium';

            return (
              <Card 
                key={tier.tier} 
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-lg",
                  tierColors[tier.tier],
                  isPremium && "ring-2 ring-emerald-500"
                )}
              >
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      tier.tier === 'free' && "bg-slate-100 dark:bg-slate-800",
                      tier.tier === 'standard' && "bg-blue-100 dark:bg-blue-900/30",
                      tier.tier === 'premium' && "bg-emerald-100 dark:bg-emerald-900/30"
                    )}>
                      <TierIcon className={cn(
                        "h-5 w-5",
                        tier.tier === 'free' && "text-slate-600",
                        tier.tier === 'standard' && "text-blue-600",
                        tier.tier === 'premium' && "text-emerald-600"
                      )} />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {tier.description}
                  </p>
                </CardHeader>

                <CardContent className="pb-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                      R{price.toLocaleString()}
                    </span>
                    {tier.tier !== 'free' && (
                      <span className="text-slate-500 ml-1">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {Object.entries(featureLabels).map(([key, label]) => {
                      const Icon = featureIcons[key];
                      const value = getFeatureValue(tier.features, key);
                      const hasFeature = value !== false;

                      return (
                        <div 
                          key={key} 
                          className={cn(
                            "flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0",
                            !hasFeature && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{label}</span>
                          </div>
                          {renderFeatureValue(value)}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  {tier.tier === 'free' ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
                      data-testid="get-started-free"
                    >
                      {isAuthenticated ? (isWelcome ? 'Continue with Free' : 'Go to Dashboard') : 'Get Started Free'}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className={cn(
                          "w-full",
                          isPremium && "btn-premium"
                        )}
                        onClick={() => handleSubscribe(tier.tier)}
                        disabled={checkoutLoading === tier.tier}
                        data-testid={`subscribe-${tier.tier}`}
                      >
                        {checkoutLoading === tier.tier ? 'Processing...' : `Subscribe to ${tier.name}`}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleStartTrial(tier.tier)}
                        data-testid={`trial-${tier.tier}`}
                      >
                        Start {pricing?.trial_days}-day free trial
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            All plans include SSL encryption, automatic backups, and priority support.
          </p>
          <p className="text-sm text-slate-400">
            Questions? Contact us at support@advisorypro.co.za
          </p>
        </div>
      </div>
    </div>
  );
};
