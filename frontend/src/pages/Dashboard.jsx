import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketTracker } from '@/components/MarketTracker';
import { QuickActionsWidget } from '@/components/QuickActionsWidget';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
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
  Zap,
  Camera,
  RefreshCw
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
    isFree: true,
  },
  {
    id: 'car-finance',
    title: 'Vehicle Finance',
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
  },
  {
    id: 'retirement-tax',
    title: 'Tax Savings Calculator',
    description: 'Maximize RA contribution tax benefits',
    icon: Receipt,
    path: '/retirement-tax',
    features: ['27.5% Limit', 'Tax Savings', 'Net Cost'],
    isFree: false,
  },
];

const personalFinanceTools = [
  {
    id: 'tax-planning',
    title: 'Tax Planning Hub',
    description: 'Complete tax suite: Income tax, CGT, medical credits & more',
    icon: Receipt,
    path: '/tax-planning',
    features: ['2026/27 Tax Year', '6 Tax Tools', 'PDF Reports'],
    isFree: false,
    isNew: true,
    isFeatured: true,
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
    title: 'Tax Calculator',
    description: 'Calculate income tax with deductions & credits',
    icon: Receipt,
    path: '/tax-calculator',
    features: ['SA Tax Brackets', 'Medical Credits', 'Retirement'],
    isFree: false,
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

const advisorTools = [
  {
    id: 'report-builder',
    title: 'AI Client Report Builder',
    description: 'Generate branded client-ready PDF reports in seconds with GPT-4o',
    icon: Sparkles,
    path: '/report-builder',
    features: ['Branded PDFs', 'GPT-4o Powered', 'Save Hours'],
    isFree: false,
    isNew: true,
    isFeatured: true,
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

// What's New updates
const whatsNewItems = [
  {
    icon: RefreshCw,
    title: '2026/2027 Tax Year Ready',
    description: 'All calculators updated with new tax brackets, rebates, CGT exclusions, and TFSA limits.',
    tag: 'Updated',
    tagColor: 'emerald',
    link: '/tax-planning',
  },
  {
    icon: Camera,
    title: 'AI Receipt Scanner',
    description: 'Upload receipts and let AI automatically extract amounts, dates, merchants, and categories.',
    tag: 'New',
    tagColor: 'blue',
    link: '/income-expense-tracker',
  },
  {
    icon: Receipt,
    title: 'Tax Planning Hub',
    description: 'Complete tax suite: Income tax, CGT, medical credits, donations, and retirement deductions.',
    tag: 'Featured',
    tagColor: 'amber',
    link: '/tax-planning',
  },
];

const CalculatorCard = ({ calc, index }) => {
  const Icon = calc.icon;
  const { canAccessCalculator, isPremium } = useSubscription();
  const hasAccess = isPremium() || calc.isFree;
  
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
          {calc.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {calc.description}
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
  const { isAuthenticated, user } = useAuth();
  const isAdvisor = user?.role === 'advisor' || user?.is_admin;
  
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
              A comprehensive suite of 20+ professional calculators for South Africans. Make informed financial decisions with precision tools.
            </p>
            
            {/* Region indicator */}
            <div className="flex justify-center mb-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
              <Badge variant="outline" className="px-3 py-1 text-sm bg-background/50">
                <span className="mr-2">🇿🇦</span>
                South Africa • 2026/2027 Tax Year
              </Badge>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Link to="/future-value">
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

      {/* What's New Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-lg font-bold text-foreground">What's New</h2>
          </div>
          <p className="text-sm text-muted-foreground">Latest updates and features</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {whatsNewItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.title} 
                to={item.link}
                className="group block"
                data-testid={`whats-new-${index}`}
              >
                <Card className="h-full border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        item.tagColor === 'emerald' && "bg-emerald-500/10",
                        item.tagColor === 'blue' && "bg-blue-500/10",
                        item.tagColor === 'amber' && "bg-amber-500/10",
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          item.tagColor === 'emerald' && "text-emerald-500",
                          item.tagColor === 'blue' && "text-blue-500",
                          item.tagColor === 'amber' && "text-amber-500",
                        )} />
                      </div>
                      <Badge className={cn(
                        "text-xs",
                        item.tagColor === 'emerald' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        item.tagColor === 'blue' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        item.tagColor === 'amber' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      )}>
                        {item.tag}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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
          {investmentCalculators.map((calc, index) => (
            <CalculatorCard key={calc.id} calc={calc} index={index} />
          ))}
        </div>
      </section>

      {/* Advisor Workflow Section - visible only to advisors */}
      {isAdvisor && (
        <section className="bg-gradient-to-b from-emerald-950/20 to-background py-16 border-y border-emerald-500/20" data-testid="advisor-workflow-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Advisor Workflow"
              title="AI Copilot for Your Practice"
              description="Built for financial advisors — generate branded client reports, manage your book, and automate admin work."
              icon={Sparkles}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {advisorTools.map((calc, index) => (
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

      {/* Retirement Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Retirement"
            title="Retirement Planning Suite"
            description="Plan, optimize, and manage your retirement with SA-specific tools."
            icon={PiggyBank}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {retirementCalculators.map((calc, index) => (
              <CalculatorCard key={calc.id} calc={calc} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Personal Finance Section */}
      <section className="bg-muted/50 py-16">
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
