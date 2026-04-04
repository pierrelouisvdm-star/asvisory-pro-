import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import {
  Flag, ChevronRight, ChevronLeft, CheckCircle2, X,
  MapPin, DollarSign, PiggyBank, Target, Zap, Flame, GraduationCap, Briefcase, Home, TrendingUp
} from 'lucide-react';
import { getStateList } from '@/data/usTaxData';

const STORAGE_KEY = 'us_onboarding_completed';
const PROFILE_KEY = 'us_financial_profile';

const INCOME_RANGES = [
  { label: 'Under $30k', value: 'under_30k', min: 0, max: 30000 },
  { label: '$30k – $60k', value: '30k_60k', min: 30000, max: 60000 },
  { label: '$60k – $100k', value: '60k_100k', min: 60000, max: 100000 },
  { label: '$100k – $200k', value: '100k_200k', min: 100000, max: 200000 },
  { label: '$200k+', value: 'over_200k', min: 200000, max: Infinity },
];

const EMPLOYMENT_TYPES = [
  { label: 'W-2 Employee', value: 'w2', icon: Briefcase },
  { label: '1099 / Freelancer', value: '1099', icon: Zap },
  { label: 'Business Owner', value: 'business', icon: TrendingUp },
  { label: 'Retired / Passive', value: 'retired', icon: PiggyBank },
  { label: 'Mix of W-2 & 1099', value: 'mixed', icon: ChevronRight },
];

const GOALS = [
  { label: 'Retire Early (FIRE)', value: 'fire', icon: Flame, route: '/us/fire-calculator' },
  { label: 'Pay Off Student Loans', value: 'student_loans', icon: GraduationCap, route: '/us/student-loan' },
  { label: 'Maximize 401(k) / IRA', value: 'retirement', icon: PiggyBank, route: '/us/401k-calculator' },
  { label: 'Buy a Home', value: 'home', icon: Home, route: '/us/mortgage' },
  { label: 'Reduce Taxes', value: 'taxes', icon: DollarSign, route: '/us/tax-calculator' },
  { label: 'Build Investment Portfolio', value: 'investing', icon: TrendingUp, route: '/future-value' },
  { label: 'Track Net Worth', value: 'net_worth', icon: Target, route: '/net-worth' },
  { label: 'Budget & Expense Tracking', value: 'budgeting', icon: CheckCircle2, route: '/income-expense-tracker' },
];

const RECOMMENDED_TOOLS = {
  fire: { title: 'FIRE Calculator', desc: 'Find your retirement number and timeline', route: '/us/fire-calculator' },
  student_loans: { title: 'Student Loan Calculator', desc: 'Compare repayment strategies & IBR', route: '/us/student-loan' },
  retirement: { title: '401(k) Calculator', desc: 'Maximize employer match & tax savings', route: '/us/401k-calculator' },
  home: { title: 'Mortgage Calculator', desc: 'Calculate payments and affordability', route: '/bond' },
  taxes: { title: 'US Tax Calculator', desc: 'Federal + State for your situation', route: '/us/tax-calculator' },
  investing: { title: 'Future Value Calculator', desc: 'Project your investment growth', route: '/future-value' },
  net_worth: { title: 'Net Worth Tracker', desc: 'Track assets, liabilities & goals', route: '/net-worth' },
  budgeting: { title: 'Income & Expense Tracker', desc: 'Budget with US-specific categories', route: '/income-expense-tracker' },
  '1099': { title: 'Self-Employment Tax Estimator', desc: 'Calculate your true 1099 tax burden', route: '/us/self-employed' },
  business: { title: 'Self-Employment Tax Estimator', desc: 'QBI deductions, SE tax & more', route: '/us/self-employed' },
};

