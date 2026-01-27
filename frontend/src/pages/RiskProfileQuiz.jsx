import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PrintReport } from '@/components/calculators/PrintReport';
import { BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { ClipboardList, ChevronRight, ChevronLeft, RotateCcw, Target, Shield, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const questions = [
  {
    id: 1,
    category: 'Time Horizon',
    question: 'When do you expect to need this money?',
    options: [
      { value: 1, label: 'Within 2 years', description: 'Short-term needs' },
      { value: 2, label: '2-5 years', description: 'Medium-term goals' },
      { value: 3, label: '5-10 years', description: 'Long-term planning' },
      { value: 4, label: '10+ years', description: 'Very long-term horizon' },
    ],
  },
  {
    id: 2,
    category: 'Income Stability',
    question: 'How stable is your current income?',
    options: [
      { value: 1, label: 'Very unstable', description: 'Freelance/contract work' },
      { value: 2, label: 'Somewhat unstable', description: 'Variable income' },
      { value: 3, label: 'Fairly stable', description: 'Steady employment' },
      { value: 4, label: 'Very stable', description: 'Guaranteed income/pension' },
    ],
  },
  {
    id: 3,
    category: 'Investment Knowledge',
    question: 'How would you rate your investment knowledge?',
    options: [
      { value: 1, label: 'Beginner', description: 'Little to no experience' },
      { value: 2, label: 'Basic', description: 'Understand basic concepts' },
      { value: 3, label: 'Intermediate', description: 'Good understanding' },
      { value: 4, label: 'Advanced', description: 'Extensive knowledge' },
    ],
  },
  {
    id: 4,
    category: 'Loss Tolerance',
    question: 'If your portfolio dropped 20% in value, what would you do?',
    options: [
      { value: 1, label: 'Sell everything', description: 'Cannot tolerate losses' },
      { value: 2, label: 'Sell some investments', description: 'Reduce exposure' },
      { value: 3, label: 'Hold and wait', description: 'Stay the course' },
      { value: 4, label: 'Buy more', description: 'See it as opportunity' },
    ],
  },
  {
    id: 5,
    category: 'Risk Preference',
    question: 'Which statement best describes your approach to investing?',
    options: [
      { value: 1, label: 'Preserve capital', description: 'Avoid any losses' },
      { value: 2, label: 'Steady growth', description: 'Small, consistent returns' },
      { value: 3, label: 'Balanced approach', description: 'Mix of growth and stability' },
      { value: 4, label: 'Maximum growth', description: 'Accept high volatility' },
    ],
  },
  {
    id: 6,
    category: 'Financial Goals',
    question: 'What is your primary investment goal?',
    options: [
      { value: 1, label: 'Capital preservation', description: 'Protect what I have' },
      { value: 2, label: 'Regular income', description: 'Generate steady income' },
      { value: 3, label: 'Growth with income', description: 'Balance of both' },
      { value: 4, label: 'Aggressive growth', description: 'Maximize long-term gains' },
    ],
  },
  {
    id: 7,
    category: 'Emergency Fund',
    question: 'How many months of expenses do you have in emergency savings?',
    options: [
      { value: 1, label: 'Less than 1 month', description: 'Limited reserves' },
      { value: 2, label: '1-3 months', description: 'Basic coverage' },
      { value: 3, label: '3-6 months', description: 'Adequate reserves' },
      { value: 4, label: '6+ months', description: 'Well-prepared' },
    ],
  },
  {
    id: 8,
    category: 'Age Factor',
    question: 'What is your age group?',
    options: [
      { value: 4, label: 'Under 35', description: 'Long investment horizon' },
      { value: 3, label: '35-50', description: 'Medium-term horizon' },
      { value: 2, label: '50-60', description: 'Approaching retirement' },
      { value: 1, label: '60+', description: 'Near or in retirement' },
    ],
  },
  {
    id: 9,
    category: 'Portfolio Volatility',
    question: 'Which portfolio would you prefer over 10 years?',
    options: [
      { value: 1, label: 'Steady 4% return', description: 'No variation year to year' },
      { value: 2, label: 'Average 6%, range 2-10%', description: 'Low volatility' },
      { value: 3, label: 'Average 8%, range -5% to 20%', description: 'Moderate volatility' },
      { value: 4, label: 'Average 10%, range -15% to 35%', description: 'High volatility' },
    ],
  },
  {
    id: 10,
    category: 'Investment Experience',
    question: 'How long have you been investing?',
    options: [
      { value: 1, label: 'Never invested', description: 'Complete beginner' },
      { value: 2, label: '1-3 years', description: 'Some experience' },
      { value: 3, label: '3-10 years', description: 'Moderate experience' },
      { value: 4, label: '10+ years', description: 'Experienced investor' },
    ],
  },
];

const riskProfiles = {
  conservative: {
    name: 'Conservative',
    icon: Shield,
    color: 'forest',
    range: [10, 18],
    description: 'You prefer stability and capital preservation over high returns. Your portfolio should focus on low-risk investments.',
    allocation: [
      { name: 'Bonds/Fixed Income', value: 60, color: 'hsl(215, 50%, 35%)' },
      { name: 'Cash/Money Market', value: 25, color: 'hsl(150, 45%, 35%)' },
      { name: 'Equities', value: 15, color: 'hsl(43, 74%, 49%)' },
    ],
    expectedReturn: '4-6%',
    volatility: 'Low',
  },
  moderatelyConservative: {
    name: 'Moderately Conservative',
    icon: Shield,
    color: 'forest',
    range: [19, 24],
    description: 'You seek steady growth with limited volatility. A balanced approach with emphasis on stability suits you.',
    allocation: [
      { name: 'Bonds/Fixed Income', value: 45, color: 'hsl(215, 50%, 35%)' },
      { name: 'Equities', value: 35, color: 'hsl(43, 74%, 49%)' },
      { name: 'Cash/Money Market', value: 15, color: 'hsl(150, 45%, 35%)' },
      { name: 'Alternative', value: 5, color: 'hsl(280, 45%, 45%)' },
    ],
    expectedReturn: '5-7%',
    volatility: 'Low-Medium',
  },
  moderate: {
    name: 'Moderate',
    icon: Target,
    color: 'gold',
    range: [25, 30],
    description: 'You want a balance between growth and stability. You can tolerate some market fluctuations for better returns.',
    allocation: [
      { name: 'Equities', value: 50, color: 'hsl(43, 74%, 49%)' },
      { name: 'Bonds/Fixed Income', value: 35, color: 'hsl(215, 50%, 35%)' },
      { name: 'Cash/Money Market', value: 10, color: 'hsl(150, 45%, 35%)' },
      { name: 'Alternative', value: 5, color: 'hsl(280, 45%, 45%)' },
    ],
    expectedReturn: '6-8%',
    volatility: 'Medium',
  },
  moderatelyAggressive: {
    name: 'Moderately Aggressive',
    icon: TrendingUp,
    color: 'gold',
    range: [31, 36],
    description: 'You prioritize growth and can handle significant market swings. You have time to recover from downturns.',
    allocation: [
      { name: 'Equities', value: 65, color: 'hsl(43, 74%, 49%)' },
      { name: 'Bonds/Fixed Income', value: 20, color: 'hsl(215, 50%, 35%)' },
      { name: 'Alternative', value: 10, color: 'hsl(280, 45%, 45%)' },
      { name: 'Cash/Money Market', value: 5, color: 'hsl(150, 45%, 35%)' },
    ],
    expectedReturn: '7-10%',
    volatility: 'Medium-High',
  },
  aggressive: {
    name: 'Aggressive',
    icon: Zap,
    color: 'navy',
    range: [37, 40],
    description: 'You seek maximum growth and can tolerate high volatility. You have a long time horizon and strong risk appetite.',
    allocation: [
      { name: 'Equities', value: 80, color: 'hsl(43, 74%, 49%)' },
      { name: 'Alternative', value: 15, color: 'hsl(280, 45%, 45%)' },
      { name: 'Bonds/Fixed Income', value: 5, color: 'hsl(215, 50%, 35%)' },
    ],
    expectedReturn: '8-12%',
    volatility: 'High',
  },
};

export const RiskProfileQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const results = useMemo(() => {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const maxScore = questions.length * 4;
    const minScore = questions.length;
    const scorePercent = ((totalScore - minScore) / (maxScore - minScore)) * 100;

    // Determine risk profile
    let profile = riskProfiles.moderate;
    for (const key of Object.keys(riskProfiles)) {
      const p = riskProfiles[key];
      if (totalScore >= p.range[0] && totalScore <= p.range[1]) {
        profile = p;
        break;
      }
    }

    // Category scores
    const categoryScores = questions.map(q => ({
      category: q.category,
      score: answers[q.id] || 0,
      maxScore: 4,
    }));

    return {
      totalScore,
      maxScore,
      scorePercent,
      profile,
      categoryScores,
      answeredCount: Object.keys(answers).length,
    };
  }, [answers]);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ?.id] !== undefined;

  const printInputs = results.categoryScores.map(cs => ({
    label: cs.category,
    value: `${cs.score}/${cs.maxScore}`,
  }));

  const printResults = [
    { label: 'Risk Profile', value: results.profile.name },
    { label: 'Total Score', value: `${results.totalScore}/${results.maxScore}` },
    { label: 'Expected Return Range', value: results.profile.expectedReturn },
    { label: 'Volatility Level', value: results.profile.volatility },
  ];

  if (showResults) {
    const ProfileIcon = results.profile.icon;
    
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Your Risk Profile Results
            </h1>
            <p className="text-muted-foreground">
              Based on your responses, here's your investment risk profile
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetQuiz} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </Button>
            <PrintReport
              title="Risk Profile Assessment"
              calculatorType="risk-profile"
              inputs={printInputs}
              results={printResults}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Result */}
          <div className="lg:col-span-1 space-y-6">
            <Card className={`overflow-hidden border-2 border-${results.profile.color}/20`}>
              <CardContent className="p-0">
                <div className={`p-8 bg-gradient-to-br from-${results.profile.color}/10 to-muted text-center`}>
                  <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full bg-${results.profile.color}/20 mb-4`}>
                    <ProfileIcon className={`h-10 w-10 text-${results.profile.color}`} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {results.profile.name}
                  </h2>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    Score: {results.totalScore}/{results.maxScore}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Profile Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{results.profile.description}</p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected Return</span>
                    <span className="font-semibold">{results.profile.expectedReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Volatility</span>
                    <span className="font-semibold">{results.profile.volatility}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Category Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.categoryScores.map((cs, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{cs.category}</span>
                      <span className="font-medium">{cs.score}/{cs.maxScore}</span>
                    </div>
                    <Progress value={(cs.score / cs.maxScore) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Allocation */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recommended Asset Allocation</CardTitle>
                <CardDescription>
                  Based on your risk profile, here's a suggested portfolio allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownPieChart
                  data={results.profile.allocation}
                  height={350}
                  prefix=""
                />
              </CardContent>
            </Card>

            {/* Allocation Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Allocation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.profile.allocation.map((alloc, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: alloc.color }}
                        />
                        <span className="font-medium">{alloc.name}</span>
                      </div>
                      <Badge variant="outline">{alloc.value}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="border-gold/20 bg-gold/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Important Notice</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This risk profile assessment is for educational purposes only and should not be considered as financial advice. 
                      Please consult with a qualified financial advisor before making investment decisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Investment Risk Profile Quiz
          </h1>
          <p className="text-muted-foreground">
            Answer {questions.length} questions to determine your investment risk tolerance
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <ClipboardList className="h-4 w-4 mr-2" />
          {results.answeredCount}/{questions.length} answered
        </Badge>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <Badge variant="secondary" className="w-fit mb-2">
            {currentQ.category}
          </Badge>
          <CardTitle className="text-xl font-semibold">
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {currentQ.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQ.id, option.value)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200",
                  answers[currentQ.id] === option.value
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50 hover:bg-muted/50"
                )}
              >
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <Button
          variant={currentQuestion === questions.length - 1 ? "premium" : "default"}
          onClick={nextQuestion}
          disabled={!isAnswered}
          className="gap-2"
        >
          {currentQuestion === questions.length - 1 ? 'View Results' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
