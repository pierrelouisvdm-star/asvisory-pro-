import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Circle, ArrowRight, Shield, TrendingUp, 
  AlertTriangle, XCircle, Sparkles, Calculator, Receipt,
  PiggyBank, Target, Eye, Wallet, ChevronRight, Mail,
  BarChart3, Zap, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const diagnosticQuestions = [
  {
    category: 'Visibility & Structure',
    icon: Eye,
    color: 'emerald',
    questions: [
      {
        id: 1,
        text: 'Do you know your exact net worth today — assets minus liabilities — without having to calculate it manually?',
      },
      {
        id: 2,
        text: 'Can you tell, right now, what percentage of your monthly income is going toward wealth-building versus expenses?',
      },
      {
        id: 3,
        text: 'Do you have a single place where all your financial accounts, policies, and investments are visible at once?',
      },
      {
        id: 4,
        text: 'If your income stopped tomorrow, do you know precisely how many months your current savings would sustain you?',
      },
    ],
  },
  {
    category: 'Cash Flow & Leakage',
    icon: Wallet,
    color: 'blue',
    questions: [
      {
        id: 5,
        text: 'At the end of most months, can you account for where every rand you earned actually went?',
      },
      {
        id: 6,
        text: 'Do you have a clear system that flags when your spending in any category exceeds your plan?',
      },
      {
        id: 7,
        text: 'Are you confident you are not losing money to fees, debit orders, or subscriptions you no longer use or track?',
      },
    ],
  },
  {
    category: 'Tax & Efficiency',
    icon: Receipt,
    color: 'amber',
    questions: [
      {
        id: 8,
        text: 'Do you actively track your tax-deductible contributions (retirement annuities, medical aid, etc.) throughout the year — not just in February?',
      },
      {
        id: 9,
        text: 'Do you know whether you are currently over- or under-contributing to your RA relative to your tax threshold?',
      },
      {
        id: 10,
        text: 'Have you made at least one deliberate financial decision in the last 90 days based on its tax impact?',
      },
    ],
  },
  {
    category: 'Decision-Making & Clarity',
    icon: Target,
    color: 'purple',
    questions: [
      {
        id: 11,
        text: 'When you consider a major financial move — a new investment, a large purchase, a policy change — do you have a structured tool or framework you run it through before deciding?',
      },
      {
        id: 12,
        text: 'Do you feel genuinely in control of your financial trajectory, rather than just reacting to it month by month?',
      },
    ],
  },
];

const resultLevels = [
  {
    range: [10, 12],
    title: 'The Operator',
    subtitle: 'Controlled & Clear',
    icon: Shield,
    color: 'emerald',
    bgGradient: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'border-emerald-500/50',
    description: 'Your financial foundation is solid. You have visibility, structure, and intentionality.',
    insight: 'The risk here is complacency — the next level of wealth requires optimization, not just management. You\'re maintaining this manually, spending hours on admin that should be automated.',
    cta: 'Automate your advantage. AdvisoryPro turns your discipline into a self-running system — freeing up cognitive bandwidth for strategy, not admin.',
    ctaButton: 'Automate Your System',
  },
  {
    range: [5, 9],
    title: 'The Patcher',
    subtitle: 'Functional but Fragmented',
    icon: AlertTriangle,
    color: 'amber',
    bgGradient: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'border-amber-500/50',
    description: 'You\'re doing some things right, but your system has gaps. Those gaps are costing you.',
    insight: 'This is the most common and most dangerous zone. You\'re losing money to missed tax efficiency, invisible cash leakage, and decisions made on incomplete data. Decision fatigue from toggling between apps is slowing you down.',
    cta: 'Consolidate your data into one intelligent dashboard. AdvisoryPro eliminates the need to piece together your financial picture manually.',
    ctaButton: 'Centralize Your Finances',
  },
  {
    range: [0, 4],
    title: 'The Guesser',
    subtitle: 'Flying Blind',
    icon: XCircle,
    color: 'red',
    bgGradient: 'from-red-500/20 to-red-600/5',
    borderColor: 'border-red-500/50',
    description: 'Your financial life is running on instinct and hope. Without structure, every month is a reset.',
    insight: 'You\'re likely leaving R15,000–R50,000 on the table annually — not because you\'re careless, but because you don\'t have the infrastructure to see it. The gap between what you earn and what you keep is wider than it should be.',
    cta: 'Stop the leak. AdvisoryPro was built for exactly this moment — to replace chaos with clarity. One dashboard. One system. Total control.',
    ctaButton: 'Build Your Foundation',
  },
];

const features = [
  { icon: BarChart3, text: 'Real-time net worth tracking across every account' },
  { icon: Receipt, text: 'SARS-optimized tax hub with deduction tracking' },
  { icon: Calculator, text: '20+ professional calculators for retirement, debt & investment' },
  { icon: Zap, text: 'One centralized system — no more toggling between apps' },
  { icon: Eye, text: 'The Director\'s View — your entire financial picture in 60 seconds' },
];