export const USOnboardingWizard = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    state: 'CA',
    filingStatus: 'single',
    incomeRange: '',
    employmentType: '',
    hasAccounts: { '401k': false, roth: false, hsa: false, ira: false },
    goals: [],
  });

  const totalSteps = 5;

  const update = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const toggleGoal = (g) => setProfile(p => ({
    ...p,
    goals: p.goals.includes(g) ? p.goals.filter(x => x !== g) : [...p.goals, g],
  }));
  const toggleAccount = (acct) => setProfile(p => ({
    ...p,
    hasAccounts: { ...p.hasAccounts, [acct]: !p.hasAccounts[acct] },
  }));

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    onClose(profile);
  };

  const topRecommendations = [
    ...(profile.employmentType === '1099' || profile.employmentType === 'business' ? [RECOMMENDED_TOOLS['1099']] : []),
    ...profile.goals.slice(0, 3).map(g => RECOMMENDED_TOOLS[g]).filter(Boolean),
  ].filter((v, i, a) => a.findIndex(x => x.route === v.route) === i).slice(0, 4);

  const stateList = getStateList();

  const steps = [
    {
      title: 'Welcome to Financial Advisory Pro',
      subtitle: 'Let\'s personalize your experience in 2 minutes',
      content: (
        <div className="space-y-5">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-4">
              <Flag className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Answer a few quick questions and we'll show you the most relevant tools for your financial situation.
            </p>
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Your State</Label>
              <Select value={profile.state} onValueChange={v => update('state', v)}>
                <SelectTrigger data-testid="wizard-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {stateList.map(s => (
                    <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Filing Status</Label>
              <Select value={profile.filingStatus} onValueChange={v => update('filingStatus', v)}>
                <SelectTrigger data-testid="wizard-filing-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="mfj">Married Filing Jointly</SelectItem>
                  <SelectItem value="mfs">Married Filing Separately</SelectItem>
                  <SelectItem value="hoh">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your Income & Employment',
      subtitle: 'Helps us show the most relevant tax tools',
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Annual Income Range</Label>
            <div className="grid grid-cols-2 gap-2">
              {INCOME_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => update('incomeRange', range.value)}
                  data-testid={`wizard-income-${range.value}`}
                  className={`p-3 rounded-xl border text-sm text-left transition-all ${
                    profile.incomeRange === range.value
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/40 text-foreground'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Employment Type</Label>
            <div className="space-y-2">
              {EMPLOYMENT_TYPES.map(et => {
                const Icon = et.icon;
                return (
                  <button
                    key={et.value}
                    onClick={() => update('employmentType', et.value)}
                    data-testid={`wizard-employment-${et.value}`}
                    className={`w-full p-3 rounded-xl border text-sm text-left flex items-center gap-3 transition-all ${
                      profile.employmentType === et.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/40 text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {et.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your Retirement Accounts',
      subtitle: 'We\'ll personalize your retirement planning tools',
      content: (
        <div className="space-y-3">
          {[
            { key: '401k', label: '401(k) or 403(b)', desc: 'Employer-sponsored retirement plan', color: 'indigo' },
            { key: 'roth', label: 'Roth IRA', desc: 'Tax-free retirement growth', color: 'emerald' },
            { key: 'ira', label: 'Traditional IRA', desc: 'Tax-deferred retirement savings', color: 'blue' },
            { key: 'hsa', label: 'HSA (Health Savings Account)', desc: 'Triple tax advantage account', color: 'teal' },
          ].map(acct => (
            <button
              key={acct.key}
              onClick={() => toggleAccount(acct.key)}
              data-testid={`wizard-account-${acct.key}`}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                profile.hasAccounts[acct.key]
                  ? `border-${acct.color}-500/50 bg-${acct.color}-500/10`
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div>
                <p className="font-medium text-foreground text-sm">{acct.label}</p>
                <p className="text-xs text-muted-foreground">{acct.desc}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                profile.hasAccounts[acct.key]
                  ? `border-${acct.color}-500 bg-${acct.color}-500`
                  : 'border-border'
              }`}>
                {profile.hasAccounts[acct.key] && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
            </button>
          ))}
          <p className="text-xs text-muted-foreground text-center mt-2">Select all that apply, or skip if you don't have these accounts yet</p>
        </div>
      ),
    },
    {
      title: 'Your Financial Goals',
      subtitle: 'Select everything that matters to you (pick all that apply)',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(goal => {
            const Icon = goal.icon;
            const selected = profile.goals.includes(goal.value);
            return (
              <button
                key={goal.value}
                onClick={() => toggleGoal(goal.value)}
                data-testid={`wizard-goal-${goal.value}`}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <Icon className={`h-4 w-4 mb-1.5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{goal.label}</p>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Your Personalized Toolkit',
      subtitle: 'Based on your profile, here\'s where to start:',
      content: (
        <div className="space-y-3">
          {topRecommendations.length > 0 ? (
            topRecommendations.map((tool, i) => (
              <button
                key={i}
                onClick={() => { complete(); navigate(tool.route); }}
                className="w-full p-4 rounded-xl border border-primary/30 bg-primary/5 text-left flex items-center justify-between hover:bg-primary/10 transition-colors group"
                data-testid={`wizard-tool-${i}`}
              >
                <div>
                  <p className="font-medium text-foreground text-sm">{tool.title}</p>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))
          ) : (
            [
              { title: 'US Tax Calculator', desc: 'Understand your federal + state tax burden', route: '/us/tax-calculator' },
              { title: 'Net Worth Tracker', desc: 'Start tracking your wealth today', route: '/net-worth' },
              { title: 'Budget Planner', desc: 'Set up your 50/30/20 budget', route: '/budget-planner' },
            ].map((tool, i) => (
              <button
                key={i}
                onClick={() => { complete(); navigate(tool.route); }}
                className="w-full p-4 rounded-xl border border-primary/30 bg-primary/5 text-left flex items-center justify-between hover:bg-primary/10 transition-colors group"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">{tool.title}</p>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))
          )}
          <Button
            className="w-full mt-2"
            onClick={complete}
            data-testid="wizard-complete"
          >
            Go to Dashboard
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" data-testid="us-onboarding-wizard">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs">
                <Flag className="h-3 w-3 mr-1" /> US Setup · {step + 1}/{totalSteps}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-foreground font-display">{currentStep.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{currentStep.subtitle}</p>
          </div>
          <button
            onClick={() => { complete(); }}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            data-testid="wizard-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4 max-h-[60vh] overflow-y-auto">
          {currentStep.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            data-testid="wizard-back"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-muted-foreground/30'}`}
              />
            ))}
          </div>

          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} data-testid="wizard-next">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Hook to check if wizard should show
export const useUSOnboarding = (isUS) => {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (isUS) {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        // Small delay to let the page render first
        const timer = setTimeout(() => setShowWizard(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isUS]);

  const closeWizard = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWizard(false);
  };

  return { showWizard, closeWizard };
};

export const getUSProfile = () => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export default USOnboardingWizard;
