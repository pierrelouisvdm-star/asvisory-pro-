import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { couponApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Check, Crown, Gift, Loader2, CreditCard, Mail, Phone,
  Calculator, Users, FileText, BarChart3, TrendingUp, Target, Calendar, PieChart
} from 'lucide-react';
import { toast } from 'sonner';

const PREMIUM_FEATURES = [
  { icon: Calculator, label: 'All 19 Financial Calculators' },
  { icon: Users, label: 'Unlimited Client Management' },
  { icon: FileText, label: 'PDF Report Generation' },
  { icon: BarChart3, label: 'Advanced Analysis Tools' },
  { icon: TrendingUp, label: 'Live Market Tracker' },
  { icon: Target, label: 'Goal Planner' },
  { icon: Calendar, label: 'Meeting Scheduler' },
  { icon: PieChart, label: 'Portfolio Tracker' },
];

// PayFast configuration
const PAYFAST_CONFIG = {
  merchantId: '10000100', // Sandbox - replace with real merchant ID in production
  merchantKey: '46f0cd694581a', // Sandbox - replace with real key in production
  passphrase: '', // Set your passphrase
  sandboxMode: true, // Set to false in production
};

const PREMIUM_PRICE = 299; // R299 per month

export const PricingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { refreshSubscription } = useSubscription();
  
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

    // Build PayFast payment form
    const paymentData = {
      merchant_id: PAYFAST_CONFIG.merchantId,
      merchant_key: PAYFAST_CONFIG.merchantKey,
      return_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/pricing`,
      notify_url: `${process.env.REACT_APP_BACKEND_URL}/api/payments/payfast-notify`,
      email_address: user?.email || '',
      m_payment_id: `AP-${Date.now()}`,
      amount: PREMIUM_PRICE.toFixed(2),
      item_name: 'AdvisoryPro Premium Monthly',
      item_description: 'Monthly premium subscription',
      subscription_type: '1', // 1 = subscription
      billing_date: new Date().getDate().toString(),
      recurring_amount: PREMIUM_PRICE.toFixed(2),
      frequency: '3', // 3 = Monthly
      cycles: '0', // 0 = indefinite
      custom_str1: user?.id || '',
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Crown className="h-3 w-3 mr-1" />
            Premium Access
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Get Premium Access
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Unlock all features for just R299/month. Cancel anytime.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-emerald-500/50 bg-gradient-to-b from-navy-900 to-navy-950 overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
            MONTHLY SUBSCRIPTION
          </div>
          
          <CardHeader className="text-center pt-10 pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-4">
              <Crown className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-white">Premium Plan</CardTitle>
            <div className="mt-4">
              <span className="text-5xl font-bold text-white">R{PREMIUM_PRICE}</span>
              <span className="text-slate-400 ml-2">/month</span>
            </div>
            <p className="text-emerald-400 text-sm mt-2">Cancel anytime</p>
          </CardHeader>

          <CardContent className="pb-8">
            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-sm text-slate-300">{label}</span>
                </div>
              ))}
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              {/* PayFast Button */}
              <Button 
                className="w-full h-14 text-lg btn-premium"
                onClick={handlePayFastPayment}
                disabled={paymentLoading}
                data-testid="payfast-payment-btn"
              >
                {paymentLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                Pay with PayFast
              </Button>
              
              <p className="text-center text-xs text-slate-500">
                Secure payment via PayFast • Cards, EFT, SnapScan & more
              </p>

              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-navy-700"></div>
                <span className="text-sm text-slate-500">or use a coupon</span>
                <div className="flex-1 h-px bg-navy-700"></div>
              </div>

              {/* Coupon Code */}
              <Card className="border-dashed border-2 border-emerald-500/30 bg-emerald-950/20">
                <CardContent className="pt-4 pb-4">
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
            </div>
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
