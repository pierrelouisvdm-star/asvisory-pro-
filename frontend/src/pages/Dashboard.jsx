import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketTracker } from '@/components/MarketTracker';
import { QuickActionsWidget } from '@/components/QuickActionsWidget';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useJurisdiction } from '@/context/JurisdictionContext';
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
  Sparkles,
  Scale,
  Crown,
  Lock,
  Award,
  Newspaper,
  Globe,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Free calculators available without subscription
const FREE_CALCULATOR_IDS = ['tfsa-calculator', 'bond', 'future-value', 'compound-interest'];

const investmentCalculators = [
  {
    id: 'future-value',
    title: 'Future Value',
    description: 'Project the growth of your investments over time',
    icon: TrendingUp,
    path: '/future-value',
    features: ['Inflation Adjusted', 'Fee Impact', 'Visual Growth'],
    isFree: true,
  },
  {
    id: 'fee-comparison',
    title: 'Fee Comparison (EAC)',
    description: 'See how fees impact your investment returns',
    icon: Scale,
    path: '/fee-comparison',
    features: ['EAC Analysis', 'Fee Impact', 'Side-by-Side'],
    isFree: false,
  },
  {
    id: 'compound-interest',
    title: 'Compound Interest',
    description: 'Calculate returns with multiple compounding frequencies',
    icon: Percent,
    path: '/compound-interest',
    features: ['Monthly/Annual', 'Growth Chart', 'Comparison'],
    isFree: true,
  },
  {
    id: 'tfsa-calculator',
    title: 'TFSA Calculator',
    description: 'Maximize your Tax Free Savings Account',
    icon: Shield,
    path: '/tfsa-calculator',
    features: ['Limit Tracker', 'Tax Savings', 'Projections'],
    isFree: true,
    isSAOnly: true,
  },
];

const debtCalculators = [
  {
    id: 'bond',
    title: 'Bond / Mortgage Calculator',
    titleUS: 'Mortgage Calculator',
    description: 'Analyze home loan payments and amortization',
    descriptionUS: 'Analyze mortgage payments, amortization, and interest savings',
    icon: Building2,
    path: '/bond',
    features: ['Amortization', 'Extra Payments', 'Interest Savings'],
    isFree: true,
  },
  {
    id: 'car-finance',
    title: 'Vehicle Finance',
    titleUS: 'Auto Loan Calculator',
    description: 'Compare loan options and calculate payments',
    icon: Car,
    path: '/car-finance',
    features: ['Loan vs Lease', 'Total Cost', 'Payment Schedule'],
    isFree: false,
  },
  {
    id: 'debt-payoff',
    title: 'Debt Payoff',
    description: 'Compare Snowball vs Avalanche strategies',
    icon: CreditCard,
    path: '/debt-payoff',
    features: ['Avalanche', 'Snowball', 'Interest Savings'],
    isFree: false,
  },
  {
    id: 'loan-comparison',
    title: 'Loan Comparison',
    description: 'Compare multiple loan options side by side',
    icon: GitCompare,
    path: '/loan-comparison',
    features: ['Side-by-Side', 'Total Cost', 'Best Option'],
    isFree: false,
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
    isFree: false,
  },
  {
    id: 'income-disability',
    title: 'Income Protection',
    description: 'Protect your income with disability coverage',
    icon: Umbrella,
    path: '/income-disability',
    features: ['Waiting Period', 'Benefit Analysis', 'Premiums'],
    isFree: false,
  },
];

const retirementCalculators = [
  {
    id: 'retirement',
    title: 'Retirement Planner',
    description: 'Plan your path to a comfortable retirement',
    icon: PiggyBank,
    path: '/retirement',
    features: ['Funding Ratio', 'Income Sources', 'Inflation'],
    isFree: false,
  },
  {
    id: 'living-annuity',
    title: 'Living Annuity',
    description: 'Calculate sustainable drawdown rates (2.5%-17.5%)',
    icon: Wallet,
    path: '/living-annuity',
    features: ['SA Regulations', 'Sustainability', 'Tax Impact'],
    isFree: false,
    isSAOnly: true,
  },
  {
    id: 'retirement-tax',
    title: 'RA Tax Savings Calculator',
    description: 'Maximize RA contribution tax benefits',
    icon: Receipt,
    path: '/retirement-tax',
    features: ['27.5% Limit', 'Tax Savings', 'Net Cost'],
    isFree: false,
    isSAOnly: true,
  },
];

