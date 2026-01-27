import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketTracker } from '@/components/MarketTracker';
import { 
  Calculator, 
  TrendingUp, 
  Percent, 
  Car, 
  Building2, 
  ArrowRight, 
  BarChart3,
  FileText,
  GitCompare,
  Shield,
  Umbrella,
  PiggyBank,
  DollarSign,
  Receipt,
  ScrollText,
  ShieldAlert,
  CreditCard,
  GraduationCap,
  Wallet,
  Landmark,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const investmentCalculators = [
  {
    id: 'future-value',
    title: 'Future Value',
    description: 'Project the growth of your investments over time',
    icon: TrendingUp,
    path: '/future-value',
    features: ['Inflation Adjusted', 'Fee Impact', 'Visual Growth'],
  },
  {
    id: 'compound-interest',
    title: 'Compound Interest',
    description: 'Calculate returns with multiple compounding frequencies',
    icon: Percent,
    path: '/compound-interest',
    features: ['Monthly/Annual', 'Growth Chart', 'Comparison'],
  },
];

const debtCalculators = [
  {
    id: 'bond',
    title: 'Bond Calculator',
    description: 'Analyze home loan payments and amortization',
    icon: Building2,
    path: '/bond',
    features: ['Amortization', 'Extra Payments', 'Interest Savings'],
  },
  {
    id: 'car-finance',
    title: 'Vehicle Finance',
    description: 'Compare loan options and calculate payments',
    icon: Car,
    path: '/car-finance',
    features: ['Loan vs Lease', 'Total Cost', 'Payment Schedule'],
  },
  {
    id: 'debt-payoff',
    title: 'Debt Payoff',
    description: 'Compare Snowball vs Avalanche strategies',
    icon: CreditCard,
    path: '/debt-payoff',
    features: ['Avalanche', 'Snowball', 'Interest Savings'],
  },
  {
    id: 'loan-comparison',
    title: 'Loan Comparison',
    description: 'Compare multiple loan options side by side',
    icon: GitCompare,
    path: '/loan-comparison',
    features: ['Side-by-Side', 'Total Cost', 'Best Option'],
  },
];

const insuranceCalculators = [
  {
    id: 'life-insurance',
    title: 'Life Insurance',
    description: 'Calculate coverage needs using DIME method',
    icon: Shield,
    path: '/life-insurance',
    features: ['DIME Method', 'Gap Analysis', 'Premium Est.'],
  },
  {
    id: 'income-disability',
    title: 'Income Disability',
    description: 'Protect your income with disability coverage',
    icon: Umbrella,
    path: '/income-disability',
    features: ['Waiting Period', 'Benefit Analysis', 'Premiums'],
  },
  {
    id: 'retirement',
    title: 'Retirement Planner',
    description: 'Plan your path to a comfortable retirement',
    icon: PiggyBank,
    path: '/retirement',
    features: ['Funding Ratio', 'Income Sources', 'Inflation'],
  },
];

const personalFinanceTools = [
  {
    id: 'tax-calculator',
    title: 'Tax Calculator',
    description: 'Calculate income tax with deductions & credits',
    icon: Receipt,
    path: '/tax-calculator',
    features: ['SA Tax Brackets', 'Medical Credits', 'Retirement'],
  },
  {
    id: 'budget-planner',
    title: 'Budget Planner',
    description: 'Plan your budget using the 50/30/20 rule',
    icon: Wallet,
    path: '/budget-planner',
    features: ['50/30/20 Rule', 'Tracking', 'Savings Goals'],
  },
  {
    id: 'net-worth',
    title: 'Net Worth Tracker',
    description: 'Track assets, liabilities, and wealth',
    icon: Landmark,
    path: '/net-worth',
    features: ['Asset Tracking', 'Debt Analysis', 'Health Score'],
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    description: 'Calculate your financial security needs',
    icon: ShieldAlert,
    path: '/emergency-fund',
    features: ['Risk Analysis', 'Funding Progress', 'Timeline'],
  },
];

const planningTools = [
  {
    id: 'estate-planning',
    title: 'Estate Planning',
    description: 'Calculate estate duty and distributions',
    icon: ScrollText,
    path: '/estate-planning',
    features: ['Estate Duty', 'Executor Fees', 'Liquidity'],
  },
  {
    id: 'education-savings',
    title: 'Education Savings',
    description: 'Plan for your children\'s education',
    icon: GraduationCap,
    path: '/education-savings',
    features: ['Cost Projection', 'Inflation', 'Funding Gap'],
  },
];

const features = [
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Interactive charts for clear presentations',
  },
  {
    icon: GitCompare,
    title: 'Scenario Comparison',
    description: 'Compare multiple scenarios side by side',
  },
  {
    icon: FileText,
    title: 'Print Reports',
    description: 'Generate professional PDF reports',
  },
  {
    icon: DollarSign,
    title: 'Multi-Currency',
    description: 'Support for USD and ZAR currencies',
  },
];

