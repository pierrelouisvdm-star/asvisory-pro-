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
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, FileText, CheckCircle2, ArrowRight, Sparkles,
  PiggyBank, Home, Car, GraduationCap, Heart, Briefcase,
  LineChart, Target, Clock, Zap, Award, Globe,
  ChevronRight, Play, Receipt, Mail, Phone, MapPin,
  Send, Linkedin, Twitter, Building2, Loader2, Scale
} from 'lucide-react';
import logo from '../assets/logo_new.png';

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
    title: '19+ Professional Calculators',
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
  { value: '19+', label: 'Financial Calculators' },
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
            {/* Region Selector - for future jurisdictions */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Select your region:</span>
                <JurisdictionSelector />
              </div>
            </div>
            
            {/* CSS-based Logo - perfectly integrated */}
            <div className="mb-8">
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white tracking-tight">
                Financial Advisory Pro
              </h1>
              <p className="text-sm sm:text-base tracking-[0.3em] text-slate-400 mt-3 uppercase">
                Empower Your Financial Future
              </p>
            </div>
            
            <p className="mb-6 text-indigo-300 text-sm flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3" />
              2026/2027 Tax Year Ready
            </p>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-300 mb-6">
              The Complete Financial Toolkit for South Africans
            </h2>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Whether you're a financial advisor or managing your own investments, Financial Advisory Pro gives you <span className="text-white font-medium">20 professional calculators</span>, 
              Tax Planning Hub, Income Tracker, and instant PDF reports - all localized for SA regulations and the 2026/2027 tax brackets.
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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-lg px-8 shadow-lg shadow-indigo-500/25 h-14 group">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/tax-planning">
                <Button size="lg" variant="outline" className="text-lg px-8 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/10 h-14 group">
                  <Receipt className="mr-2 h-5 w-5" />
                  Explore Tax Hub
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-slate-500">
              R249/month • Cancel anytime • Have a coupon? Apply at signup
            </p>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="relative bg-muted/50 border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="mb-4 text-destructive text-sm font-medium uppercase tracking-wide">
                The Problem
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Tired of Outdated Spreadsheets?
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  Manual calculations prone to errors
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  Generic tools not built for SA regulations
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  Hours spent creating financial reports
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  No way to track your financial progress over time
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-4 text-emerald-500 text-sm font-medium uppercase tracking-wide">
                The Solution
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Financial Advisory Pro Does It All
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Accurate calculations with SA tax brackets & rates
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Professional PDF reports in one click
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Track your net worth with visual milestones
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  AI assistant for complex financial questions
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
              19+ Professional Calculators
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
                <span className="text-5xl font-bold text-foreground">R249</span>
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
                To provide South Africans with world-class financial planning tools that save time, reduce errors, and help build lasting wealth. We believe everyone deserves access to professional-grade financial calculators.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every feature in Financial Advisory Pro is built with the South African regulatory environment in mind - from SARS tax brackets to retirement fund rules. We're not just another generic financial calculator - we're your partner in achieving financial freedom.
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

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-muted/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            Ready to Elevate Your Practice?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start making smarter financial decisions today with Financial Advisory Pro's professional tools.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xl px-12 h-16 shadow-lg shadow-primary/25">
              Get Started Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">
            R249/month • Cancel anytime
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
          
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
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