const personalFinanceTools = [
  {
    id: 'tax-planning',
    title: 'SA Tax Planning Hub',
    description: 'Complete tax suite: Income tax, CGT, medical credits & more',
    icon: Receipt,
    path: '/tax-planning',
    features: ['2026/27 Tax Year', '6 Tax Tools', 'PDF Reports'],
    isFree: false,
    isNew: true,
    isFeatured: true,
    isSAOnly: true,
  },
  {
    id: 'market-insights',
    title: 'Weekly Market Insights',
    description: 'Expert analysis & tips from certified financial planners',
    icon: Newspaper,
    path: '/market-insights',
    features: ['Analyst Updates', 'CFP® Tips', 'Weekly Reports'],
    isFree: false,
    isNew: true,
    isFeatured: true,
  },
  {
    id: 'income-expense-tracker',
    title: 'Income & Expense Tracker',
    description: 'Track finances, set budgets, identify tax-deductible expenses',
    icon: Wallet,
    path: '/income-expense-tracker',
    features: ['Budget vs Actual', 'Tax Deductions', 'Monthly Reports'],
    isFree: false,
    isNew: true,
  },
  {
    id: 'tax-calculator',
    title: 'SA Tax Calculator',
    description: 'Calculate income tax with deductions & credits',
    icon: Receipt,
    path: '/tax-calculator',
    features: ['SA Tax Brackets', 'Medical Credits', 'Retirement'],
    isFree: false,
    isSAOnly: true,
  },
  {
    id: 'budget-planner',
    title: 'Budget Planner',
    description: 'Plan your budget using the 50/30/20 rule',
    icon: Wallet,
    path: '/budget-planner',
    features: ['50/30/20 Rule', 'Tracking', 'Savings Goals'],
    isFree: false,
  },
  {
    id: 'net-worth',
    title: 'Net Worth Tracker',
    description: 'Track assets, liabilities, and wealth',
    icon: Landmark,
    path: '/net-worth',
    features: ['Asset Tracking', 'Debt Analysis', 'Health Score'],
    isFree: false,
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    description: 'Calculate your financial security needs',
    icon: ShieldAlert,
    path: '/emergency-fund',
    isFree: false,
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
    isFree: false,
  },
  {
    id: 'education-savings',
    title: 'Education Savings',
    description: 'Plan for your children\'s education',
    icon: GraduationCap,
    path: '/education-savings',
    features: ['Cost Projection', 'Inflation', 'Funding Gap'],
    isFree: false,
  },
];