const CalculatorCard = ({ calc, index }) => {
  const Icon = calc.icon;
  return (
    <Link 
      to={calc.path}
      className="group block"
      data-testid={`calculator-card-${calc.id}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20">
            <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
        </div>
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {calc.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
          {calc.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {calc.features.map((feature) => (
            <span 
              key={feature} 
              className="inline-flex text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

const SectionHeader = ({ badge, title, description, icon: Icon }) => (
  <div className="text-center mb-10">
    <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 font-medium">
      <Icon className="h-3 w-3 mr-1.5" />
      {badge}
    </Badge>
    <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
      {title}
    </h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
      {description}
    </p>
  </div>
);

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-navy-950" data-testid="dashboard">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Professional Financial Tools
            </Badge>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
              Financial Calculations
              <span className="block text-emerald-400">Made Simple</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
              A comprehensive suite of 15 professional calculators for financial advisors. 
              Help your clients make informed decisions with precision tools.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Link to="/future-value">
                <Button size="lg" className="btn-premium rounded-lg px-6" data-testid="get-started-btn">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/risk-profile">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-lg px-6 border-slate-300 dark:border-slate-700"
                  data-testid="take-quiz-btn"
                >
                  Take Risk Quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Tracker Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarketTracker />
      </section>

      {/* Investment Calculators Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          badge="Investment"
          title="Investment Calculators"
          description="Powerful tools for projecting growth and calculating returns."
          icon={TrendingUp}
        />
        <div className="grid sm:grid-cols-2 gap-5">
          {investmentCalculators.map((calc, index) => (
            <CalculatorCard key={calc.id} calc={calc} index={index} />
          ))}
        </div>
      </section>

      {/* Debt Calculators Section */}
      <section className="bg-slate-50 dark:bg-navy-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Debt"
            title="Debt & Loan Calculators"
            description="Analyze bonds, vehicle finance, and optimize debt repayment strategies."
            icon={CreditCard}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {debtCalculators.map((calc, index) => (
              <CalculatorCard key={calc.id} calc={calc} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Insurance Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          badge="Insurance"
          title="Insurance & Retirement"
          description="Comprehensive tools for life insurance, disability coverage, and retirement planning."
          icon={Shield}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {insuranceCalculators.map((calc, index) => (
            <CalculatorCard key={calc.id} calc={calc} index={index} />
          ))}
        </div>
      </section>

      {/* Personal Finance Section */}
      <section className="bg-slate-50 dark:bg-navy-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Personal Finance"
            title="Personal Finance Tools"
            description="Take control with budgeting, tax planning, and wealth tracking."
            icon={Wallet}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {personalFinanceTools.map((calc, index) => (
              <CalculatorCard key={calc.id} calc={calc} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Planning Tools Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          badge="Planning"
          title="Future Planning"
          description="Plan for major life events with estate planning and education savings."
          icon={ScrollText}
        />
        <div className="grid sm:grid-cols-2 gap-5">
          {planningTools.map((calc, index) => (
            <CalculatorCard key={calc.id} calc={calc} index={index} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-200 dark:border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              Built for Advisors
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Every feature designed to enhance your client presentations
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="text-center p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 mb-4">
                    <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 dark:bg-slate-950 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
            Ready to elevate your client presentations?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Start using our professional calculators today and help your clients make better financial decisions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/future-value">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6" data-testid="cta-explore-btn">
                Explore Calculators
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/risk-profile">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-lg px-6 border-slate-600 text-white hover:bg-slate-800"
                data-testid="cta-quiz-btn"
              >
                Start with Risk Quiz
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
