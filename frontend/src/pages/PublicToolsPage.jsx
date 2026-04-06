import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Flame, DollarSign, Calculator, Award, CalendarDays, BarChart3,
  Home, Briefcase, TrendingDown, Sparkles, CheckCircle2, Users, Star, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FREE_TOOLS = [
  {
    icon: Award,
    title: 'Financial Independence Score',
    desc: '6-question quiz. See exactly where you stand on the path to FI.',
    path: '/us/fi-score',
    badge: 'Free · Shareable',
    color: 'amber',
    highlight: true,
    cta: 'Take the Quiz',
  },
  {
    icon: Sparkles,
    title: '2025 vs 2024 Tax Comparison',
    desc: 'See exactly how much MORE you keep in 2025 thanks to wider brackets.',
    path: '/us/tax-comparison-2025',
    badge: 'Free · New',
    color: 'blue',
    highlight: true,
    cta: 'See My Savings',
  },
  {
    icon: CalendarDays,
    title: 'US Tax Calendar 2025–2026',
    desc: 'Every deadline you need, estimated taxes, IRA/HSA, year-end moves.',
    path: '/us/tax-calendar',
    badge: 'Free',
    color: 'indigo',
    cta: 'View Calendar',
  },
  {
    icon: Flame,
    title: 'FIRE Calculator',
    desc: 'Find your Financial Independence number. Lean, Fat, Coast & Barista FIRE.',
    path: '/us/fire-calculator',
    badge: 'Free Trial',
    color: 'orange',
    cta: 'Calculate FIRE Number',
  },
  {
    icon: Home,
    title: 'Home Affordability Calculator',
    desc: '28/36 DTI rule, find out how much house you can actually afford.',
    path: '/us/home-affordability',
    badge: 'Free Trial',
    color: 'emerald',
    cta: 'Check Affordability',
  },
  {
    icon: TrendingDown,
    title: 'Tax Savings Finder',
    desc: 'Enter your situation, get a personalized list of ways to cut your tax bill.',
    path: '/us/tax-savings-finder',
    badge: 'Free Trial',
    color: 'green',
    cta: 'Find My Savings',
  },
];

const PREMIUM_TOOLS = [
  { title: 'US Tax Calculator', desc: 'Federal + State for all 50 states', icon: DollarSign },
  { title: 'Paycheck Calculator', desc: 'Exact take-home after FICA & state tax', icon: Briefcase },
  { title: 'RSU & Stock Options', desc: 'True tax bill at vest and sale', icon: Zap },
  { title: 'Medicare IRMAA', desc: '2025 surcharge brackets & cost', icon: CheckCircle2 },
  { title: '401(k) Calculator', desc: 'Employer match + tax savings', icon: BarChart3 },
  { title: 'Roth Conversion Analyzer', desc: 'Break-even & optimal strategy', icon: ArrowRight },
  { title: 'Capital Gains Tax', desc: 'NIIT, LTCG/STCG, all 50 states', icon: TrendingDown },
  { title: 'AMT Calculator', desc: 'ISO options & exemption phase-out', icon: Calculator },
  { title: 'Medicare IRMAA', desc: '2025 premium brackets', icon: Star },
  { title: '+ 17 more tools', desc: 'See all 30+ US calculators', icon: Sparkles },
];

const SOCIAL_PROOF = [
  { quote: "Finally found a tool that handles RSU taxes correctly. The AMT calculator alone saved me hours of spreadsheet work.", name: "Software Engineer, Seattle" },
  { quote: "The FIRE calculator is the best I've used. Shows Lean/Fat/Coast in one view with real inflation adjustments.", name: "r/financialindependence" },
  { quote: "The 2025 tax comparison showed me I'd keep $680 more this year. Immediately shared it with my team.", name: "Financial Advisor, Austin" },
];

