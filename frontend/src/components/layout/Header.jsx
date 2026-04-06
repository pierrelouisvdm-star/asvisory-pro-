import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, TrendingUp, Percent, Car, Building2, Menu, X, Shield, 
  Umbrella, PiggyBank, Receipt, ScrollText, ShieldAlert, CreditCard, 
  GraduationCap, Wallet, Landmark, Users, LogIn, LogOut, User, 
  BarChart3, GitCompare, ArrowRightLeft, Crown, LineChart, Briefcase, 
  Target, FileText, Home, Settings, Grid3X3, Scale, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencySelector } from '@/components/CurrencySelector';
import { JurisdictionSelector } from '@/components/JurisdictionSelector';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdvisoryProLogoCompact } from '@/components/AdvisoryProLogo';

// All calculators organized by category for the mega menu
const allCalculators = [
  { 
    category: 'Investment',
    color: 'emerald',
    items: [
      { path: '/future-value', label: 'Future Value', icon: TrendingUp },
      { path: '/compound-interest', label: 'Compound Interest', icon: Percent },
      { path: '/fee-comparison', label: 'Fee Comparison (EAC)', icon: Scale },
      { path: '/tfsa-calculator', label: 'TFSA Calculator', icon: PiggyBank },
      { path: '/monte-carlo', label: 'Monte Carlo', icon: BarChart3 },
    ]
  },
  { 
    category: 'Debt',
    color: 'blue',
    items: [
      { path: '/bond', label: 'Bond Calculator', icon: Building2 },
      { path: '/car-finance', label: 'Vehicle Finance', icon: Car },
      { path: '/debt-payoff', label: 'Debt Payoff', icon: CreditCard },
      { path: '/loan-comparison', label: 'Loan Compare', icon: GitCompare },
    ]
  },
  { 
    category: 'Protection',
    color: 'amber',
    items: [
      { path: '/life-insurance', label: 'Life Insurance', icon: Shield },
      { path: '/income-disability', label: 'Income Protection', icon: Umbrella },
      { path: '/emergency-fund', label: 'Emergency Fund', icon: ShieldAlert },
    ]
  },
  { 
    category: 'Retirement',
    color: 'purple',
    items: [
      { path: '/retirement', label: 'Retirement Planner', icon: PiggyBank },
      { path: '/living-annuity', label: 'Living Annuity', icon: Wallet },
      { path: '/retirement-tax', label: 'RA Tax Savings', icon: Receipt },
      { path: '/tax-directive', label: 'Withdrawal Tax', icon: Target },
    ]
  },
  { 
    category: 'Tax',
    color: 'rose',
    items: [
      { path: '/tax-planning', label: 'Tax Planning Hub', icon: Receipt },
      { path: '/tax-calculator', label: 'Income Tax', icon: Calculator },
    ]
  },
  { 
    category: 'Planning',
    color: 'cyan',
    items: [
      { path: '/net-worth', label: 'Net Worth Tracker', icon: Landmark },
      { path: '/budget-planner', label: 'Budget Planner', icon: Wallet },
      { path: '/cash-flow', label: 'Cash Flow', icon: ArrowRightLeft },
      { path: '/estate-planning', label: 'Estate Planning', icon: ScrollText },
      { path: '/education-savings', label: 'Education Savings', icon: GraduationCap },
    ]
  },
];

