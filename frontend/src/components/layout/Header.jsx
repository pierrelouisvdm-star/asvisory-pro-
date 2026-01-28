import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, Percent, Car, Building2, Menu, X, Shield, Umbrella, PiggyBank, ChevronDown, Receipt, ScrollText, ShieldAlert, CreditCard, GraduationCap, Wallet, Landmark, Users, LogIn, LogOut, User, BarChart3, GitCompare, ArrowRightLeft, Crown, LineChart, Briefcase, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// Category 1: Calculators (Investment & Debt)
const calculators = [
  { path: '/future-value', label: 'Future Value', icon: TrendingUp, section: 'Investment' },
  { path: '/compound-interest', label: 'Compound Interest', icon: Percent, section: 'Investment' },
  { path: '/bond', label: 'Bond Calculator', icon: Building2, section: 'Debt' },
  { path: '/car-finance', label: 'Vehicle Finance', icon: Car, section: 'Debt' },
  { path: '/debt-payoff', label: 'Debt Payoff', icon: CreditCard, section: 'Debt' },
  { path: '/loan-comparison', label: 'Loan Comparison', icon: GitCompare, section: 'Debt' },
];

// Category 2: Retirement (Dedicated Section)
const retirementTools = [
  { path: '/retirement', label: 'Retirement Planner', icon: PiggyBank },
  { path: '/living-annuity', label: 'Living Annuity', icon: Wallet },
  { path: '/retirement-tax', label: 'Tax Savings Calculator', icon: Receipt },
  { path: '/life-insurance', label: 'Life Insurance', icon: Shield },
  { path: '/income-disability', label: 'Income Protection', icon: Umbrella },
];

// Category 3: Tools & Planning
const toolsAndPlanning = [
  { path: '/tax-calculator', label: 'Tax Calculator', icon: Receipt, section: 'Personal Finance' },
  { path: '/budget-planner', label: 'Budget Planner', icon: Wallet, section: 'Personal Finance' },
  { path: '/net-worth', label: 'Net Worth Tracker', icon: Landmark, section: 'Personal Finance' },
  { path: '/emergency-fund', label: 'Emergency Fund', icon: ShieldAlert, section: 'Personal Finance' },
  { path: '/estate-planning', label: 'Estate Planning', icon: ScrollText, section: 'Planning' },
  { path: '/education-savings', label: 'Education Savings', icon: GraduationCap, section: 'Planning' },
  { path: '/cash-flow', label: 'Cash Flow Projector', icon: ArrowRightLeft, section: 'Advanced' },
  { path: '/monte-carlo', label: 'Monte Carlo Simulator', icon: BarChart3, section: 'Advanced' },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const NavDropdown = ({ items, label, icon: Icon, isActive, grouped = false }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          data-testid={`nav-dropdown-${label.toLowerCase()}`}
          className={cn(
            "gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            isActive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        {grouped ? (
          // Group items by section
          <>
            {[...new Set(items.map(i => i.section))].map((section, idx) => (
              <React.Fragment key={section}>
                {idx > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-slate-500 px-3 py-1">{section}</DropdownMenuLabel>
                {items.filter(i => i.section === section).map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link 
                        to={item.path} 
                        data-testid={`nav-link-${item.path.replace('/', '')}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors",
                          location.pathname === item.path 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <ItemIcon className="h-4 w-4 opacity-70" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            ))}
          </>
        ) : (
          // Simple list
          items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem key={item.path} asChild>
                <Link 
                  to={item.path} 
                  data-testid={`nav-link-${item.path.replace('/', '')}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors",
                    location.pathname === item.path 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <ItemIcon className="h-4 w-4 opacity-70" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 glass-header" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            data-testid="logo-link"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <span className="text-navy-950 font-bold text-lg">A</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              AdvisoryPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              data-testid="nav-link-dashboard"
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                location.pathname === '/'
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              )}
            >
              Dashboard
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/clients"
                  data-testid="nav-link-clients"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5",
                    location.pathname.startsWith('/clients')
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Clients
                </Link>
                <Link
                  to="/analytics"
                  data-testid="nav-link-analytics"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5",
                    location.pathname === '/analytics'
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  )}
                >
                  <LineChart className="h-4 w-4" />
                  Analytics
                </Link>
              </>
            )}

            <NavDropdown 
              items={calculators} 
              label="Calculators" 
              icon={Calculator}
              isActive={calculators.some(c => c.path === location.pathname)}
              grouped={true}
            />

            <NavDropdown 
              items={retirementTools} 
              label="Retirement" 
              icon={PiggyBank}
              isActive={retirementTools.some(c => c.path === location.pathname)}
            />
            
            <NavDropdown 
              items={toolsAndPlanning} 
              label="Tools" 
              icon={Briefcase}
              isActive={toolsAndPlanning.some(c => c.path === location.pathname)}
              grouped={true}
            />
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <CurrencySelector />

            {/* Auth Actions */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 px-3 rounded-lg gap-2"
                    data-testid="user-menu-btn"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">
                      {user?.full_name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/clients" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      My Clients
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2" data-testid="login-btn">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-slate-200/50 dark:border-slate-800/50 animate-fade-in max-h-[70vh] overflow-y-auto" data-testid="mobile-nav">
            <div className="flex flex-col gap-1">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  location.pathname === '/'
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                )}
              >
                <Calculator className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>

              {[
                { title: 'Investment', items: investmentCalcs },
                { title: 'Insurance', items: insuranceCalcs },
                { title: 'Personal Finance', items: personalFinanceTools },
                { title: 'Planning', items: planningTools },
                { title: 'Advanced Tools', items: advancedTools },
              ].map((section) => (
                <React.Fragment key={section.title}>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ml-2",
                          isActive 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                        )}
                      >
                        <Icon className="h-5 w-5 opacity-70" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