export default function PublicToolsPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailCapture = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/growth/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'public_tools_page' }),
      });
      const data = await res.json();
      setSubmitted(true);
      toast.success(data.message || "You're on the list!");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const TOOLS_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Free US Financial Calculators 2025",
    "description": "Professional financial calculators for Americans, tax, FIRE, paycheck, home affordability, FI score quiz.",
    "url": `${process.env.REACT_APP_BACKEND_URL?.replace(/\/api.*$/, '')}/tools`,
    "itemListElement": FREE_TOOLS.map((tool, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": tool.title,
      "description": tool.desc,
      "url": `${process.env.REACT_APP_BACKEND_URL?.replace(/\/api.*$/, '')}${tool.path}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Free US Financial Calculators 2025"
        description="Free US financial tools: 2025 vs 2024 tax comparison, FIRE calculator, FI score quiz, home affordability calculator, tax calendar. No account required. Advisor-level tools, without the advisor."
        path="/tools"
        keywords="free financial calculators 2025, FIRE calculator free, 2025 tax calculator, financial independence quiz, home affordability calculator, tax savings calculator"
        jsonLd={TOOLS_JSON_LD}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-500/8 to-background py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-500/80 mb-4">
            Advisor-Level Tools. Without the Advisor.
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-5 tracking-tight leading-tight">
            Every Financial Calculator.
            <span className="block text-blue-500">One Intelligent Platform.</span>
          </h1>
          <p className="text-xl font-medium text-foreground/80 max-w-xl mx-auto mb-3">
            Make Better Financial Decisions. Faster.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            2025 IRS brackets · All 50 states · FIRE planning · RSU taxes · Medicare IRMAA · Home affordability
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 h-12">
                Get Free Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/us/fi-score">
              <Button size="lg" variant="outline" className="px-8 h-12 border-border">
                Take the FI Score Quiz, Free
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required · FI Score & Tax Calendar are always free</p>
        </div>
      </section>

      {/* Free Tools */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Start for Free</Badge>
          <h2 className="font-display text-3xl font-extrabold text-foreground mb-2">Know Your Numbers. Build Your Wealth.</h2>
          <p className="text-muted-foreground">No account needed to start, sign up to save your results</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FREE_TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link key={i} to={tool.path} className="group">
                <div className={`h-full rounded-xl border p-5 transition-all duration-300 hover:shadow-lg ${
                  tool.highlight
                    ? 'border-2 border-blue-500/40 bg-blue-500/5 hover:border-blue-500'
                    : 'border-border hover:border-primary/40'
                }`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${tool.color}-500/10 mb-3`}>
                    <Icon className={`h-5 w-5 text-${tool.color}-500`} />
                  </div>
                  <Badge className={`mb-2 text-[10px] bg-${tool.color}-500/10 text-${tool.color}-500 border-0`}>{tool.badge}</Badge>
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{tool.desc}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium text-${tool.color}-500 group-hover:gap-2 transition-all`}>
                    {tool.cta} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Email Capture */}
      <section className="bg-gradient-to-b from-blue-500/5 to-background border-y border-blue-500/20 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Users className="h-3 w-3 mr-1.5" />
            Join 1,000+ Americans
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
            The Smartest Way to Run Your Financial Life.
          </h2>
          <p className="text-muted-foreground mb-6">New tools added monthly. Tax deadline reminders, year-end action checklists, and early access to new calculators.</p>
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You're on the list! We'll keep you in the loop.</span>
            </div>
          ) : (
            <form onSubmit={handleEmailCapture} className="flex gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 h-11"
                data-testid="tools-email-input"
              />
              <Button type="submit" disabled={loading} className="h-11 px-5 bg-blue-500 hover:bg-blue-600 text-white" data-testid="tools-email-submit">
                {loading ? 'Joining...' : 'Join Free'}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Premium Preview */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-amber-500/10 text-amber-500 border-amber-500/20">Premium, $19/mo or $99 once-off</Badge>
          <h2 className="font-display text-3xl font-extrabold text-foreground mb-2">Institutional Tools for Everyday Investors.</h2>
          <p className="text-muted-foreground">Professional-grade financial tools, simplified. From paycheck to RSUs to Medicare surcharges.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {PREMIUM_TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <div key={i} className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">{tool.title}</p>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Link to="/auth">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-10 h-12">
              Start Free, Upgrade Anytime
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted/30 border-t border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground text-center mb-2">Where Financial Intelligence Lives</p>
          <h2 className="font-display text-2xl font-extrabold text-foreground text-center mb-8">What people are saying</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {SOCIAL_PROOF.map((item, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-3">"{item.quote}"</p>
                  <p className="text-xs text-foreground font-medium">, {item.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
