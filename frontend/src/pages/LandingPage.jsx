import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { JurisdictionSelector } from '@/components/JurisdictionSelector';
import { useJurisdiction } from '@/context/JurisdictionContext';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, FileText, CheckCircle2, ArrowRight, Sparkles,
  PiggyBank, Home, Car, GraduationCap, Heart,
  LineChart, Target, Clock, Zap, Award, Globe,
  ChevronRight, Play, Receipt, Mail,
  Send, Linkedin, Twitter, Building2, Loader2, Scale, AlertTriangle, Flame, DollarSign, Flag,
  FileCheck, Wallet
} from 'lucide-react';
import logo from '../assets/logo_new.png';
import heroFinanceBg from '../assets/hero-finance-bg.jpg';
import landingPhotoBanner from '../assets/landing-photo-banner.jpg';
import { AdvisoryProLogo } from '../components/AdvisoryProLogo';
import { INSTALL_PROMPT_REQUEST_EVENT } from '@/components/InstallPrompt';
import CountdownTimer from '@/components/CountdownTimer';
import SEOHead from '@/components/SEOHead';

// SA Calculator categories
const SA_CALCULATOR_CATEGORIES = [
  {
    title: 'Investment Planning',
    icon: TrendingUp,
    color: 'emerald',
    calculators: [
      { name: 'Future Value Calculator', desc: 'Project investment growth over time' },
      { name: 'Fee Comparison (EAC)', desc: 'See how fees impact your returns' },
      { name: 'Compound Interest', desc: 'See the power of compounding' },
      { name: 'TFSA Calculator', desc: 'Maximize tax-free growth' },
    ]
  },
  {
    title: 'Tax Planning',
    icon: Receipt,
    color: 'blue',
    calculators: [
      { name: 'Tax Planning Hub', desc: 'Complete 2026/2027 tax suite with PDF reports' },
      { name: 'Income Tax Calculator', desc: 'SARS tax bracket calculations' },
      { name: 'RA Tax Savings', desc: 'Maximize contributions' },
    ]
  },
  {
    title: 'Protection Planning',
    icon: Shield,
    color: 'amber',
    calculators: [
      { name: 'Life Insurance', desc: '10x salary recommendations' },
      { name: 'Income Disability', desc: 'Protect earning capacity' },
      { name: 'Emergency Fund', desc: 'Build your safety net' },
    ]
  },
  {
    title: 'Retirement & Debt',
    icon: PiggyBank,
    color: 'purple',
    calculators: [
      { name: 'Retirement Planner', desc: 'Plan for financial independence' },
      { name: 'Living Annuity', desc: 'Sustainable drawdown rates' },
      { name: 'Bond & Debt Payoff', desc: 'SA Prime Rate integrated' },
    ]
  },
];

// US Calculator categories
const US_CALCULATOR_CATEGORIES = [
  {
    title: 'Tax & Income',
    icon: DollarSign,
    color: 'emerald',
    calculators: [
      { name: 'Federal + State Tax Calculator', desc: 'All 50 states, real 2024 brackets' },
      { name: 'Self-Employment Tax Estimator', desc: 'QBI, SE tax & all deductions' },
      { name: 'Capital Gains Calculator', desc: 'Short-term vs long-term rates' },
      { name: 'Budget Planner', desc: 'The 50/30/20 rule for Americans' },
    ]
  },
  {
    title: 'Retirement Accounts',
    icon: PiggyBank,
    color: 'blue',
    calculators: [
      { name: '401(k) Calculator', desc: 'Maximize employer match & tax savings' },
      { name: 'Roth IRA Calculator', desc: 'Tax-free growth projections' },
      { name: 'HSA Calculator', desc: 'Triple tax advantage strategy' },
      { name: 'Social Security Estimator', desc: 'Optimize your claiming age' },
    ]
  },
  {
    title: 'Protection Planning',
    icon: Shield,
    color: 'amber',
    calculators: [
      { name: 'Life Insurance (DIME)', desc: 'Calculate your coverage needs' },
      { name: 'Emergency Fund', desc: 'Build your financial safety net' },
      { name: 'Student Loan Payoff', desc: 'IBR, PSLF & refinancing compare' },
    ]
  },
  {
    title: 'FIRE & Wealth',
    icon: Flame,
    color: 'orange',
    calculators: [
      { name: 'FIRE Calculator', desc: 'Lean, Regular, Fat & Coast FIRE' },
      { name: 'Net Worth Tracker', desc: 'Assets, liabilities & wealth score' },
      { name: 'Mortgage Calculator', desc: 'Payments, amortization & equity' },
      { name: '529 College Savings', desc: 'Education funding with tax benefits' },
    ]
  },
];