export const FinancialDiagnostic = ({ onStartTrial }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const totalQuestions = diagnosticQuestions.reduce((acc, cat) => acc + cat.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const yesCount = Object.values(answers).filter(v => v === true).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const toggleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getResult = () => {
    for (const level of resultLevels) {
      if (yesCount >= level.range[0] && yesCount <= level.range[1]) {
        return level;
      }
    }
    return resultLevels[2]; // Default to lowest
  };

  const handleShowResults = () => {
    if (!emailSubmitted) {
      setShowEmailCapture(true);
    } else {
      setShowResults(true);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailSubmitted(true);
    setShowEmailCapture(false);
    setShowResults(true);
    // Here you could send the email to your backend
  };

  const handleSkipEmail = () => {
    setShowEmailCapture(false);
    setShowResults(true);
  };

  const resetDiagnostic = () => {
    setAnswers({});
    setShowResults(false);
    setShowEmailCapture(false);
    setCurrentSection(0);
  };

  const result = getResult();
  const ResultIcon = result.icon;

  // Email capture modal
  if (showEmailCapture) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-primary/30 bg-gradient-to-b from-card to-card/80">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Your Results Are Ready!
            </h3>
            <p className="text-muted-foreground mb-6">
              Enter your email to receive your personalized financial diagnostic report and actionable insights.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-center"
                required
              />
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90">
                See My Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <button
              onClick={handleSkipEmail}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip and see results
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Score Summary */}
        <div className="text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Diagnostic Complete
          </Badge>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Your Financial Control Score
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-6xl font-bold text-primary">{yesCount}</span>
            <span className="text-2xl text-muted-foreground">/ 12</span>
          </div>
        </div>

        {/* Result Card */}
        <Card className={cn(
          "overflow-hidden",
          result.borderColor,
          `bg-gradient-to-br ${result.bgGradient}`
        )}>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
                result.color === 'emerald' && "bg-emerald-500/20",
                result.color === 'amber' && "bg-amber-500/20",
                result.color === 'red' && "bg-red-500/20",
              )}>
                <ResultIcon className={cn(
                  "h-8 w-8",
                  result.color === 'emerald' && "text-emerald-500",
                  result.color === 'amber' && "text-amber-500",
                  result.color === 'red' && "text-red-500",
                )} />
              </div>
              <div className="flex-1">
                <Badge className={cn(
                  "mb-2",
                  result.color === 'emerald' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  result.color === 'amber' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  result.color === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                )}>
                  {result.subtitle}
                </Badge>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  You are: {result.title}
                </h3>
                <p className="text-foreground mb-4">
                  {result.description}
                </p>
                <div className="bg-background/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground font-medium mb-1">The Hidden Cost:</p>
                  <p className="text-sm text-foreground">
                    {result.insight}
                  </p>
                </div>
                <p className="text-foreground font-medium">
                  {result.cta}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You Get */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              What AdvisoryPro Gives You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-2">
              You've identified the gaps. Now close them.
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your AdvisoryPro subscription at <span className="text-primary font-semibold">R299/month</span> and get your complete financial system running today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={onStartTrial}
              >
                {result.ctaButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={resetDiagnostic}
              >
                Retake Diagnostic
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            R1,499/year once-off option available • 7-day refund policy
          </p>
        </div>
      </div>
    );
  }

  // Diagnostic questions view
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
          <Target className="h-3 w-3 mr-1" />
          Free Diagnostic Tool
        </Badge>
        <h2 className="text-3xl font-bold text-foreground mb-3">
          The Financial Fragmentation Diagnostic
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Answer 12 questions honestly to discover your true level of financial control — and where the hidden leaks are.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">{answeredCount} of {totalQuestions} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Questions by Category */}
      <div className="space-y-8">
        {diagnosticQuestions.map((category, catIdx) => {
          const CategoryIcon = category.icon;
          return (
            <Card key={catIdx} className="border-border bg-card overflow-hidden">
              <CardHeader className={cn(
                "pb-4",
                category.color === 'emerald' && "bg-emerald-500/5",
                category.color === 'blue' && "bg-blue-500/5",
                category.color === 'amber' && "bg-amber-500/5",
                category.color === 'purple' && "bg-purple-500/5",
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    category.color === 'emerald' && "bg-emerald-500/10",
                    category.color === 'blue' && "bg-blue-500/10",
                    category.color === 'amber' && "bg-amber-500/10",
                    category.color === 'purple' && "bg-purple-500/10",
                  )}>
                    <CategoryIcon className={cn(
                      "h-5 w-5",
                      category.color === 'emerald' && "text-emerald-500",
                      category.color === 'blue' && "text-blue-500",
                      category.color === 'amber' && "text-amber-500",
                      category.color === 'purple' && "text-purple-500",
                    )} />
                  </div>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {category.questions.map((question) => (
                    <div 
                      key={question.id}
                      className="p-4 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
                    >
                      <p className="text-foreground mb-4 leading-relaxed">
                        {question.text}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleAnswer(question.id, true)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium",
                            answers[question.id] === true
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-border hover:border-emerald-500/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {answers[question.id] === true ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                          Yes
                        </button>
                        <button
                          onClick={() => toggleAnswer(question.id, false)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium",
                            answers[question.id] === false
                              ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                              : "border-border hover:border-red-500/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {answers[question.id] === false ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-8 text-center">
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 px-8"
          onClick={handleShowResults}
          disabled={answeredCount < totalQuestions}
        >
          {answeredCount < totalQuestions ? (
            <>Answer All Questions ({totalQuestions - answeredCount} remaining)</>
          ) : (
            <>
              See My Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        {answeredCount > 0 && answeredCount < totalQuestions && (
          <p className="mt-3 text-sm text-muted-foreground">
            Current score: {yesCount} Yes answers
          </p>
        )}
      </div>
    </div>
  );
};

export default FinancialDiagnostic;
