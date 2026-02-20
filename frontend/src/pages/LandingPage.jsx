import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Calculator, TrendingUp, Users, Shield, BarChart3, 
  Bot, FileText, CheckCircle2, ArrowRight, Sparkles,
  PiggyBank, Home, Car, GraduationCap, Heart, Briefcase,
  LineChart, Target, Clock, Zap, Award, Globe,
  ChevronRight, Play, Receipt, Mail, Phone, MapPin,
  Send, Linkedin, Twitter, Building2, Loader2, Scale
} from 'lucide-react';

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
      { name: 'Tax Planning Hub', desc: 'Complete 2025/2026 tax suite with PDF reports' },
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
    description: 'Show clients how fees erode returns over time. Compare up to 3 investment options with different EACs and visualize the long-term impact of TERs, platform fees, and advisor fees.',
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
    title: '18+ Professional Calculators',
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

      {/* About Us Section */}
      <section id="about" className="relative py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              <Building2 className="h-3 w-3 mr-2" />
              About Us
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Empowering Financial Advisors Across South Africa
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              We understand the unique challenges faced by South African financial advisors. That's why we built AdvisoryPro - a comprehensive platform designed specifically for the local market.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                To provide South African financial advisors with world-class tools that save time, reduce errors, and help deliver exceptional service to their clients. We believe that by empowering advisors with better technology, we can help more South Africans achieve financial security.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every feature in AdvisoryPro is built with the South African regulatory environment in mind - from SARS tax brackets to FSCA compliance requirements. We're not just another generic financial calculator - we're your partner in building a successful practice.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-3xl font-bold text-primary">2026</p>
                  <p className="text-sm text-muted-foreground">Founded</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-3xl font-bold text-primary">SA</p>
                  <p className="text-sm text-muted-foreground">Proudly South African</p>
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
                  desc: 'POPIA compliant with bank-level security for all client data.' 
                },
                { 
                  icon: Zap, 
                  title: 'Continuous Innovation', 
                  desc: 'Regular updates to stay current with regulatory changes and new features.' 
                },
                { 
                  icon: Users, 
                  title: 'Advisor-Centric', 
                  desc: 'Built by advisors, for advisors. We listen to your feedback.' 
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

          {/* Team Section */}
          <div className="mt-16">
            <div className="text-center mb-10">
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">Meet Our Team</h3>
              <p className="text-muted-foreground">The people behind AdvisoryPro</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  name: 'Denzil Ohlson', 
                  role: 'Chief Product & Legal Officer',
                  credentials: 'Admitted Advocate, CFP®',
                  initials: 'DO',
                  color: 'bg-blue-500',
                  photo: 'https://customer-assets.emergentagent.com/job_05ab0338-6b86-42c1-b478-12618402212d/artifacts/qevmztdm_image0.jpeg',
                  bio: 'Denzil operates at the intersection of law, regulation, financial planning, and technology-enabled advice. As a Senior Legal Advisor and Business Development Manager, he helps intermediaries and high-net-worth clients implement practical, compliant solutions across estate, retirement, investment, tax, and business assurance planning, with a strong focus on Treating Customers Fairly. A respected technical trainer and presenter, Denzil translates complex legislation into clear, actionable guidance that improves advice quality, reduces risk, and builds lasting client trust.'
                },
                { 
                  name: 'Pierre Van der Merwe', 
                  role: 'Founder & CEO',
                  credentials: 'Financial Advisor, 11+ Years Experience',
                  initials: 'PV',
                  color: 'bg-emerald-500',
                  photo: 'https://customer-assets.emergentagent.com/job_05ab0338-6b86-42c1-b478-12618402212d/artifacts/fqtbhhd1_file_0000000060d4722f94b64048ee6cea11.png',
                  photoPosition: 'object-top',
                  bio: 'Pierre is a financial advisor with over 11 years of experience and the founder of Precision Wealth, a modern advisory practice focused on delivering smarter, more cost-effective financial solutions for South Africans. Driven by a strong passion for financial education, Pierre believes that access to clear, practical financial guidance is the foundation of long-term wealth creation. He specialises in retirement planning, tax-efficient investing, and building diversified portfolios using low-cost investment strategies designed to maximise real returns over time.'
                },
                { 
                  name: 'William Doherty', 
                  role: 'Chief Operations Officer',
                  credentials: 'Financial Advisor & Entrepreneur',
                  initials: 'WD',
                  color: 'bg-amber-500',
                  photo: 'https://customer-assets.emergentagent.com/job_05ab0338-6b86-42c1-b478-12618402212d/artifacts/xbsywy3r_PHOTO-2026-02-17-15-19-30.jpg',
                  bio: 'William is a Financial Advisor and entrepreneur with a deep-rooted passion for the intersection of finance and technology. His work is driven by the belief that financial solutions should be built for the long term, combining rigorous economic analysis with modern tech to solve real-world problems. He thrives on creating systems that make complex financial landscapes more accessible and efficient for everyone involved.'
                },
              ].map((member, idx) => (
                <Card key={idx} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="pt-8 pb-6">
                    <div className="text-center">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.name}
                          className={`w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-border ${member.photoPosition || 'object-top'}`}
                        />
                      ) : (
                        <div className={`w-24 h-24 ${member.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <span className="text-white text-2xl font-bold">{member.initials}</span>
                        </div>
                      )}
                      <h4 className="font-display text-lg font-semibold text-foreground">{member.name}</h4>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                      {member.credentials && (
                        <p className="text-xs text-primary mt-1">{member.credentials}</p>
                      )}
                      {member.bio && (
                        <p className="text-sm text-muted-foreground mt-4 text-center leading-relaxed">
                          {member.bio}
                        </p>
                      )}
                      <div className="flex justify-center gap-2 mt-4">
                        <a 
                          href="#" 
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                        <a 
                          href="#" 
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Mail className="h-3 w-3 mr-2" />
              Contact Us
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about AdvisoryPro? Want to discuss bulk licensing for your team? We'd love to hear from you.
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
            Start delivering exceptional service to your clients with AdvisoryPro's professional financial tools.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xl px-12 h-16 shadow-lg shadow-primary/25">
              Get Started Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">
            R299/month • Cancel anytime
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
                <span className="text-foreground font-bold text-xl">AdvisoryPro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional financial advisor tools built for South African regulations.
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
              © 2026 AdvisoryPro. All rights reserved.
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
