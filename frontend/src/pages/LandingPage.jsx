import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, FileText, CheckCircle2, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: '15+ Financial Calculators',
    description: 'Investment, insurance, retirement, tax, and more.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Track clients and monitor their financial progress.',
  },
  {
    icon: BarChart3,
    title: 'Financial Analysis',
    description: 'Identify shortfalls with actionable recommendations.',
  },
  {
    icon: TrendingUp,
    title: 'Live Market Tracker',
    description: 'Real-time indices, commodities, and currencies.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'GPT-powered chatbot for financial guidance.',
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    description: 'Generate professional client reports instantly.',
  },
];

const allFeatures = [
  'Future Value & Compound Interest',
  'Bond & Car Finance Calculators',
  'Basic Financial Tools',
  'No Credit Card Required',
];

const pricingTiers = [
  {
    name: 'Premium',
    price: 'R149/mo',
    features: ['All 15 Financial Calculators', 'Unlimited Clients', 'PDF Reports', 'AI Assistant', 'Live Market Tracker', 'Advanced Tools'],
    highlight: true,
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-navy-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5">
              Built by Financial Professionals, for Financial Professionals
            </Badge>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight">
              Empower Your Practice with{' '}
              <span className="text-emerald-400">AdvisoryPro</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              Professional calculators, client management, AI insights, and live market data.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-lg px-8 shadow-lg shadow-emerald-500/25">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 border-slate-600 text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative bg-navy-900/50 border-y border-navy-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Created by Advisors Who <span className="text-emerald-400">Understand</span>
          </h2>
          <p className="text-slate-400 leading-relaxed">
            We built AdvisoryPro from real experience in financial planning. 
            Every feature is designed for the challenges you face daily.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/50 to-navy-950" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Everything You Need
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group p-6 rounded-2xl bg-navy-900/60 border border-navy-700 hover:border-emerald-500/50 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4 group-hover:bg-emerald-500/30 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-20 bg-navy-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 mb-10">
            Start free, upgrade as you grow. No hidden fees.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {pricingTiers.map((tier, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl border ${
                  tier.highlight 
                    ? 'bg-emerald-500/10 border-emerald-500/50' 
                    : 'bg-navy-900/60 border-navy-700'
                }`}
              >
                <h3 className="font-display text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-3xl font-bold text-emerald-400 mb-4">{tier.price}</p>
                <ul className="space-y-2 text-left">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <p className="text-slate-400 text-sm mb-6">
            Have a coupon code? Enter it during registration for instant Premium access!
          </p>
          
          <Link to="/auth">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-lg px-10">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 to-navy-900/50" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join financial advisors who trust AdvisoryPro to deliver exceptional service.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-lg px-10 shadow-lg shadow-emerald-500/25">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-navy-950 font-bold text-lg">A</span>
              </div>
              <span className="text-white font-bold text-xl">AdvisoryPro</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/auth" className="hover:text-emerald-400 transition-colors">Calculators</Link>
              <Link to="/auth" className="hover:text-emerald-400 transition-colors">Clients</Link>
            </div>
            
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} AdvisoryPro
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