// Quick access tools
const quickTools = [
  { path: '/document-reader', label: 'AI Doc Reader', icon: FileText },
  { path: '/financial-literacy', label: 'Literacy Quiz', icon: GraduationCap },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCalculators, setShowCalculators] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Simple nav link component
  const NavLink = ({ to, children, icon: Icon, className }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive(to)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <AdvisoryProLogoCompact />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" icon={Home}>Dashboard</NavLink>
            <NavLink to="/analytics" icon={BarChart3}>Analytics</NavLink>
            
            {/* Calculators Button */}
            <button
              onClick={() => setShowCalculators(!showCalculators)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                showCalculators
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              Calculators
            </button>

            {/* Quick Tools */}
            <NavLink to="/document-reader" icon={FileText}>AI Docs</NavLink>
            <NavLink to="/tax-planning" icon={Receipt}>Tax Hub</NavLink>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <JurisdictionSelector />
            <ThemeToggle />
            <CurrencySelector />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.is_admin && (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 hidden sm:flex">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground hidden md:block">
                    {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                  </span>
                </div>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Mega Menu */}
      {showCalculators && (
        <div className="hidden lg:block absolute left-0 right-0 top-16 bg-card border-b border-border shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-6 gap-6">
              {allCalculators.map((category) => (
                <div key={category.category}>
                  <h3 className={cn(
                    "text-xs font-semibold uppercase tracking-wider mb-3",
                    category.color === 'emerald' && "text-emerald-600",
                    category.color === 'blue' && "text-blue-600",
                    category.color === 'amber' && "text-amber-600",
                    category.color === 'purple' && "text-purple-600",
                    category.color === 'rose' && "text-rose-600",
                    category.color === 'cyan' && "text-cyan-600",
                  )}>
                    {category.category}
                  </h3>
                  <ul className="space-y-1">
                    {category.items.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setShowCalculators(false)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                            isActive(item.path)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            {/* Quick Access Row */}
            <div className="mt-6 pt-4 border-t border-border flex items-center gap-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Quick Access:</span>
              <Link
                to="/security"
                onClick={() => setShowCalculators(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              >
                <ShieldAlert className="h-4 w-4" />
                Security & Privacy
              </Link>
              <Link
                to="/financial-literacy"
                onClick={() => setShowCalculators(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              >
                <GraduationCap className="h-4 w-4" />
                Financial Literacy Quiz
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Main Links */}
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-muted"
              >
                <Home className="h-5 w-5 text-primary" />
                Dashboard
              </Link>
              <Link
                to="/analytics"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-muted"
              >
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics
              </Link>
              <Link
                to="/document-reader"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-muted"
              >
                <FileText className="h-5 w-5 text-primary" />
                AI Document Reader
              </Link>
              <Link
                to="/tax-planning"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-muted"
              >
                <Receipt className="h-5 w-5 text-primary" />
                Tax Planning Hub
              </Link>
            </div>

            {/* Calculator Categories - Collapsible on Mobile */}
            <div className="pt-4 border-t border-border">
              <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Calculators
              </h3>
              {allCalculators.map((category) => (
                <div key={category.category} className="mb-1">
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-foreground rounded-lg hover:bg-muted",
                      expandedCategory === category.category && "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      category.color === 'emerald' && "text-emerald-600",
                      category.color === 'blue' && "text-blue-600",
                      category.color === 'amber' && "text-amber-600",
                      category.color === 'purple' && "text-purple-600",
                      category.color === 'rose' && "text-rose-600",
                      category.color === 'cyan' && "text-cyan-600",
                    )}>
                      {category.category}
                    </span>
                    {expandedCategory === category.category ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedCategory === category.category && (
                    <div className="ml-4 pl-4 border-l border-border space-y-1 py-2">
                      {category.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                            isActive(item.path)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* More Tools */}
            <div className="pt-4 border-t border-border">
              <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                More Tools
              </h3>
              <Link
                to="/tools"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-amber-500 rounded-lg hover:bg-amber-500/10 font-medium"
              >
                <span className="text-xs bg-amber-500/20 px-1.5 py-0.5 rounded">FREE</span>
                Free Tools &amp; Calculators
              </Link>
              <Link
                to="/financial-literacy"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground"
              >
                <GraduationCap className="h-4 w-4" />
                Financial Literacy Quiz
              </Link>
              <Link
                to="/security"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground"
              >
                <ShieldAlert className="h-4 w-4" />
                Security & Privacy
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close calculator menu */}
      {showCalculators && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowCalculators(false)}
        />
      )}
    </header>
  );
};

export default Header;