// Key features with detailed benefits
const SA_KEY_FEATURES = [
  {
    icon: Scale,
    title: 'Fee Comparison Tool',
    description: 'See how fees erode your returns over time. Compare up to 3 investment options with different EACs and visualize the long-term impact of TERs, platform fees, and advisor fees.',
    highlights: ['EAC Analysis', 'Visual Charts', 'PDF Reports'],
  },
  {
    icon: Receipt,
    title: 'Tax Planning Hub',
    description: 'Complete tax planning suite with PDF exports. Income tax, CGT, medical credits, provisional tax, and RA deductibility calculators - all with helpful tooltips explaining SA tax concepts.',
    highlights: ['6 Tax Calculators', 'PDF Reports', 'Medical Credits'],
  },
  {
    icon: Calculator,
    title: '20+ Professional Calculators',
    description: 'From retirement planning to estate duty, every calculation you need. All localized for South African regulations, tax brackets, and the current Prime Rate.',
    highlights: ['SA Tax Brackets', 'Estate Duty', 'Living Annuity Limits'],
  },
  {
    icon: LineChart,
    title: 'Net Worth Tracker',
    description: 'Visualize your financial journey. Track assets, liabilities, set goals, and celebrate milestones. Generate beautiful progress reports.',
    highlights: ['Historical Snapshots', 'Goal Tracking', 'Smart Insights'],
  },
  {
    icon: Bot,
    title: 'AI Financial Assistant',
    description: 'Get intelligent insights powered by advanced AI. Answer complex financial questions, generate explanations, and get guidance on your financial decisions.',
    highlights: ['GPT-Powered', 'SA Context Aware', 'Clear Explanations'],
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data is encrypted in transit and at rest, with full audit trails and strict data isolation between accounts.',
    highlights: ['Encrypted', 'Audit Trails', 'Data Isolation'],
  },
  {
    icon: GraduationCap,
    title: 'Financial Literacy Assessment',
    description: 'A quick quiz to gauge financial knowledge. 10 questions with scoring, explanations, and a professional PDF report.',
    highlights: ['Instant Scoring', 'Explanations', 'PDF Reports'],
  },
];

const US_KEY_FEATURES = [
  {
    icon: DollarSign,
    title: 'US Tax Suite (All 50 States)',
    description: 'Federal + State taxes for all 50 states, self-employment tax with QBI deductions, built on real 2024 IRS brackets.',
    highlights: ['All 50 States', 'QBI Deduction', '1099 / SE Tax'],
  },
  {
    icon: Flame,
    title: 'FIRE & Retirement Planning',
    description: 'Find your Financial Independence number. Model Lean, Fat & Coast FIRE. Optimize 401(k), Roth IRA, HSA, and Social Security claiming age.',
    highlights: ['FIRE Calculator', '401(k) + Roth IRA', 'HSA Strategy'],
  },
  {
    icon: GraduationCap,
    title: 'Student Loan Payoff',
    description: 'Compare Standard, Extended, IBR/SAVE repayment. Model PSLF forgiveness. See exactly how much extra payments save over 10-25 years.',
    highlights: ['IBR/SAVE Plan', 'PSLF Calculator', 'Refinance Compare'],
  },
  {
    icon: Calculator,
    title: '30+ Professional Calculators',
    description: 'From mortgage amortization to net worth tracking, every financial calculation you need, built for American households and advisors.',
    highlights: ['Mortgage Calculator', 'Auto Loan', '529 College Savings'],
  },
  {
    icon: LineChart,
    title: 'Net Worth & Budget Tracker',
    description: 'Track assets, liabilities, set financial milestones, and monitor your wealth growth over time, denominated in USD with US-specific categories.',
    highlights: ['Dollar-Denominated', 'Budget Tracking', 'Goal Milestones'],
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Encrypted in transit and at rest, with full audit trails and complete data isolation between accounts.',
    highlights: ['Encrypted', 'Audit Trails', 'Data Isolation'],
  },
  {
    icon: Bot,
    title: 'AI Financial Assistant',
    description: 'Ask complex US tax and financial planning questions. Get instant answers about 401(k) limits, Roth conversions, FIRE numbers, and more.',
    highlights: ['GPT-Powered', 'US Tax Aware', 'Clear Explanations'],
  },
];

