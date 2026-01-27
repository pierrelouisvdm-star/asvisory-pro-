import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  Percent, 
  Car, 
  Building2, 
  ArrowRight, 
  Sparkles,
  BarChart3,
  FileText,
  GitCompare,
  Shield,
  Clock,
  Users,
  Umbrella,
  PiggyBank,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';

const investmentCalculators = [
  {
    id: 'future-value',
    title: 'Future Value Calculator',
    description: 'Calculate future value with inflation & fee adjustments',
    icon: TrendingUp,
    path: '/future-value',
    color: 'gold',
    features: ['Inflation Adjusted', 'Fee Impact', 'Regular Deposits'],
  },
  {
    id: 'compound-interest',
    title: 'Compound Interest',
    description: 'Understand the power of compound interest over time',
    icon: Percent,
    path: '/compound-interest',
    color: 'forest',
    features: ['Multiple Frequencies', 'Visual Growth Chart', 'Interest Breakdown'],
  },
  {
    id: 'bond',
    title: 'Bond Calculator',
    description: 'Analyze bond pricing, yields, and duration metrics',
    icon: Building2,
    path: '/bond',
    color: 'navy',
    features: ['Price Calculation', 'Yield to Maturity', 'Duration Analysis'],
  },
  {
    id: 'car-finance',
    title: 'Car Finance Calculator',
    description: 'Compare financing options for vehicle purchases',
    icon: Car,
    path: '/car-finance',
    color: 'gold',
    features: ['Loan vs Lease', 'Total Cost Analysis', 'Payment Schedule'],
  },
];

const insuranceCalculators = [
  {
    id: 'life-insurance',
    title: 'Life Insurance Calculator',
    description: 'Calculate the right coverage to protect your family',
    icon: Shield,
    path: '/life-insurance',
    color: 'forest',
    features: ['DIME Method', 'Coverage Gap Analysis', 'Premium Estimates'],
  },
  {
    id: 'income-disability',
    title: 'Income Disability',
    description: 'Protect your income with disability coverage',
    icon: Umbrella,
    path: '/income-disability',
    color: 'navy',
    features: ['Waiting Period', 'Benefit Analysis', 'Premium Calculator'],
  },
  {
    id: 'retirement',
    title: 'Retirement Planner',
    description: 'Plan your path to a comfortable retirement',
    icon: PiggyBank,
    path: '/retirement',
    color: 'gold',
    features: ['Funding Ratio', 'Income Sources', 'Inflation Adjusted'],
  },
];

const features = [
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Interactive charts and graphs for clear client presentations',
  },
  {
    icon: GitCompare,
    title: 'Scenario Comparison',
    description: 'Compare multiple scenarios side by side',
  },
  {
    icon: FileText,
    title: 'Print Reports',
    description: 'Generate professional PDF reports for clients',
  },
  {
    icon: DollarSign,
    title: 'Multi-Currency',
    description: 'Support for USD and ZAR currencies',
  },
];

const colorVariants = {
  gold: 'from-gold/20 to-gold/5 ring-gold/20',
  forest: 'from-forest/20 to-forest/5 ring-forest/20',
  navy: 'from-navy-light/20 to-navy-light/5 ring-navy-light/20',
};

const iconColorVariants = {
  gold: 'text-gold',
  forest: 'text-forest',
  navy: 'text-navy-light',
};

export const Dashboard = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-pattern">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-forest/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium text-gold">Professional Calculator Suite</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Financial Clarity for 
                  <span className="text-gold-gradient block">Your Clients</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Empower your client meetings with elegant, accurate financial calculators. 
                  Present complex calculations with beautiful visualizations and professional reports.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild variant="premium" size="lg" className="gap-2">
                  <Link to="/future-value">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/compound-interest">
                    Explore Calculators
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-gold" />
                  <span>Bank-grade accuracy</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-forest" />
                  <span>Real-time calculations</span>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative hidden lg:block animate-fade-in-up">
              <div className="relative rounded-2xl overflow-hidden shadow-elevated">
                <img 
                  src="https://images.pexels.com/photos/8292854/pexels-photo-8292854.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Financial advisor consulting with clients"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
                        <Users className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Client-Ready Presentations</p>
                        <p className="text-xs text-muted-foreground">Professional reports in seconds</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Card */}
              <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-elevated p-4 animate-pulse-soft">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Growth Projection</p>
                    <p className="text-sm font-bold text-foreground">+127.4%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Calculators Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-gold/10 text-gold border-gold/20">
            <TrendingUp className="h-3 w-3 mr-1" />
            Investment Tools
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Investment Calculators
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Essential calculators for investment planning with inflation & fee adjustments. 
            Compare scenarios, visualize growth, and generate client reports.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {investmentCalculators.map((calc, index) => {
            const Icon = calc.icon;
            return (
              <Link 
                key={calc.id} 
                to={calc.path}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className={cn(
                  "h-full card-elevated overflow-hidden",
                  "border-2 border-transparent hover:border-gold/30"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
                        colorVariants[calc.color]
                      )}>
                        <Icon className={cn("h-7 w-7", iconColorVariants[calc.color])} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    <CardTitle className="font-display text-xl font-semibold mt-4 group-hover:text-gold transition-colors">
                      {calc.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {calc.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {calc.features.map((feature) => (
                        <Badge 
                          key={feature} 
                          variant="secondary"
                          className="bg-muted/50 text-muted-foreground border-0"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Insurance & Planning Section */}
      <section className="bg-muted/20 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-4 bg-forest/10 text-forest border-forest/20">
              <Shield className="h-3 w-3 mr-1" />
              Protection & Planning
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Insurance & Retirement
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for life insurance needs analysis, disability coverage, 
              and retirement planning with inflation adjustments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {insuranceCalculators.map((calc, index) => {
              const Icon = calc.icon;
              return (
                <Link 
                  key={calc.id} 
                  to={calc.path}
                  className="group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className={cn(
                    "h-full card-elevated overflow-hidden",
                    "border-2 border-transparent hover:border-forest/30"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
                          colorVariants[calc.color]
                        )}>
                          <Icon className={cn("h-7 w-7", iconColorVariants[calc.color])} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-forest group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <CardTitle className="font-display text-xl font-semibold mt-4 group-hover:text-forest transition-colors">
                        {calc.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {calc.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {calc.features.map((feature) => (
                          <Badge 
                            key={feature} 
                            variant="secondary"
                            className="bg-muted/50 text-muted-foreground border-0"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Built for Advisors
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to enhance your client presentations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="text-center p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 mb-4">
                    <Icon className="h-7 w-7 text-gold" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy to-navy-light p-8 lg:p-12">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-forest/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-cream mb-3">
                Ready to Elevate Your Client Meetings?
              </h2>
              <p className="text-cream/80 max-w-lg">
                Start using professional-grade financial calculators that your clients will love.
              </p>
            </div>
            <Button asChild variant="premium" size="lg" className="gap-2 whitespace-nowrap">
              <Link to="/future-value">
                <Calculator className="h-5 w-5" />
                Start Calculating
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
