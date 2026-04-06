import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useJurisdiction } from '@/context/JurisdictionContext';
import { couponApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Check, Crown, Gift, Loader2, CreditCard, Mail, Phone,
  Calculator, Users, FileText, BarChart3, TrendingUp, Target, Calendar, PieChart,
  Receipt, Wallet, Bot, Award, Flame, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

const PREMIUM_FEATURES = [
  { icon: Calculator, label: 'All 20 Financial Calculators' },
  { icon: Receipt, label: 'Tax Planning Hub (2026/27)' },
  { icon: TrendingUp, label: 'Weekly Market Updates by Analysts' },
  { icon: Award, label: 'Tips from Certified Financial Planners' },
  { icon: Wallet, label: 'Income & Expense Tracker' },
  { icon: FileText, label: 'PDF Report Generation' },
  { icon: Bot, label: 'AI Financial Assistant' },
];

const US_PREMIUM_FEATURES = [
  { icon: Calculator, label: 'All 30+ US Financial Calculators' },
  { icon: Receipt, label: 'US Tax Suite (Federal + All 50 States)' },
  { icon: Flame, label: 'FIRE, RMD, Roth Conversion, Paycheck' },
  { icon: DollarSign, label: 'RSU, AMT & Capital Gains Tax' },
  { icon: Wallet, label: 'Home Affordability & Rent vs Buy' },
  { icon: FileText, label: 'PDF Report Generation' },
  { icon: Bot, label: 'AI Financial Assistant' },
];

// PayFast configuration
const PAYFAST_CONFIG = {
  merchantId: '10000100', // Sandbox - replace with real merchant ID in production
  merchantKey: '46f0cd694581a', // Sandbox - replace with real key in production
  passphrase: '', // Set your passphrase
  sandboxMode: true, // Set to false in production
};

const PREMIUM_PRICE = 299;
const ANNUAL_PRICE = 1999;
const ANNUAL_SAVINGS = (PREMIUM_PRICE * 12) - ANNUAL_PRICE; // R1999 vs R3588 = R1589 savings

export const PricingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const { isUS } = useJurisdiction();
  
  // Billing period toggle
  const [billingPeriod, setBillingPeriod] = useState('annual'); // 'monthly' or 'annual'
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  
  // PayFast state
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleRedeemCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to redeem a coupon');
      navigate('/auth?redirect=/pricing');
      return;
    }

    setCouponLoading(true);
    try {
      const result = await couponApi.redeem(couponCode.trim());
      toast.success(result.message);
      setCouponCode('');
      await refreshSubscription();
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayFastPayment = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to make a payment');
      navigate('/auth?redirect=/pricing');
      return;
    }

    setPaymentLoading(true);
    
    const isAnnual = billingPeriod === 'annual';
    const paymentAmount = isAnnual ? ANNUAL_PRICE : PREMIUM_PRICE;

    // Build PayFast payment form
    const paymentData = {
      merchant_id: PAYFAST_CONFIG.merchantId,
      merchant_key: PAYFAST_CONFIG.merchantKey,
      return_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/pricing`,
      notify_url: `${process.env.REACT_APP_BACKEND_URL}/api/payments/payfast-notify`,
      email_address: user?.email || '',
      m_payment_id: `AP-${Date.now()}`,
      amount: paymentAmount.toFixed(2),
      item_name: isAnnual ? 'Financial Advisory Pro Premium Annual' : 'Financial Advisory Pro Premium Monthly',
      item_description: isAnnual ? 'Annual premium subscription' : 'Monthly premium subscription',
      subscription_type: '1', // 1 = subscription
      billing_date: new Date().getDate().toString(),
      recurring_amount: paymentAmount.toFixed(2),
      frequency: isAnnual ? '6' : '3', // 6 = Yearly, 3 = Monthly
      cycles: '0', // 0 = indefinite
      custom_str1: user?.id || '',
      custom_str2: billingPeriod,
    };

    // Create and submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAYFAST_CONFIG.sandboxMode 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    Object.entries(paymentData).forEach(([key, value]) => {
      if (value) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-navy-950" data-testid="pricing-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Crown className="h-3 w-3 mr-1" />
            Simple Pricing
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Start free with essential calculators, or unlock everything with Premium.
          </p>
        </div>

        {/* Billing Toggle — SA only */}
        {!isUS && (
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingPeriod === 'monthly' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              billingPeriod === 'annual' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-amber-500 text-xs text-black px-1.5 py-0.5 rounded-full font-bold">
              Save R{ANNUAL_SAVINGS}
            </span>
          </button>
        </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Free Tier */}
          <Card className="border-slate-700 bg-gradient-to-b from-navy-900 to-navy-950">
            <CardHeader className="text-center pt-8 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 mx-auto mb-4">
                <Calculator className="h-8 w-8 text-slate-300" />
              </div>
              <CardTitle className="text-2xl text-white">Free Plan</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-white">{isUS ? '$0' : 'R0'}</span>
                <span className="text-slate-400 ml-2">/forever</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">Get started today</p>
            </CardHeader>

            <CardContent className="pb-8">
              <div className="space-y-3 mb-8">
                {(isUS ? [
                  { label: 'FI Score Quiz', included: true },
                  { label: 'US Tax Calendar', included: true },
                  { label: 'Mortgage Calculator', included: true },
                  { label: 'Compound Interest Calculator', included: true },
                  { label: '26+ Premium US Calculators', included: false },
                  { label: 'PDF Reports', included: false },
                  { label: 'AI Financial Assistant', included: false },
                ] : [
                  { label: 'TFSA Calculator', included: true },
                  { label: 'Bond/Mortgage Calculator', included: true },
                  { label: 'Future Value Calculator', included: true },
                  { label: 'Compound Interest Calculator', included: true },
                  { label: '15+ Premium Calculators', included: false },
                  { label: 'PDF Reports', included: false },
                  { label: 'AI Document Analysis', included: false },
                ]).map(({ label, included }) => (
                  <div key={label} className="flex items-center gap-3 p-2">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${included ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
                      <Check className={`h-3 w-3 ${included ? 'text-emerald-500' : 'text-slate-500'}`} />
                    </div>
                    <span className={`text-sm ${included ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline"
                className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card className="border-emerald-500/50 bg-gradient-to-b from-navy-900 to-navy-950 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
              {isUS ? 'BEST VALUE' : 'RECOMMENDED'}
            </div>
            
            <CardHeader className="text-center pt-8 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-4">
                <Crown className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-white">Premium Plan</CardTitle>
              <div className="mt-4">
                {isUS ? (
                  <>
                    {billingPeriod === 'annual' ? (
                      <>
                        <div className="inline-block bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-1 text-xs font-semibold text-amber-400 mb-2">
                          LIMITED TIME OFFER
                        </div>
                        <div>
                          <span className="text-5xl font-bold text-white">$99</span>
                          <span className="text-slate-400 ml-2">one-time</span>
                        </div>
                        <p className="text-emerald-400 text-sm mt-2">
                          Full year access · Normally $149
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-bold text-white">$19</span>
                        <span className="text-slate-400 ml-2">/month</span>
                        <p className="text-emerald-400 text-sm mt-2">Cancel anytime</p>
                      </>
                    )}
                    <div className="flex justify-center gap-2 mt-3">
                      <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${billingPeriod === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingPeriod('annual')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors relative ${billingPeriod === 'annual' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        Annual ($99) 🔥
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {billingPeriod === 'annual' ? (
                      <>
                        <span className="text-5xl font-bold text-white">R{ANNUAL_PRICE}</span>
                        <span className="text-slate-400 ml-2">/year</span>
                        <p className="text-emerald-400 text-sm mt-2">
                          Only R{Math.round(ANNUAL_PRICE / 12)}/month • Save R{ANNUAL_SAVINGS}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-bold text-white">R{PREMIUM_PRICE}</span>
                        <span className="text-slate-400 ml-2">/month</span>
                        <p className="text-emerald-400 text-sm mt-2">Cancel anytime</p>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="pb-8">
              {/* Features Grid */}
              <div className="space-y-3 mb-8">
                {(isUS ? US_PREMIUM_FEATURES : PREMIUM_FEATURES).map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 p-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                ))}
              </div>

              {/* Payment Button */}
              {isUS ? (
                <Button 
                  className="w-full h-12 text-lg btn-premium"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth?redirect=/pricing')}
                  data-testid="us-payment-btn"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {billingPeriod === 'annual' ? 'Get Annual Access — $99' : 'Get Monthly Access — $19/mo'}
                </Button>
              ) : (
                <Button 
                  className="w-full h-12 text-lg btn-premium"
                  onClick={handlePayFastPayment}
                  disabled={paymentLoading}
                  data-testid="payfast-payment-btn"
                >
                  {paymentLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  Subscribe with PayFast
                </Button>
              )}
              
              <p className="text-center text-xs text-slate-500 mt-3">
                {isUS ? 'Secure checkout • Cancel or upgrade anytime' : 'Secure payment via PayFast • Cards, EFT, SnapScan & more'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coupon Section */}
        <Card className="border-dashed border-2 border-emerald-500/30 bg-emerald-950/20 max-w-md mx-auto">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-5 w-5 text-emerald-500" />
              <span className="font-medium text-white">Have a coupon code?</span>
            </div>
            <form onSubmit={handleRedeemCoupon} className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. ADVPRO-XXXXX)"
                className="flex-1 uppercase bg-navy-800 border-navy-700"
                data-testid="coupon-input"
              />
              <Button 
                type="submit" 
                disabled={couponLoading || !couponCode.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="redeem-coupon-btn"
              >
                {couponLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Redeem'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bulk Licensing */}
        <div className="mt-8 text-center">
          <Card className="inline-block border-navy-700 bg-navy-900/50">
            <CardContent className="py-4 px-6">
              <div className="flex items-center gap-3 text-slate-400">
                <Users className="h-5 w-5" />
                <span className="text-sm">
                  Need licenses for your team?{' '}
                  <a 
                    href="mailto:bulk@advisorypro.co.za?subject=Bulk%20Licensing%20Inquiry" 
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Contact us for bulk licensing
                  </a>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-slate-400 text-sm">
            Questions about payment or features?
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <a href="mailto:support@advisorypro.co.za" className="flex items-center gap-2 hover:text-emerald-400">
              <Mail className="h-4 w-4" />
              support@advisorypro.co.za
            </a>
            <a href="tel:+27123456789" className="flex items-center gap-2 hover:text-emerald-400">
              <Phone className="h-4 w-4" />
              +27 12 345 6789
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
