import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, FileText, CheckCircle2, ArrowRight, Sparkles,
  PiggyBank, Home, Car, GraduationCap, Heart, Briefcase,
  LineChart, Target, Clock, Zap, Award, Globe,
  ChevronRight, Play, Receipt
} from 'lucide-react';

// Calculator categories with detailed descriptions
const calculatorCategories = [
  {
    title: 'Investment Planning',
    icon: TrendingUp,
    color: 'emerald',
    calculators: [
      { name: 'Future Value Calculator', desc: 'Project investment growth over time' },
      { name: 'Compound Interest', desc: 'See the power of compounding' },
      { name: 'Monte Carlo Simulator', desc: 'Probability-based projections' },
    ]
  },
  {
    title: 'Tax Planning',
    icon: Receipt,
    color: 'blue',
    calculators: [
      { name: 'Tax Planning Hub', desc: 'Complete 2025/2026 tax suite' },
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
    icon: Receipt,
    title: 'Tax Planning Hub',
    description: 'Complete tax planning suite. Income tax, CGT, medical credits, provisional tax, and RA deductibility calculators - all with helpful tooltips explaining SA tax concepts.',
    highlights: ['Tax Brackets', 'Capital Gains Tax', 'Medical Aid Credits'],
  },
  {
    icon: Calculator,
    title: '17+ Professional Calculators',
    description: 'From retirement planning to estate duty, every calculation a financial advisor needs. All localized for South African regulations, tax brackets, and the current Prime Rate.',
    highlights: ['SA Tax Brackets', 'Estate Duty', 'Living Annuity Limits'],
  },
  {
    icon: GraduationCap,
    title: 'Financial Literacy Assessment',
    description: 'COFI-compliant quiz to assess client financial knowledge. 10 carefully crafted questions with scoring, explanations, and professional PDF reports.',
    highlights: ['COFI Compliant', 'Instant Scoring', 'PDF Reports'],
  },
  {
    icon: LineChart,
    title: 'Net Worth Tracker',
    description: 'Help clients visualize their financial journey. Track assets, liabilities, set goals, and celebrate milestones. Generate beautiful progress reports.',
    highlights: ['Historical Snapshots', 'Goal Tracking', 'Smart Insights'],
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with POPIA compliance, audit trails for all data access, and complete data isolation. Your client data is always protected.',
    highlights: ['POPIA Compliant', 'Audit Trails', 'Data Isolation'],
  },
  {
    icon: Bot,
    title: 'AI Financial Assistant',
    description: 'Get intelligent insights powered by advanced AI. Answer complex financial questions, generate explanations, and provide guidance to your clients.',
    highlights: ['GPT-Powered', 'SA Context Aware', 'Client-Ready Explanations'],
  },
];

// Stats
const stats = [
  { value: '17+', label: 'Financial Calculators' },
  { value: 'SA', label: 'Localized for South Africa' },
  { value: '24/7', label: 'Access Anywhere' },
  { value: 'PDF', label: 'Instant Reports' },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border border-primary/30 px-4 py-1.5 text-sm">
              <Sparkles className="h-3 w-3 mr-2" />
              Built for Financial Advisors
            </Badge>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold text-foreground mb-4 tracking-tight">
              Empower Your Practice with{' '}
              <span className="text-primary">
                AdvisoryPro
              </span>
            </h1>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-muted-foreground mb-6">
              The Complete Toolkit for South African Financial Advisors
            </h2>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Stop juggling spreadsheets and outdated tools. AdvisoryPro gives you <span className="text-foreground font-medium">17+ professional calculators</span>, 
              client management, AI insights, and instant PDF reports - all localized for SA regulations and the latest tax brackets.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center group">
                  <p className="text-3xl font-bold text-primary group-hover:scale-110 transition-transform">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 shadow-lg shadow-primary/25 h-14 group">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 border-border h-14">
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              R299/month • Cancel anytime • Have a coupon? Apply at signup
            </p>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="relative bg-muted/50 border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/30">
                The Problem
              </Badge>
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
                  Hours spent creating client reports
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  No way to track client progress over time
                </li>
              </ul>
            </div>
            <div>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                The Solution
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                AdvisoryPro Does It All
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
                  Track client net worth with visual milestones
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

      {/* Calculator Categories */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Calculator className="h-3 w-3 mr-2" />
              17+ Professional Calculators
            </Badge>
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
            <Badge className="mb-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
              <Zap className="h-3 w-3 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Built for How You Actually Work
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to save you time and impress your clients
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
                      <Badge key={idx} variant="outline" className="text-xs border-primary/30 text-primary">
                        {highlight}
                      </Badge>
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
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            Simple Pricing
          </Badge>
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
                  'All 15+ Financial Calculators',
                  'Unlimited Client Profiles',
                  'Net Worth Tracker with Goals',
                  'AI Financial Assistant',
                  'Live Market Data',
                  'Professional PDF Reports',
                  'ZAR & USD Currency Support',
                  'SA Tax Brackets & Regulations',
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

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 to-navy-900/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Ready to Elevate Your Practice?
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Start delivering exceptional service to your clients with AdvisoryPro's professional financial tools.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-xl px-12 h-16 shadow-lg shadow-emerald-500/25">
              Get Started Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-4 text-slate-500">
            R299/month • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-12 bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-navy-950 font-bold text-lg">A</span>
                </div>
                <span className="text-white font-bold text-xl">AdvisoryPro</span>
              </div>
              <p className="text-sm text-slate-500">
                Professional financial advisor tools built for South African regulations.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Calculators</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Retirement Planning</li>
                <li>Life Insurance</li>
                <li>Bond Calculator</li>
                <li>Tax Calculator</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Net Worth Tracker</li>
                <li>Client Management</li>
                <li>AI Assistant</li>
                <li>PDF Reports</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>support@advisorypro.co.za</li>
                <li>bulk@advisorypro.co.za</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-navy-800 flex justify-center items-center">
            <p className="text-sm text-slate-500">
              © 2026 AdvisoryPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