// US-specific calculators
const usCalculators = [
  {
    id: 'us-tax-calculator',
    title: 'US Tax Calculator',
    description: 'Federal + State income taxes for all 50 states',
    icon: Receipt,
    path: '/us/tax-calculator',
    features: ['2024/25 Brackets', 'All 50 States', 'FICA Taxes'],
    isFree: false,
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'us-401k',
    title: '401(k) Calculator',
    description: 'Plan retirement with employer matching & tax benefits',
    icon: PiggyBank,
    path: '/us/401k-calculator',
    features: ['Employer Match', 'Tax Savings', 'Roth vs Traditional'],
    isFree: false,
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'us-roth-ira',
    title: 'Roth IRA Calculator',
    description: 'Tax-free retirement growth projections',
    icon: Shield,
    path: '/us/roth-ira',
    features: ['Income Limits', 'Tax-Free Growth', 'Backdoor Roth'],
    isFree: false,
    isNew: true,
  },
  {
    id: 'us-social-security',
    title: 'Social Security Estimator',
    description: 'Estimate your Social Security benefits',
    icon: Landmark,
    path: '/us/social-security',
    features: ['Benefit Estimate', 'Claiming Age', 'Spousal Benefits'],
    isFree: false,
    isNew: true,
  },
  {
    id: 'us-hsa',
    title: 'HSA Calculator',
    description: 'Triple tax advantage health savings',
    icon: ShieldAlert,
    path: '/us/hsa',
    features: ['Tax Deduction', 'Tax-Free Growth', 'Medical Expenses'],
    isFree: false,
  },
  {
    id: 'us-529',
    title: '529 College Savings',
    description: 'Education savings with tax benefits',
    icon: GraduationCap,
    path: '/us/529',
    features: ['State Tax Benefits', 'College Costs', 'Gift Tax'],
    isFree: false,
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
  const { canAccessCalculator, isPremium } = useSubscription();
  const { isUS } = useJurisdiction();
  const hasAccess = isPremium() || calc.isFree;
  
  const displayTitle = isUS && calc.titleUS ? calc.titleUS : calc.title;
  const displayDescription = isUS && calc.descriptionUS ? calc.descriptionUS : calc.description;
  
  return (
    <Link 
      to={calc.path}
      className="group block"
      data-testid={`calculator-card-${calc.id}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={cn(
        "h-full rounded-xl border bg-card p-5 transition-all duration-300 animate-fade-in",
        calc.isFeatured 
          ? "border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 to-card hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10" 
          : hasAccess 
            ? "border-border hover:border-primary/50 hover:shadow-lg" 
            : "border-border/50 opacity-80 hover:opacity-100"
      )}>
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
            calc.isFeatured 
              ? "bg-emerald-500/20 group-hover:bg-emerald-500/30"
              : "bg-primary/10 group-hover:bg-primary/20"
          )}>
            <Icon className={cn(
              "h-5 w-5 transition-colors",
              calc.isFeatured 
                ? "text-emerald-400 group-hover:text-emerald-300"
                : "text-muted-foreground group-hover:text-primary"
            )} />
          </div>
          <div className="flex items-center gap-2">
            {calc.isNew && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                NEW
              </Badge>
            )}
            {calc.isFree ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                Free
              </Badge>
            ) : !isPremium() ? (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            ) : null}
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
        <h3 className={cn(
          "font-display text-base font-semibold mb-1.5 transition-colors",
          calc.isFeatured 
            ? "text-emerald-400 group-hover:text-emerald-300"
            : "text-foreground group-hover:text-primary"
        )}>
          {displayTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {displayDescription}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {calc.features?.map((feature) => (
            <span 
              key={feature} 
              className="inline-flex text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
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
    <Badge className="mb-3 bg-primary/10 text-primary border-primary/30 font-medium">
      <Icon className="h-3 w-3 mr-1.5" />
      {badge}
    </Badge>
    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-3 tracking-tight">
      {title}
    </h2>
    <p className="text-muted-foreground max-w-2xl mx-auto">
      {description}
    </p>
  </div>
);

export const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const { isUS, isZA, currentJurisdiction } = useJurisdiction();
  
  // Filter calculators based on jurisdiction
  const filterForJurisdiction = (calcs) => {
    if (isUS) return calcs.filter(c => !c.isSAOnly);
    return calcs.filter(c => !c.isUSOnly);
  };
  
  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 font-medium animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Professional Financial Tools
            </Badge>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-5 tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
              Financial Calculations
              <span className="block text-primary">Made Simple</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
              {isUS 
                ? "A comprehensive suite of 20+ professional calculators for Americans. Make informed financial decisions with precision tools."
                : "A comprehensive suite of 20+ professional calculators for South Africans. Make informed financial decisions with precision tools."
              }
            </p>
            
            {/* Region indicator */}
            <div className="flex justify-center mb-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
              <Badge variant="outline" className="px-3 py-1 text-sm bg-background/50">
                <span className="mr-2">{currentJurisdiction?.flag}</span>
                {currentJurisdiction?.name} • {currentJurisdiction?.taxYear || '2024/2025'} Tax Year
              </Badge>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Link to={isUS ? "/us/tax-calculator" : "/future-value"}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6" data-testid="get-started-btn">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/risk-profile">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-lg px-6 border-border"
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
        <div className={`grid gap-6 ${isAuthenticated ? 'lg:grid-cols-3' : ''}`}>
          <div className={isAuthenticated ? 'lg:col-span-2' : ''}>
            <MarketTracker />
          </div>
          {isAuthenticated && (
            <div className="lg:col-span-1">
              <QuickActionsWidget />
            </div>
          )}
        </div>
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
          {filterForJurisdiction(investmentCalculators).map((calc, index) => (
            <CalculatorCard key={calc.id} calc={calc} index={index} />
          ))}
        </div>
      </section>

      {/* US Calculators Section - shown prominently for US users */}
      {isUS && (
        <section className="bg-gradient-to-b from-blue-500/5 to-background py-16 border-y border-blue-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <Badge className="mb-3 bg-blue-500/10 text-blue-500 border-blue-500/30 font-medium">
                <Flag className="h-3 w-3 mr-1.5" />
                United States
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-3 tracking-tight">
                US Tax & Retirement Calculators
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Specialized tools for American tax planning, 401(k), Roth IRA, HSA, and 529 optimization.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {usCalculators.map((calc, index) => (
                <CalculatorCard key={calc.id} calc={calc} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Debt Calculators Section */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Debt"
            title="Debt & Loan Calculators"
            description={isUS
              ? "Analyze mortgages, auto loans, and optimize debt repayment strategies."
              : "Analyze bonds, vehicle finance, and optimize debt repayment strategies."
            }
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
          title="Insurance Calculators"
          description="Comprehensive tools for life insurance and income protection planning."
          icon={Shield}
        />
        <div className="grid sm:grid-cols-2 gap-5">
          {insuranceCalculators.map((calc, index) => (
            <CalculatorCard key={calc.id} calc={calc} index={index} />
          ))}
        </div>
      </section>

      {/* Retirement Section - SA only shown to SA users */}
      {!isUS && (
        <section className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Retirement"
              title="Retirement Planning Suite"
              description="Plan, optimize, and manage your retirement with SA-specific tools including RA and Living Annuity."
              icon={PiggyBank}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filterForJurisdiction(retirementCalculators).map((calc, index) => (
                <CalculatorCard key={calc.id} calc={calc} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Personal Finance Section */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Personal Finance"
            title="Personal Finance Tools"
            description={isUS
              ? "Take control with budgeting, expense tracking, and wealth monitoring."
              : "Take control with budgeting, tax planning, and wealth tracking."
            }
            icon={Wallet}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filterForJurisdiction(personalFinanceTools).map((calc, index) => (
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
      <section className="border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-3 tracking-tight">
              Professional Tools
            </h2>
            <p className="text-muted-foreground">
              Every feature designed to help you make better financial decisions
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="text-center p-6 rounded-xl border border-border bg-card animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1.5">
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
      <section className="bg-muted/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-4 tracking-tight">
            Ready to take control of your finances?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start using our professional calculators today and make smarter financial decisions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/future-value">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-6" data-testid="cta-explore-btn">
                Explore Calculators
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/risk-profile">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-lg px-6 border-border"
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
