import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { couponApi, API_URL } from '@/services/api';
import { AdvisoryProLogo } from '@/components/AdvisoryProLogo';

const tiers = [
  {
    name: 'Free',
    price: 'R0',
    period: '/forever',
    description: 'Get started today',
    features: [
      'TFSA Calculator',
      'Bond/Mortgage Calculator',
      'Future Value Calculator',
      'Compound Interest Calculator',
    ],
    highlight: false,
  },
  {
    name: 'Premium',
    price: 'R299',
    annualPrice: 'R1,299',
    period: '/month',
    annualPeriod: '/year',
    annualSavings: 'Save R2,289',
    description: 'Full professional suite',
    features: [
      'All 20 Financial Calculators',
      'Tax Planning Hub (2026/27)',
      'Weekly Market Updates by Analysts',
      'Tips from Certified Financial Planners',
      'Income & Expense Tracker',
      'PDF Reports & AI Assistant',
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
  const [registerRole, setRegisterRole] = useState(null); // 'individual' | 'advisor'

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
    if (!registerRole) {
      setError('Please choose Individual or Financial Advisor');
      toast.error('Please choose Individual or Financial Advisor');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const registerData = await register(registerEmail, registerPassword, registerName, registerCompany, registerRole);
      toast.success('Account created! Welcome to Financial Advisory Pro.');
      
      // If coupon was validated, try to redeem it after registration
      if (couponResult?.valid && couponCode) {
        try {
          // Use the token directly from registration response
          const token = registerData.access_token;
          const response = await fetch(`${API_URL}/api/coupons/redeem`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code: couponCode })
          });
          
          if (response.ok) {
            toast.success('Coupon redeemed! You now have Premium access.');
            // Refresh subscription to update the context with new tier
            await refreshSubscription();
          } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Coupon redemption failed');
          }
        } catch (couponErr) {
          console.error('Coupon redemption error:', couponErr);
          toast.error(`Coupon error: ${couponErr.message}`);
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
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AdvisoryProLogo size="large" className="text-white" />
          </div>
          <p className="text-muted-foreground">
            Professional Financial Advisor Suite
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Auth Form */}
          <div>
            <Card className="border-border bg-card shadow-lg">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-xl text-foreground">Welcome</CardTitle>
                <CardDescription className="text-muted-foreground">Sign in or create an account to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                    <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab">Create Account</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                      {/* Remember Me and Forgot Password */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="remember-me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-background"
                            data-testid="remember-me-checkbox"
                          />
                          <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                            Remember me for 30 days
                          </Label>
                        </div>
                        <Link
                          to="/request-password-reset"
                          className="text-sm text-primary hover:text-primary/80 transition-colors"
                          data-testid="forgot-password-link"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}

                      <Button 
                        type="button"
                        onClick={handleLogin}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
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
                      {/* Role Picker - locked in once chosen */}
                      <div className="space-y-2">
                        <Label>I am a... <span className="text-destructive">*</span></Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            data-testid="register-role-individual"
                            onClick={() => setRegisterRole('individual')}
                            className={`p-3 rounded-md border-2 text-left transition-all ${
                              registerRole === 'individual'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border bg-muted/30 hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium text-foreground text-sm">Individual</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Manage my own money</p>
                          </button>
                          <button
                            type="button"
                            data-testid="register-role-advisor"
                            onClick={() => setRegisterRole('advisor')}
                            className={`p-3 rounded-md border-2 text-left transition-all ${
                              registerRole === 'advisor'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border bg-muted/30 hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium text-foreground text-sm">Financial Advisor</span>
                            </div>
                            <p className="text-xs text-muted-foreground">AI copilot for my practice</p>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                        disabled={isLoading}
                        data-testid="register-submit-btn"
                      >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Coupon Code Section */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="h-4 w-4 text-amber-500" />
                    <Label className="text-amber-600 font-medium">Have a coupon code?</Label>
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
                      className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      data-testid="validate-coupon-btn"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </Button>
                  </div>
                  {couponResult && (
                    <div className={`mt-2 text-sm flex items-center gap-2 ${couponResult.valid ? 'text-emerald-600' : 'text-destructive'}`}>
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

            <p className="text-center text-sm text-muted-foreground mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Right Side - Pricing Tiers */}
          <div className="space-y-4">
            <div className="text-center lg:text-left mb-4">
              <h2 className="text-xl font-display font-bold text-foreground mb-1">Premium Plan</h2>
              <p className="text-muted-foreground text-sm">
                R299/month or <span className="text-emerald-500 font-medium">R1,499/year</span> (Save R2,089!)
              </p>
            </div>

            {tiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`border-border bg-card relative overflow-hidden ${
                  tier.highlight ? 'border-primary/50 ring-1 ring-primary/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-foreground">{tier.name}</h3>
                        {tier.name === 'Premium' && <Sparkles className="h-4 w-4 text-amber-500" />}
                      </div>
                      <p className="text-muted-foreground text-xs mb-3">{tier.description}</p>
                      <ul className="space-y-1.5">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                        <span className="text-muted-foreground text-sm">{tier.period}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Features Highlight */}
            <Card className="border-border bg-gradient-to-br from-primary/5 to-card">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Premium Features Include
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    20 Calculators
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    PDF Reports
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Live Market Data
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    AI Assistant
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Crown className="h-3.5 w-3.5 text-primary" />
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
