import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, PieChart, FileText, CheckCircle2, ArrowRight,
  Sparkles, Crown, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Calculator,
    title: '15+ Financial Calculators',
    description: 'Comprehensive tools for investments, insurance, retirement, tax, and more.',
    color: 'text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage your clients, track their financial data, and monitor progress.',
    color: 'text-navy-600 bg-navy-500/10 dark:text-blue-400 dark:bg-blue-500/20'
  },
  {
    icon: BarChart3,
    title: 'Financial Analysis',
    description: 'Identify shortfalls and get actionable recommendations for each client.',
    color: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20'
  },
  {
    icon: TrendingUp,
    title: 'Live Market Tracker',
    description: 'Real-time data on indices, Gold, Silver, Bitcoin, and currency pairs.',
    color: 'text-gold-600 bg-gold-500/10 dark:text-gold-400 dark:bg-gold-500/20'
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'GPT-5.2 powered chatbot for personalized financial guidance.',
    color: 'text-navy-700 bg-navy-500/10 dark:text-blue-300 dark:bg-blue-500/20'
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    description: 'Generate professional reports for your clients with one click.',
    color: 'text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20'
  },
];

const tiers = [
  {
    name: 'Free',
    price: 'R0',
    icon: Zap,
    description: '4 basic calculators to get started',
    features: ['Future Value Calculator', 'Compound Interest', 'Bond Calculator', 'Car Finance'],
    color: 'border-slate-200 dark:border-slate-700'
  },
  {
    name: 'Standard',
    price: 'R49',
    period: '/month',
    icon: Sparkles,
    description: 'Full calculator suite for growing practices',
    features: ['All 15 calculators', 'Up to 5 clients', 'Live market tracker', 'PDF reports'],
    color: 'border-navy-200 bg-navy-50/50 dark:border-navy-700 dark:bg-navy-900/30'
  },
  {
    name: 'Premium',
    price: 'R149',
    period: '/month',
    icon: Crown,
    description: 'Complete toolkit for established advisors',
    features: ['Everything in Standard', 'Unlimited clients', 'AI Assistant', 'Advanced analytics'],
    popular: true,
    color: 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/30'
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMTgiIHN0cm9rZT0icmdiYSgxNiwgMTg1LCAxMjksIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')] opacity-40" />
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-1.5">
              Built by Financial Professionals, for Financial Professionals
            </Badge>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Empower Your Practice with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                AdvisoryPro
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
              Professional financial calculators, client management, AI-powered insights, 
              and live market data, everything you need to deliver exceptional advice.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-lg px-8 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 border-slate-600 text-white hover:bg-white/10 hover:border-slate-500">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-slate-400">
              No credit card required • 7-day free trial on paid plans
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="bg-slate-50 dark:bg-navy-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
              About AdvisoryPro
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Created by Advisors Who{' '}
              <span className="text-emerald-600">Understand Your Needs</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              AdvisoryPro was born from the frustrations of practising financial advisors 
              who needed better tools. We understand the daily challenges you face, from 
              complex calculations to client management, from staying compliant to delivering 
              exceptional service.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our team combines financial planning experience with cutting-edge 
              technology. Every feature, every calculation, every workflow has been designed 
              by people who've sat where you sit, across the desk from clients who trust you 
              with their financial futures.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From basic calculations to AI-powered advice, AdvisoryPro has you covered.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8">
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl mb-5",
                  feature.color
                )}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-slate-50 dark:bg-navy-900/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Start free, upgrade as you grow. Cancel anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier, index) => (
              <Card 
                key={index} 
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-navy-900/50",
                  tier.color,
                  tier.popular && "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10"
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900 border border-navy-700">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
              Join thousands of financial advisors who trust AdvisoryPro to 
              deliver exceptional service to their clients.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-lg px-10 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-400 py-16 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-navy-950 font-bold text-xl">A</span>
                </div>
                <span className="text-white font-bold text-2xl">AdvisoryPro</span>
              </div>
              <p className="text-sm mb-6 max-w-md leading-relaxed">
                Built by financial professionals, for financial professionals. We understand the 
                challenges you face because we've faced them too. Our mission is to empower advisors 
                with the tools they need to deliver exceptional client outcomes.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>POPIA Compliant • SSL Secured • SA-Based</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-5">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">Calculators</Link></li>
                <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">Client Management</Link></li>
                <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">Market Tracker</Link></li>
                <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">AI Assistant</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-5">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">About Us</span></li>
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">Contact</span></li>
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} AdvisoryPro. All rights reserved.
            </p>
            <p className="text-sm text-center md:text-right">
              Designed with ❤️ by South African Financial Professionals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
