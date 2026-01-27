import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, PieChart, FileText, CheckCircle2, ArrowRight,
  Sparkles, Crown, Zap, Award, Briefcase, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Calculator,
    title: '15+ Financial Calculators',
    description: 'Comprehensive tools for investments, insurance, retirement, tax, and more.',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage your clients, track their financial data, and monitor progress.',
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
  },
  {
    icon: BarChart3,
    title: 'Financial Analysis',
    description: 'Identify shortfalls and get actionable recommendations for each client.',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
  },
  {
    icon: TrendingUp,
    title: 'Live Market Tracker',
    description: 'Real-time data on indices, Gold, Silver, Bitcoin, and currency pairs.',
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
  },
  {
    icon: Bot,
    title: 'AI Financial Advisor',
    description: 'GPT-5.2 powered chatbot for personalized financial guidance.',
    color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30'
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    description: 'Generate professional reports for your clients with one click.',
    color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30'
  },
];

const tiers = [
  {
    name: 'Free',
    price: 'R0',
    icon: Zap,
    description: '4 basic calculators to get started',
    features: ['Future Value Calculator', 'Compound Interest', 'Bond Calculator', 'Car Finance'],
    color: 'border-slate-200'
  },
  {
    name: 'Standard',
    price: 'R49',
    period: '/month',
    icon: Sparkles,
    description: 'Full calculator suite for growing practices',
    features: ['All 15 calculators', 'Up to 5 clients', 'Live market tracker', 'PDF reports'],
    color: 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20'
  },
  {
    name: 'Premium',
    price: 'R149',
    period: '/month',
    icon: Crown,
    description: 'Complete toolkit for established advisors',
    features: ['Everything in Standard', 'Unlimited clients', 'AI Financial Advisor', 'Advanced analytics'],
    popular: true,
    color: 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              The #1 Financial Advisor Platform in South Africa
            </Badge>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Empower Your Practice with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                AdvisoryPro
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
              Professional financial calculators, client management, AI-powered insights, 
              and live market data — everything you need to deliver exceptional advice.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="btn-premium text-lg px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-slate-500">
              No credit card required • 7-day free trial on paid plans
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From basic calculations to AI-powered advice, AdvisoryPro has you covered.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl mb-4",
                  feature.color
                )}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-slate-100 dark:bg-slate-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Start free, upgrade as you grow. Cancel anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier, index) => (
              <Card 
                key={index} 
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-lg",
                  tier.color,
                  tier.popular && "ring-2 ring-emerald-500"
                )}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <tier.icon className={cn(
                      "h-5 w-5",
                      tier.popular ? "text-emerald-600" : "text-slate-600"
                    )} />
                    <span className="font-semibold">{tier.name}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.period && <span className="text-slate-500">{tier.period}</span>}
                  </div>
                  
                  <p className="text-sm text-slate-500 mb-4">{tier.description}</p>
                  
                  <ul className="space-y-2">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/auth">
              <Button size="lg" className="btn-premium">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-8">
              Join thousands of financial advisors who trust AdvisoryPro to 
              deliver exceptional service to their clients.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
