import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, Percent, Car, Building2, Moon, Sun, Menu, X, Shield, Umbrella, PiggyBank, ChevronDown, Receipt, ScrollText, ShieldAlert, CreditCard, GraduationCap, Wallet, Landmark, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencySelector } from '@/components/CurrencySelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const investmentCalcs = [
  { path: '/future-value', label: 'Future Value', icon: TrendingUp },
  { path: '/compound-interest', label: 'Compound Interest', icon: Percent },
  { path: '/bond', label: 'Bond Calculator', icon: Building2 },
  { path: '/car-finance', label: 'Car Finance', icon: Car },
];

const insuranceCalcs = [
  { path: '/life-insurance', label: 'Life Insurance', icon: Shield },
  { path: '/income-disability', label: 'Income Disability', icon: Umbrella },
  { path: '/retirement', label: 'Retirement Planner', icon: PiggyBank },
];

const personalFinanceTools = [
  { path: '/tax-calculator', label: 'Tax Calculator', icon: Receipt },
  { path: '/budget-planner', label: 'Budget Planner', icon: Wallet },
  { path: '/net-worth', label: 'Net Worth Tracker', icon: Landmark },
  { path: '/emergency-fund', label: 'Emergency Fund', icon: ShieldAlert },
  { path: '/debt-payoff', label: 'Debt Payoff', icon: CreditCard },
];

const planningTools = [
  { path: '/estate-planning', label: 'Estate Planning', icon: ScrollText },
  { path: '/education-savings', label: 'Education Savings', icon: GraduationCap },
  { path: '/risk-profile', label: 'Risk Profile Quiz', icon: ClipboardList },
];

export const Header = ({ isDark, setIsDark }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark shadow-gold transition-transform duration-300 group-hover:scale-105">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-semibold text-foreground">
                Wealth<span className="text-gold">Calc</span>
              </span>
              <p className="text-xs text-muted-foreground -mt-0.5">Financial Advisor Suite</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "nav-link flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                location.pathname === '/'
                  ? "bg-gold/10 text-gold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Calculator className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            {/* Investment Calculators Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-1 px-3 text-sm font-medium",
                    investmentCalcs.some(c => c.path === location.pathname)
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Investment</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {investmentCalcs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        location.pathname === item.path && "bg-gold/10 text-gold"
                      )}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Insurance & Planning Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-1 px-3 text-sm font-medium",
                    insuranceCalcs.some(c => c.path === location.pathname)
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span>Insurance & Planning</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {insuranceCalcs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        location.pathname === item.path && "bg-gold/10 text-gold"
                      )}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <CurrencySelector />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="rounded-lg"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-gold" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border/40 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  location.pathname === '/'
                    ? "bg-gold/10 text-gold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Calculator className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>

              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Investment
              </div>
              {investmentCalcs.map((item) => {
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
                        ? "bg-gold/10 text-gold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                Insurance & Planning
              </div>
              {insuranceCalcs.map((item) => {
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
                        ? "bg-gold/10 text-gold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
