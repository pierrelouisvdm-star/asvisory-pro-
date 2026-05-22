import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FinancialDiagnostic } from '@/components/FinancialDiagnostic';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, FileText, CheckCircle2, ArrowRight, Sparkles,
  PiggyBank, Home, Car, GraduationCap, Heart, Briefcase,
  LineChart, Target, Clock, Zap, Award, Globe,
  ChevronRight, Play, Receipt, Mail, Phone, MapPin,
  Send, Linkedin, Twitter, Building2, Loader2, Scale, AlertTriangle
} from 'lucide-react';
import logo from '../assets/logo_new.png';
import { AdvisoryProLogo } from '../components/AdvisoryProLogo';

// Calculator categories with detailed descriptions
const calculatorCategories = [
  {
    title: 'Investment Planning',
    icon: TrendingUp,
    color: 'emerald',
    calculators: [
      { name: 'Future Value Calculator', desc: 'Project investment growth over time' },
      { name: 'Fee Comparison (EAC)', desc: 'See how fees impact your returns' },
      { name: 'Compound Interest', desc: 'See the power of compounding' },
      { name: 'Monte Carlo Simulator', desc: 'Probability-based projections' },
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

// Key features with detailed benefits
const keyFeatures = [
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
    icon: GraduationCap,
    title: 'Financial Literacy Assessment',
    description: 'COFI-compliant quiz to assess your financial knowledge. 10 carefully crafted questions with scoring, explanations, and professional PDF reports.',
    highlights: ['COFI Compliant', 'Instant Scoring', 'PDF Reports'],
  },
  {
    icon: LineChart,
    title: 'Net Worth Tracker',
    description: 'Visualize your financial journey. Track assets, liabilities, set goals, and celebrate milestones. Generate beautiful progress reports.',
    highlights: ['Historical Snapshots', 'Goal Tracking', 'Smart Insights'],
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with POPIA compliance, audit trails for all data access, and complete data isolation. Your financial data is always protected.',
    highlights: ['POPIA Compliant', 'Audit Trails', 'Data Isolation'],
  },
  {
    icon: Bot,
    title: 'AI Financial Assistant',
    description: 'Get intelligent insights powered by advanced AI. Answer complex financial questions, generate explanations, and get guidance on your financial decisions.',
    highlights: ['GPT-Powered', 'SA Context Aware', 'Clear Explanations'],
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
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0a18]" />
        {/* Spotlight effect - more blue */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-to-b from-blue-500/30 via-blue-600/20 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-gradient-to-b from-sky-400/25 to-transparent rounded-full blur-[60px]" />
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col items-center text-center">
            {/* Region Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                <span className="text-lg">🇿🇦</span>
                <span className="text-sm text-slate-400">South Africa</span>
              </div>
            </div>
            
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <AdvisoryProLogo size="hero" className="text-white" />
            </div>
            
            <p className="text-sm sm:text-base tracking-[0.3em] text-slate-400 mt-3 uppercase mb-6">
              Plan Better. Track Smarter. Grow Faster.
            </p>
            
            <p className="mb-6 text-indigo-300 text-sm flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3" />
              2026/2027 Tax Year Ready
            </p>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-300 mb-6">
              The Complete Financial Planning Platform for South Africans
            </h2>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Whether you're managing your own money or running an advisory practice — we've built the tools (and the AI copilot) to do it better. 
              <span className="text-white font-medium"> Localized for SA regulations.</span>
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center group">
                  <p className="text-3xl font-bold text-indigo-400 group-hover:scale-110 transition-transform">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Dual Role CTAs */}
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl w-full mb-6">
              <Link to="/auth" className="group" data-testid="hero-cta-individual">
                <div className="h-full p-6 rounded-2xl border-2 border-slate-700 bg-slate-900/40 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">For Individuals</div>
                      <div className="text-xs text-emerald-400 font-medium">R299/mo · R1,499/yr</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    AI-powered tools to manage your money, plan retirement, optimise tax and grow wealth.
                  </p>
                  <div className="inline-flex items-center text-sm text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
                    Start managing my money <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>

              <Link to="/auth" className="group" data-testid="hero-cta-advisor">
                <div className="h-full p-6 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-900/30 to-slate-900/40 hover:border-indigo-400 transition-all text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">For Financial Advisors</div>
                      <div className="text-xs text-indigo-300 font-medium">R999/mo · R6,999/yr</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    AI Copilot for your practice: branded client reports, CRM, compliance notes, and admin automation.
                  </p>
                  <div className="inline-flex items-center text-sm text-indigo-300 font-medium group-hover:translate-x-1 transition-transform">
                    Run my practice smarter <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </div>

            <a href="#diagnostic">
              <Button size="lg" variant="outline" className="text-base px-6 border-amber-400/50 text-amber-300 hover:bg-amber-500/10 h-12 group">
                <Target className="mr-2 h-5 w-5" />
                Or take the free diagnostic first
              </Button>
            </a>

            <p className="mt-4 text-xs text-slate-500">
              7-day refund policy · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Is This App For Me? CTA Section */}
      <section className="py-16 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 border-y border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-6">
            <Target className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Is This App For Me?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Not sure if AdvisoryPro is right for you? Take our free 2-minute diagnostic to discover your financial control score and see exactly where you stand.
          </p>
          <a href="#diagnostic">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg px-8 h-14 shadow-lg shadow-amber-500/25">
              <Target className="mr-2 h-5 w-5" />
              Take the Free Diagnostic
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            No signup required • Get instant results • Personalized recommendations
          </p>
        </div>
      </section>

      {/* Financial Diagnostic Tool Section */}
      <section id="diagnostic" className="py-20 bg-gradient-to-b from-background to-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialDiagnostic onStartTrial={() => navigate('/auth')} />
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="relative bg-muted/50 border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-sm font-medium uppercase tracking-wide mb-3">
              Why Choose Us
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Not just a calculator. A structured way to take control of your finances.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Plan with Confidence */}
            <div className="bg-background/50 border border-border rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Plan with Confidence</h3>
              <p className="text-muted-foreground">
                Make informed decisions using over 20 financial calculators designed for real-life scenarios.
              </p>
            </div>
            
            {/* Optimise Your Tax */}
            <div className="bg-background/50 border border-border rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Optimise Your Tax</h3>
              <p className="text-muted-foreground">
                Stay ahead with a fully integrated Tax Planning Hub built around South African tax rules.
              </p>
            </div>
            
            {/* Track Your Progress */}
            <div className="bg-background/50 border border-border rounded-xl p-6 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Track Your Progress</h3>
              <p className="text-muted-foreground">
                Monitor your net worth, income, and expenses in one clear, structured view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-wide mb-3">
              Built For You
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Who It's For
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Financial Advisors */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">For Financial Advisors</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Save time on calculations and planning. Deliver clearer outputs. Focus on clients, not admin.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  Professional PDF reports for clients
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  SARS-compliant tax calculations
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  Fee comparison & scenario modeling
                </li>
              </ul>
            </div>
            
            {/* For Individuals */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">For Individuals</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Understand your financial position. Make better decisions. Build long-term wealth with structure.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  Track net worth over time
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  Retirement & investment planning
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  AI-powered receipt scanning
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tax Hub Feature Highlight */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Receipt className="h-3 w-3 mr-1" />
                Featured: Tax Planning Hub
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                The Most Complete <span className="text-emerald-400">Tax Planning Suite</span> for South Africans
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Everything you need to understand, plan, and optimize your taxes - updated for the 2026/2027 tax year with the latest SARS brackets, rebates, and thresholds.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { title: 'Income Tax Calculator', desc: 'All 7 tax brackets with rebates' },
                  { title: 'Capital Gains Tax', desc: 'CGT with R50,000 annual exclusion' },
                  { title: 'Medical Aid Credits', desc: 'Calculate your tax credits' },
                  { title: 'RA Tax Savings', desc: 'Maximize your 27.5% deduction' },
                  { title: 'Provisional Tax', desc: 'Estimate your payments' },
                  { title: 'Income & Expense Tracker', desc: 'NEW: Track your finances' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/tax-planning">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Receipt className="mr-2 h-5 w-5" />
                    Open Tax Hub
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
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
              20+ Professional Calculators
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Every Calculation You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From retirement planning to estate duty, all localized for South African regulations with the latest SARS tax brackets and Prime Rate.
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
            One Plan. Everything Included.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            No hidden fees, no feature restrictions. Get full access to every tool for one simple monthly price.
          </p>
          
          <Card className="bg-gradient-to-br from-primary/5 to-card border-2 border-primary/50 max-w-lg mx-auto">
            <CardContent className="p-8">
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">R299</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              
              <ul className="space-y-3 text-left mb-8">
                {[
                  'All 20 Financial Calculators',
                  'Tax Planning Hub (2026/27)',
                  'Weekly Market Updates by Analysts',
                  'Tips from Certified Financial Planners',
                  'Income & Expense Tracker',
                  'Professional PDF Reports',
                  'AI Financial Assistant',
                ].map((feature, idx) => (
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
                Cancel anytime • Have a coupon code? Enter it at signup
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
              Empowering South Africans to Plan Smarter
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Whether you're a professional advisor or managing your own finances, Financial Advisory Pro provides the tools you need - designed specifically for the South African market.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                To provide South Africans with world-class financial planning tools that save time, reduce errors, and help build lasting wealth.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every feature in Financial Advisory Pro is built with the South African regulatory environment in mind - from SARS tax brackets to retirement fund rules. We would like to be a partner in achieving your financial freedom.
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
                  desc: 'POPIA compliant with bank-level security for all your data.' 
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
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Phone</p>
                        <a href="tel:+27737599863" className="text-muted-foreground hover:text-primary transition-colors">
                          073 759 9863
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Location</p>
                        <p className="text-muted-foreground">
                          Cape Town, South Africa
                        </p>
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

      {/* Special Annual Pricing Banner */}
      <section className="py-12 bg-gradient-to-r from-emerald-500/10 via-emerald-600/20 to-emerald-500/10 border-y border-emerald-500/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Limited Time Offer
                </Badge>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                Annual Plan: <span className="text-emerald-400">R1,499</span>
              </h3>
              <p className="text-muted-foreground">
                That's only <span className="text-emerald-400 font-semibold">R125/month</span> — Save R2,089 vs monthly!
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link to="/auth">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-14 shadow-lg shadow-emerald-500/25">
                  Get Annual Plan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">7-day refund policy • One-time payment</p>
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
            R299/month (cancel anytime) or{' '}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              R1,499/year — Save R2,089!
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">7-day refund policy on annual plan</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">A</span>
                </div>
                <span className="text-foreground font-bold text-xl">Financial Advisory Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional financial planning tools built for South African regulations.
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
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
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
                <li>
                  <a href="tel:+27737599863" className="hover:text-primary transition-colors">
                    073 759 9863
                  </a>
                </li>
                <li>Cape Town, South Africa</li>
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