// Stats
const stats = [
  { value: '20+', label: 'Financial Calculators' },
  { value: 'Tax Hub', label: 'Complete Tax Suite' },
  { value: '24/7', label: 'Access Anywhere' },
  { value: 'PDF', label: 'Instant Reports' },
];

// Contact Form Component
const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission (replace with actual API call if needed)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="contact-name-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            data-testid="contact-email-input"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          placeholder="How can we help?"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
          data-testid="contact-subject-input"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          placeholder="Tell us more about your inquiry..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={5}
          required
          data-testid="contact-message-input"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        disabled={isSubmitting}
        data-testid="contact-submit-btn"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
};

export const LandingPage = () => {
  const { isUS } = useJurisdiction();

  const calculatorCategories = isUS ? US_CALCULATOR_CATEGORIES : SA_CALCULATOR_CATEGORIES;
  const keyFeatures = isUS ? US_KEY_FEATURES : SA_KEY_FEATURES;

  const heroContent = isUS ? {
    tagline: 'Advisor-Level Tools. Without the Advisor.',
    badge: '2025 Tax Year · All 50 States',
    headline: 'Every Financial Calculator. One Intelligent Platform.',
    sub: 'Make better financial decisions, faster. 30+ professional-grade tools for tax planning, FIRE, retirement, RSUs, real estate, and more, built on 2025 IRS data.',
    stats: [
      { value: '30+', label: 'Financial Tools' },
      { value: 'All 50', label: 'States Covered' },
      { value: 'FIRE', label: 'Retirement Planning' },
      { value: 'PDF', label: 'Instant Reports' },
    ],
    price: '$19/month',
    priceAnnual: '$99 one-time',
    priceNote: 'or $99 one-time (limited offer, reg. $149)',
  } : {
    tagline: 'Built for South African Financial Advisers',
    badge: '2026/2027 Tax Year Ready',
    headline: 'The Financial Planning Toolkit Built for South African Advisers',
    sub: '20+ calculators, a complete 2026/27 Tax Hub, client-ready PDF reports, and an AI assistant, all in one platform. Powerful enough for sophisticated individual investors too.',
    stats: [
      { value: '20+', label: 'Financial Calculators' },
      { value: 'Tax Hub', label: 'Complete Tax Suite' },
      { value: '24/7', label: 'Access Anywhere' },
      { value: 'PDF', label: 'Instant Reports' },
    ],
    price: 'R299/month',
    priceAnnual: 'R1,999/year',
    priceNote: 'or R1,999/year, save R1,589',
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isUS ? "AdvisoryPro, Every Financial Calculator. One Intelligent Platform." : "AdvisoryPro, Professional Financial Planning for South Africans"}
        description={isUS
          ? "Make better financial decisions, faster. 30+ professional financial calculators for Americans. 2025 IRS brackets, FIRE planning, RSU taxes, home affordability, Medicare IRMAA."
          : "20+ professional financial calculators for South Africans. SA Tax Hub, RA, TFSA, CGT, retirement planning, updated for 2026/2027 tax year."
        }
        path="/welcome"
        keywords={isUS
          ? "financial calculators 2025, FIRE calculator, tax calculator 2025, RSU tax calculator, home affordability, financial independence"
          : "South African financial calculators, SA tax calculator, TFSA calculator, RA tax savings, CGT calculator South Africa"
        }
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#070a0f]">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroFinanceBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a0f]/50 via-[#070a0f]/85 to-[#070a0f]" />
        {/* Emerald glow */}
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[480px] bg-emerald-500/20 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-10 lg:pb-16">
          {/* Slim top row: logo + region + sign in */}
          <div className="flex items-center justify-between mb-14 lg:mb-20">
            <AdvisoryProLogo size="small" className="text-white" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <JurisdictionSelector />
              </div>
              <Link to="/auth">
                <Button size="sm" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-[#06120a] font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Split hero content */}
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="font-mono text-xs tracking-[0.18em] uppercase text-emerald-400/90 flex items-center gap-2 mb-5">
                <span className="inline-block w-4 h-[2px] bg-emerald-500" />
                {heroContent.tagline}
              </p>

              <div className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-200/80 text-xs">
                <Sparkles className="h-3 w-3" />
                {heroContent.badge}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-white leading-[1.08] mb-6">
                {isUS ? (
                  <>Every calculator.<br />One <span className="text-emerald-400">intelligent</span> platform.</>
                ) : (
                  <>The adviser toolkit<br />that just <span className="text-emerald-400">works.</span></>
                )}
              </h1>

              <p className="text-lg text-slate-400 max-w-xl mb-8 leading-relaxed">
                {isUS ? (
                  <>Make <span className="text-white font-medium">better financial decisions</span>, faster. 30+ professional-grade tools for <span className="text-white font-medium">tax planning, FIRE, RSUs, real estate</span>, and more, built on 2025 IRS data.</>
                ) : (
                  <>Give every client a clear, professional plan. <span className="text-white font-medium">20+ calculators</span>, a complete Tax Hub, and <span className="text-white font-medium">client-ready PDF reports</span>, built for South African advisers, and just as capable in the hands of a sophisticated individual investor.</>
                )}
              </p>

              <div className="flex flex-wrap gap-4 mb-6">
                <Link to="/auth">
                  <Button size="lg" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-[#06120a] font-semibold text-base px-8 h-14 shadow-lg shadow-emerald-500/20 group">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline-gold" className="rounded-full text-base px-8 h-14 border-gold/40 group">
                    <Play className="mr-2 h-5 w-5" />
                    Explore the Platform
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                {isUS ? '$19/month or $99 one-time (Limited offer!) • Have a coupon? Apply at signup' : 'R299/month or R1,999/year (Save R1,589!) • Have a coupon? Apply at signup'}
              </p>
            </div>

            {/* Live readout panel */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">Live Readout</span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-1">
                {isUS ? 'Client: J. Carter · 401(k) review' : 'Client: J. Naidoo · RA review'}
              </p>
              <p className="font-display text-3xl font-bold text-white mb-5">
                {isUS ? 'Ready 81/100' : 'Ready 72/100'}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {heroContent.stats.slice(0, 2).map((stat, idx) => (
                  <div key={idx} className="rounded-xl bg-black/30 border border-white/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="font-display text-lg font-bold text-white mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-4 py-3">
                <span className="text-xs text-slate-400">Report status</span>
                <span className="font-display text-sm font-bold text-emerald-400">PDF ready</span>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-14 lg:mt-20 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
            {heroContent.stats.map((stat, idx) => (
              <span key={idx} className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                <span className="text-slate-300 font-semibold">{stat.value}</span> {stat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Product Tour — see the actual software, not just feature cards */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-wide mb-3">
              See It In Action
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              From calculation to client-ready report
            </h2>
          </div>

          <div className="space-y-20">
            {/* 1. Tax Hub */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Receipt className="h-3 w-3 mr-1" />
                  {isUS ? 'US Tax Suite' : 'Tax Planning Hub'}
                </Badge>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                  {isUS
                    ? <>The <span className="text-emerald-400">complete US tax suite</span>, all 50 states</>
                    : <>The <span className="text-emerald-400">complete Tax Planning Suite</span> for 2026/27</>
                  }
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {isUS
                    ? 'Federal + state income tax, capital gains, AMT, self-employment tax, built on 2025 IRS brackets.'
                    : 'Income tax, CGT, medical aid credits, provisional tax, and RA deductibility, all with the latest SARS brackets and rebates.'
                  }
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/tax-planning">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Receipt className="mr-2 h-5 w-5" />
                      Open Tax Hub
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-emerald-500/20 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-slate-500">Tax Planning Hub</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-xs text-emerald-400 mb-1">2026/2027 Tax Year</p>
                    <p className="text-2xl font-bold text-white">Income Tax Calculator</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-400">Taxable Income</p>
                        <p className="text-lg font-semibold text-white">R 650,000</p>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-400">Tax Payable</p>
                        <p className="text-lg font-semibold text-emerald-400">R 142,531</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 text-center">
                      <p className="text-xs text-blue-400">CGT</p>
                      <p className="text-sm font-bold text-white">18%</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20 text-center">
                      <p className="text-xs text-purple-400">RA Cap</p>
                      <p className="text-sm font-bold text-white">R430k</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 text-center">
                      <p className="text-xs text-amber-400">TFSA</p>
                      <p className="text-sm font-bold text-white">R46k</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
                    <span>6 Tax Tools • PDF Export • 2026/27 Updated</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Premium</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Fee Comparison Calculator */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Scale className="h-3 w-3 mr-1" />
                  Fee Comparison
                </Badge>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                  Show clients exactly what <span className="text-blue-400">fees cost them</span>
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Compare up to three investment options side by side, EAC, TER, platform and advisor fees, and visualize the long-term impact in a single chart.
                </p>
              </div>
              <div className="lg:order-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-blue-500/20 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-slate-500">Fee Comparison</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Option A — 2.1% EAC', value: 62, color: 'bg-red-500' },
                    { label: 'Option B — 1.3% EAC', value: 81, color: 'bg-amber-500' },
                    { label: 'Option C — 0.6% EAC', value: 100, color: 'bg-emerald-500' },
                  ].map((bar, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{bar.label}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden">
                        <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.value}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                    <span>Projected value after 20 years</span>
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">Premium</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Generated PDF Report */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <FileCheck className="h-3 w-3 mr-1" />
                  Client Reports
                </Badge>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                  Turn any calculation into a <span className="text-purple-400">client-ready PDF</span>
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Every calculator exports a branded, professional report in one click, ready to send straight to a client's inbox.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-purple-500/20 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">A</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">AdvisoryPro Report</span>
                  </div>
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="h-16 rounded bg-purple-100 flex items-end p-2">
                      <div className="w-full h-8 rounded-sm bg-purple-400" />
                    </div>
                    <div className="h-16 rounded bg-purple-100 flex items-end p-2">
                      <div className="w-full h-12 rounded-sm bg-purple-500" />
                    </div>
                    <div className="h-16 rounded bg-purple-100 flex items-end p-2">
                      <div className="w-full h-4 rounded-sm bg-purple-300" />
                    </div>
                  </div>
                  <div className="h-2 w-full rounded bg-slate-100" />
                  <div className="h-2 w-5/6 rounded bg-slate-100" />
                  <div className="h-2 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            {/* 4. Net Worth Dashboard */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Wallet className="h-3 w-3 mr-1" />
                  Net Worth Tracker
                </Badge>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                  Track <span className="text-amber-400">assets, liabilities and progress</span> over time
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Historical snapshots, goal tracking, and a clear view of the whole financial picture, not just a single calculation.
                </p>
              </div>
              <div className="lg:order-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-amber-500/20 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-slate-500">Net Worth Tracker</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">Total Net Worth</p>
                <p className="text-2xl font-bold text-white mb-3">R 3,247,500</p>
                <div className="flex items-end gap-1.5 h-16 mb-3">
                  {[40, 48, 45, 58, 62, 70, 85].map((h, idx) => (
                    <div key={idx} className="flex-1 rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-400" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
                  <span className="text-emerald-400">+12.4% this quarter</span>
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">Premium</Badge>
                </div>
              </div>
            </div>

            {/* 5. AI Assistant */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Assistant
                </Badge>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                  An <span className="text-indigo-400">AI assistant</span> that understands {isUS ? 'US tax rules' : 'SA tax rules'}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Ask complex planning questions and get clear, {isUS ? 'IRS-aware' : 'SARS-aware'} explanations in seconds, right inside the platform.
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-indigo-500/20 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-slate-500">AI Assistant</span>
                </div>
                <div className="space-y-3">
                  <div className="ml-auto max-w-[75%] bg-indigo-600 rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p className="text-sm text-white">{isUS ? 'How much can I contribute to my 401(k) this year?' : 'How much can I deduct for my RA this year?'}</p>
                  </div>
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="bg-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                      <p className="text-sm text-slate-200">
                        {isUS
                          ? 'For 2025, the 401(k) employee contribution limit is $23,500, plus a $7,500 catch-up if you\'re 50+...'
                          : 'You can deduct up to 27.5% of your taxable income, capped at R430,000 for the 2026/27 tax year...'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Banner — real photography, Threshold-style dark overlay */}
      <section className="relative py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative rounded-3xl overflow-hidden min-h-[320px] flex items-end bg-cover bg-center p-8 sm:p-10"
            style={{ backgroundImage: `url(${landingPhotoBanner})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 mb-2">
                Built for the work advisers actually do
              </p>
              <p className="font-display text-xl sm:text-2xl font-bold text-white max-w-xl">
                Every number explained, every report sent, before the client leaves the room.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Categories */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="mb-4 text-blue-500 text-sm font-medium uppercase tracking-wide flex items-center justify-center gap-2">
              <Calculator className="h-4 w-4" />
              {isUS ? '30+ Professional Calculators' : '20+ Professional Calculators'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Every Calculation You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isUS
                ? 'From FIRE planning to capital gains tax, every calculation built for American financial decisions, 2025 IRS brackets (Rev. Proc. 2024-40), all 50 states.'
                : 'From retirement planning to estate duty, all localized for South African regulations with the latest SARS tax brackets and Prime Rate.'
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {calculatorCategories.map((category, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-colors
                    ${category.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20' : ''}
                    ${category.color === 'blue' ? 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20' : ''}
                    ${category.color === 'amber' ? 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20' : ''}
                    ${category.color === 'purple' ? 'bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20' : ''}
                  `}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-3 group-hover:text-primary transition-colors">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.calculators.map((calc, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="text-foreground">{calc.name}</span>
                        <p className="text-muted-foreground text-xs">{calc.desc}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm">
              Plus: Education Savings, Estate Planning, Monte Carlo Simulations, Cash Flow Projections & more
            </p>
          </div>
        </div>
      </section>

      {/* Feature Deep Dives */}
      <section className="relative py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="mb-4 text-amber-500 text-sm font-medium uppercase tracking-wide flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" />
              Powerful Features
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Built for How You Actually Work
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to save you time and help you make smarter financial decisions
            </p>
          </div>

          <div className="space-y-8">
            {keyFeatures.map((feature, index) => (
              <div 
                key={index}
                className={`flex flex-col lg:flex-row gap-8 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, idx) => (
                      <span key={idx} className="text-xs text-primary border-b border-primary/30 pb-0.5">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="bg-muted/50 border border-border rounded-2xl p-8 h-48 flex items-center justify-center">
                    <feature.icon className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 text-primary text-sm font-medium uppercase tracking-wide">
            Simple Pricing
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            {isUS ? 'One Plan. Everything Included.' : <>Everything. <span className="text-emerald-500">R299/month.</span></>}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            No hidden fees, no feature restrictions. Get full access to every tool for one simple monthly price.
          </p>
          
          <Card className="bg-gradient-to-br from-primary/5 to-card border-2 border-primary/50 max-w-lg mx-auto">
            <CardContent className="p-8">
              {isUS ? (
                <div className="mb-6">
                  <div className="inline-block bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1 text-xs font-semibold text-amber-500 mb-3">
                    LIMITED TIME OFFER
                  </div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-foreground">$99</span>
                    <span className="text-muted-foreground">one-time</span>
                  </div>
                  <p className="text-emerald-500 text-sm mt-1">Full year access · Regular price $149</p>
                  <p className="text-xs text-muted-foreground mt-1">or $19/month, cancel anytime</p>
                  <div className="mt-3">
                    <CountdownTimer label="Price goes up in" />
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">R299</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                  <p className="text-emerald-500 text-sm mt-1">or R1,999/year, save R1,589</p>
                </div>
              )}

              <ul className="space-y-3 text-left mb-8">
                {(isUS ? [
                  'All 30+ US Financial Calculators',
                  'US Tax Suite (Federal + All 50 States)',
                  'FIRE Calculator, Lean, Fat & Coast FIRE',
                  'RSU, AMT, Paycheck & Capital Gains Tax',
                  'Home Affordability & Rent vs Buy',
                  'Professional PDF Reports',
                  'AI Financial Assistant',
                ] : [
                  '20+ Calculators',
                  '2026/27 Tax Hub',
                  'Professional Reports',
                  'Planning Tools',
                  'AI Assistant',
                  'No feature restrictions',
                ]).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/auth">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg h-14">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <p className="mt-4 text-sm text-muted-foreground">
                {isUS ? 'Secure checkout • Have a coupon code? Enter it at signup' : 'R299/month. Cancel anytime • Have a coupon code? Enter it at signup'}
              </p>
            </CardContent>
          </Card>
          
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border inline-block">
            <p className="text-muted-foreground text-sm">
              <Users className="h-4 w-4 inline mr-2" />
              Need licenses for your team?{' '}
              <a href="mailto:bulk@advisorypro.co.za" className="text-primary hover:underline">
                Contact us for bulk licensing
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="relative py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="mb-4 text-emerald-500 text-sm font-medium uppercase tracking-wide flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4" />
              About Us
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              {isUS ? 'Empowering Americans to Plan Smarter' : 'Empowering South Africans to Plan Smarter'}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              {isUS
                ? 'Whether you\'re a financial advisor or managing your own finances, Financial Advisory Pro provides the tools you need, built for the American market.'
                : 'Whether you\'re a professional advisor or managing your own finances, Financial Advisory Pro provides the tools you need, designed specifically for the South African market.'
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {isUS
                  ? 'To provide Americans with world-class financial planning tools that save time, reduce errors, and help build lasting wealth.'
                  : 'To provide South Africans with world-class financial planning tools that save time, reduce errors, and help build lasting wealth.'
                }
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {isUS
                  ? 'Every feature in Financial Advisory Pro is built with the American financial environment in mind, from IRS tax brackets to 401(k) rules. We would like to be a partner in achieving your financial freedom.'
                  : 'Every feature in Financial Advisory Pro is built with the South African regulatory environment in mind - from SARS tax brackets to retirement fund rules. We would like to be a partner in achieving your financial freedom.'
                }
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-3xl font-bold text-primary">2025</p>
                  <p className="text-sm text-muted-foreground">Founded</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-3xl font-bold text-primary">20+</p>
                  <p className="text-sm text-muted-foreground">Financial Calculators</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Values</h3>
              {[
                { 
                  icon: Target, 
                  title: 'Accuracy First', 
                  desc: 'Every calculation is verified against current SA regulations and tax laws.' 
                },
                {
                  icon: Shield,
                  title: 'Security & Privacy',
                  desc: 'Your data is encrypted and access-controlled, handled with POPIA\'s principles in mind.'
                },
                { 
                  icon: Zap, 
                  title: 'Continuous Innovation', 
                  desc: 'Regular updates to stay current with regulatory changes and new features.' 
                },
                { 
                  icon: Users, 
                  title: 'User-Focused', 
                  desc: 'Built by users, for users. We listen to your feedback.' 
                },
              ].map((value, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="mb-4 text-blue-500 text-sm font-medium uppercase tracking-wide flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Us
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about Financial Advisory Pro? Want to discuss bulk licensing for your team? We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                <h3 className="font-display text-xl font-bold text-foreground mb-6">Send us a Message</h3>
                <ContactForm />
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <a href="mailto:support@advisorypro.co.za" className="text-muted-foreground hover:text-primary transition-colors">
                          support@advisorypro.co.za
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    <a 
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a 
                      href="https://twitter.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-muted/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-emerald-400 text-sm font-medium uppercase tracking-wide mb-4">
            Start Today
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            Start planning smarter today.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take control of your finances with tools designed for real-world decisions.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xl px-12 h-16 shadow-lg shadow-primary/25">
              Get Started
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">
            {isUS ? '$19/month or $99 one-time (limited offer) • Secure checkout' : 'R299/month or R1,999/year • Cancel anytime'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">A</span>
                </div>
                <span className="text-foreground font-bold text-xl">Financial Advisory Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional financial planning tools built for {isUS ? 'American' : 'South African'} regulations.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Calculators</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Retirement Planning</li>
                <li>Life Insurance</li>
                <li>Bond Calculator</li>
                <li>Tax Calculator</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#about" className="hover:text-primary transition-colors">About Us</a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:support@advisorypro.co.za" className="hover:text-primary transition-colors">
                    support@advisorypro.co.za
                  </a>
                </li>
                <li className="sm:hidden">
                  <button
                    onClick={() => window.dispatchEvent(new Event(INSTALL_PROMPT_REQUEST_EVENT))}
                    className="hover:text-primary transition-colors"
                  >
                    Install App
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Important Disclaimer */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="bg-slate-900/50 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <p className="font-medium text-slate-300 mb-2">Important Disclaimer</p>
                  <p className="mb-2">
                    Financial Advisory Pro is <strong className="text-slate-300">financial software</strong> designed for informational and educational purposes only. 
                    The calculators, tools, and content provided do not constitute financial, investment, tax, or legal advice.
                  </p>
                  <p>
                    We strongly recommend that you consult with a <strong className="text-slate-300">qualified professional financial advisor</strong>, 
                    tax consultant, or other appropriate professional before making any financial decisions based on 
                    information obtained from this software.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <p className="text-sm text-muted-foreground">
              © 2026 Financial Advisory Pro. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
