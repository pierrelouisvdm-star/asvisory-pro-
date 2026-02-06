import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, TrendingUp, Percent, Car, Building2, Menu, X, Shield, 
  Umbrella, PiggyBank, Receipt, ScrollText, ShieldAlert, CreditCard, 
  GraduationCap, Wallet, Landmark, Users, LogIn, LogOut, User, 
  BarChart3, GitCompare, ArrowRightLeft, Crown, LineChart, Briefcase, 
  Target, FileText, Home, Settings, Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useAuth } from '@/context/AuthContext';

// All calculators organized by category for the mega menu
const allCalculators = [
  { 
    category: 'Investment',
    color: 'emerald',
    items: [
      { path: '/future-value', label: 'Future Value', icon: TrendingUp },
      { path: '/compound-interest', label: 'Compound Interest', icon: Percent },
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
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  // Simple nav link component
  const NavLink = ({ to, children, icon: Icon, className }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive(to)
          ? "bg-emerald-500/20 text-emerald-400"
          : "text-slate-400 hover:text-white hover:bg-navy-800",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-sm border-b border-navy-800">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-navy-950 font-bold text-lg group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="font-display text-xl font-bold text-white hidden sm:block">
              AdvisoryPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" icon={Home}>Dashboard</NavLink>
            <NavLink to="/clients" icon={Users}>Clients</NavLink>
            <NavLink to="/analytics" icon={BarChart3}>Analytics</NavLink>
            
            {/* Calculators Button */}
            <button
              onClick={() => setShowCalculators(!showCalculators)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                showCalculators
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-navy-800"
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
            <CurrencySelector />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.is_admin && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hidden sm:flex">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
                <div className="flex items-center gap-2 pl-2 border-l border-navy-700">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white hidden md:block">
                    {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                  </span>
                </div>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-navy-950">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Mega Menu */}
      {showCalculators && (
        <div className="hidden lg:block absolute left-0 right-0 top-16 bg-navy-900 border-b border-navy-800 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-6 gap-6">
              {allCalculators.map((category) => (
                <div key={category.category}>
                  <h3 className={cn(
                    "text-xs font-semibold uppercase tracking-wider mb-3",
                    category.color === 'emerald' && "text-emerald-400",
                    category.color === 'blue' && "text-blue-400",
                    category.color === 'amber' && "text-amber-400",
                    category.color === 'purple' && "text-purple-400",
                    category.color === 'rose' && "text-rose-400",
                    category.color === 'cyan' && "text-cyan-400",
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
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "text-slate-400 hover:text-white hover:bg-navy-800"
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
            <div className="mt-6 pt-4 border-t border-navy-700 flex items-center gap-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Quick Access:</span>
              <Link
                to="/security"
                onClick={() => setShowCalculators(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-md hover:bg-navy-800"
              >
                <ShieldAlert className="h-4 w-4" />
                Security & Privacy
              </Link>
              <Link
                to="/financial-literacy"
                onClick={() => setShowCalculators(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-md hover:bg-navy-800"
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
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-navy-950/95 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Main Links */}
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white rounded-lg hover:bg-navy-800"
              >
                <Home className="h-5 w-5 text-emerald-400" />
                Dashboard
              </Link>
              <Link
                to="/clients"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white rounded-lg hover:bg-navy-800"
              >
                <Users className="h-5 w-5 text-emerald-400" />
                Clients
              </Link>
              <Link
                to="/analytics"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white rounded-lg hover:bg-navy-800"
              >
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Analytics
              </Link>
              <Link
                to="/document-reader"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white rounded-lg hover:bg-navy-800"
              >
                <FileText className="h-5 w-5 text-emerald-400" />
                AI Document Reader
              </Link>
              <Link
                to="/tax-planning"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white rounded-lg hover:bg-navy-800"
              >
                <Receipt className="h-5 w-5 text-emerald-400" />
                Tax Planning Hub
              </Link>
            </div>

            {/* Calculator Categories */}
            {allCalculators.map((category) => (
              <div key={category.category} className="pt-4 border-t border-navy-800">
                <h3 className={cn(
                  "px-4 text-xs font-semibold uppercase tracking-wider mb-2",
                  category.color === 'emerald' && "text-emerald-400",
                  category.color === 'blue' && "text-blue-400",
                  category.color === 'amber' && "text-amber-400",
                  category.color === 'purple' && "text-purple-400",
                  category.color === 'rose' && "text-rose-400",
                  category.color === 'cyan' && "text-cyan-400",
                )}>
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-slate-300 rounded-lg hover:bg-navy-800 hover:text-white"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* More Tools */}
            <div className="pt-4 border-t border-navy-800">
              <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                More Tools
              </h3>
              <Link
                to="/financial-literacy"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-slate-300 rounded-lg hover:bg-navy-800 hover:text-white"
              >
                <GraduationCap className="h-4 w-4" />
                Financial Literacy Quiz
              </Link>
              <Link
                to="/security"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-slate-300 rounded-lg hover:bg-navy-800 hover:text-white"
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
