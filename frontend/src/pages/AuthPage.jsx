import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, Mail, Lock, User, Building2, ArrowRight, AlertCircle, 
  Check, Crown, Ticket, Sparkles, Users, FileText, TrendingUp, Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { couponApi } from '@/services/api';

const tiers = [
  {
    name: 'Free',
    price: 'R0',
    period: '/month',
    description: 'Get started with basic tools',
    features: [
      '4 Basic Calculators',
      'Future Value & Compound Interest',
      'Bond & Car Finance',
    ],
    highlight: false,
  },
  {
    name: 'Standard',
    price: 'R49',
    period: '/month',
    description: 'For growing advisors',
    features: [
      'All 17 Calculators',
      '5 Client Profiles',
      'PDF Reports',
      'Live Market Tracker',
    ],
    highlight: false,
  },
  {
    name: 'Premium',
    price: 'R149',
    period: '/month',
    description: 'Full professional suite',
    features: [
      'Everything in Standard',
      'Unlimited Clients',
      'AI Assistant',
      'Advanced Tools',
      'Priority Support',
    ],
    highlight: true,
  },
];

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, isAuthenticated } = useAuth();
  const { refreshSubscription } = useSubscription();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true for convenience

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerCompany, setRegisterCompany] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await login(loginEmail, loginPassword, rememberMe);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register(registerEmail, registerPassword, registerName, registerCompany);
      toast.success('Account created! Welcome to AdvisoryPro.');
      
      // If coupon was validated, try to redeem it after registration
      if (couponResult?.valid && couponCode) {
        try {
          await couponApi.redeem(couponCode);
          toast.success('Coupon redeemed! You now have Premium access.');
          // Refresh subscription to update the context with new tier
          await refreshSubscription();
        } catch (couponErr) {
          console.error('Coupon redemption error:', couponErr);
          toast.info('You can redeem your coupon from the Pricing page.');
        }
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const result = await couponApi.validate(couponCode.trim().toUpperCase());
      setCouponResult(result);
      if (result.valid) {
        toast.success(`Valid coupon! ${result.description}`);
      } else {
        toast.error(result.message || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponResult({ valid: false, message: 'Invalid coupon code' });
      toast.error('Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <span className="text-navy-950 font-bold text-xl">A</span>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              AdvisoryPro
            </span>
          </div>
          <p className="text-slate-400">
            Professional Financial Advisor Suite
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Auth Form */}
          <div>
            <Card className="border-navy-700 bg-navy-900/60 shadow-lg">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-xl text-white">Welcome</CardTitle>
                <CardDescription className="text-slate-400">Sign in or create an account to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-navy-800">
                    <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab">Create Account</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="advisor@company.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10"
                            required
                            data-testid="login-email-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10"
                            required
                            data-testid="login-password-input"
                          />
                        </div>
                      </div>

                      {/* Remember Me Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="remember-me"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-navy-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-navy-900"
                          data-testid="remember-me-checkbox"
                        />
                        <Label htmlFor="remember-me" className="text-sm text-slate-400 cursor-pointer">
                          Remember me for 30 days
                        </Label>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}

                      <Button 
                        type="button"
                        onClick={handleLogin}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold" 
                        disabled={isLoading}
                        data-testid="login-submit-btn"
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Register Tab */}
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="John Smith"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            className="pl-10"
                            required
                            data-testid="register-name-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="advisor@company.com"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            className="pl-10"
                            required
                            data-testid="register-email-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-company">Company (Optional)</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="register-company"
                            type="text"
                            placeholder="ABC Financial Services"
                            value={registerCompany}
                            onChange={(e) => setRegisterCompany(e.target.value)}
                            className="pl-10"
                            data-testid="register-company-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="••••••••"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pl-10"
                            required
                            minLength={6}
                            data-testid="register-password-input"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold" 
                        disabled={isLoading}
                        data-testid="register-submit-btn"
                      >
                        {isLoading ? 'Creating account...' : 'Create Free Account'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Coupon Code Section */}
                <div className="mt-6 pt-6 border-t border-navy-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="h-4 w-4 text-amber-400" />
                    <Label className="text-amber-400 font-medium">Have a coupon code?</Label>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponResult(null);
                        }}
                        className="uppercase"
                        data-testid="coupon-input"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateCoupon}
                      disabled={couponLoading}
                      className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      data-testid="validate-coupon-btn"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </Button>
                  </div>
                  {couponResult && (
                    <div className={`mt-2 text-sm flex items-center gap-2 ${couponResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {couponResult.valid ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>{couponResult.description} - Will be applied on registration!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span>{couponResult.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-slate-500 mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Right Side - Pricing Tiers */}
          <div className="space-y-4">
            <div className="text-center lg:text-left mb-4">
              <h2 className="text-xl font-display font-bold text-white mb-1">Choose Your Plan</h2>
              <p className="text-slate-400 text-sm">Start free, upgrade anytime</p>
            </div>

            {tiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`border-navy-700 bg-navy-900/40 relative overflow-hidden ${
                  tier.highlight ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : ''
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-emerald-500 text-navy-950 font-semibold">
                      <Crown className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-white">{tier.name}</h3>
                        {tier.name === 'Premium' && <Sparkles className="h-4 w-4 text-amber-400" />}
                      </div>
                      <p className="text-slate-400 text-xs mb-3">{tier.description}</p>
                      <ul className="space-y-1.5">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-white">{tier.price}</span>
                        <span className="text-slate-400 text-sm">{tier.period}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Features Highlight */}
            <Card className="border-navy-700 bg-gradient-to-br from-emerald-900/20 to-navy-900/40">
              <CardContent className="p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Premium Features Include
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calculator className="h-3.5 w-3.5 text-emerald-400" />
                    17 Calculators
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    Unlimited Clients
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    PDF Reports
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    Live Market Data
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Bot className="h-3.5 w-3.5 text-emerald-400" />
                    AI Assistant
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Crown className="h-3.5 w-3.5 text-emerald-400" />
                    Priority Support
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
