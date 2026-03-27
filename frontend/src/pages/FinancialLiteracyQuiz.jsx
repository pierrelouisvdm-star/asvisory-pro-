import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  GraduationCap, CheckCircle2, AlertTriangle, Info,
  ChevronRight, ChevronLeft, RotateCcw, FileText,
  BookOpen, TrendingUp, Shield, PiggyBank, Scale
} from 'lucide-react';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';

// COFI-compliant Financial Literacy Questions
const questions = [
  {
    id: 1,
    category: 'Basic Financial Concepts',
    icon: BookOpen,
    question: 'If you have R100 in a savings account earning 10% interest per year, how much would you have after one year?',
    options: [
      { value: 'a', label: 'R90', correct: false },
      { value: 'b', label: 'R100', correct: false },
      { value: 'c', label: 'R110', correct: true },
      { value: 'd', label: 'R120', correct: false },
    ],
    explanation: 'With 10% interest, you earn R10 on your R100, giving you R110 after one year.',
    cofiReference: 'Understanding of basic interest calculations'
  },
  {
    id: 2,
    category: 'Inflation',
    icon: TrendingUp,
    question: 'If inflation is 6% per year and your savings account pays 4% interest, after one year will you be able to buy more, less, or the same amount with your money?',
    options: [
      { value: 'a', label: 'More than today', correct: false },
      { value: 'b', label: 'Exactly the same', correct: false },
      { value: 'c', label: 'Less than today', correct: true },
      { value: 'd', label: 'It depends on how much I save', correct: false },
    ],
    explanation: 'When inflation (6%) exceeds your interest rate (4%), your purchasing power decreases. Your money grows slower than prices increase.',
    cofiReference: 'Understanding of inflation and real returns'
  },
  {
    id: 3,
    category: 'Compound Interest',
    icon: PiggyBank,
    question: 'R1,000 is invested at 10% compound interest per year. After 5 years, it will have earned:',
    options: [
      { value: 'a', label: 'Less than R500 in interest', correct: false },
      { value: 'b', label: 'Exactly R500 in interest', correct: false },
      { value: 'c', label: 'More than R500 in interest', correct: true },
      { value: 'd', label: 'Cannot be calculated', correct: false },
    ],
    explanation: 'Compound interest earns interest on interest. After 5 years at 10%, R1,000 grows to approximately R1,610.51 - earning R610.51, which is more than R500.',
    cofiReference: 'Understanding of compound interest effects'
  },
  {
    id: 4,
    category: 'Risk & Return',
    icon: Scale,
    question: 'Which statement about risk and return is generally TRUE?',
    options: [
      { value: 'a', label: 'Higher returns always mean lower risk', correct: false },
      { value: 'b', label: 'Higher potential returns usually come with higher risk', correct: true },
      { value: 'c', label: 'Risk and return are not related', correct: false },
      { value: 'd', label: 'Lower risk investments always perform better', correct: false },
    ],
    explanation: 'In financial markets, there is typically a trade-off between risk and return. Investments with higher potential returns generally carry more risk.',
    cofiReference: 'Understanding of risk-return relationship'
  },
  {
    id: 5,
    category: 'Diversification',
    icon: Shield,
    question: 'You have R10,000 to invest. Which approach typically carries the LEAST risk?',
    options: [
      { value: 'a', label: 'Invest all in one company\'s shares', correct: false },
      { value: 'b', label: 'Invest all in property', correct: false },
      { value: 'c', label: 'Spread across different asset types (shares, bonds, property, cash)', correct: true },
      { value: 'd', label: 'Keep all in cash under your mattress', correct: false },
    ],
    explanation: 'Diversification - spreading investments across different asset classes - reduces risk because different investments often perform differently under various market conditions.',
    cofiReference: 'Understanding of diversification principles'
  },
  {
    id: 6,
    category: 'Investment Products',
    icon: BookOpen,
    question: 'What is a Unit Trust (Collective Investment Scheme)?',
    options: [
      { value: 'a', label: 'A type of bank account', correct: false },
      { value: 'b', label: 'A pooled investment where many investors\' money is combined and managed professionally', correct: true },
      { value: 'c', label: 'A government savings bond', correct: false },
      { value: 'd', label: 'An insurance policy', correct: false },
    ],
    explanation: 'A Unit Trust pools money from many investors to buy a diversified portfolio of assets, managed by professional fund managers. This gives small investors access to diversification.',
    cofiReference: 'Understanding of collective investment schemes'
  },
  {
    id: 7,
    category: 'Retirement Planning',
    icon: PiggyBank,
    question: 'Which statement about Retirement Annuities (RAs) in South Africa is TRUE?',
    options: [
      { value: 'a', label: 'You can withdraw all funds at any time without penalty', correct: false },
      { value: 'b', label: 'Contributions are tax-deductible up to certain limits', correct: true },
      { value: 'c', label: 'RAs have no investment growth', correct: false },
      { value: 'd', label: 'RAs are only for employees', correct: false },
    ],
    explanation: 'RA contributions are tax-deductible up to 27.5% of taxable income (max R430,000 per year for 2026/27). However, funds are generally only accessible at retirement (age 55+).',
    cofiReference: 'Understanding of retirement products and tax benefits'
  },
  {
    id: 8,
    category: 'Insurance Concepts',
    icon: Shield,
    question: 'What is the primary purpose of life insurance?',
    options: [
      { value: 'a', label: 'To grow your wealth quickly', correct: false },
      { value: 'b', label: 'To provide financial protection for dependants if you pass away', correct: true },
      { value: 'c', label: 'To save for retirement', correct: false },
      { value: 'd', label: 'To avoid paying taxes', correct: false },
    ],
    explanation: 'Life insurance primarily provides financial protection for your dependants (spouse, children) in the event of your death, helping them maintain their standard of living.',
    cofiReference: 'Understanding of insurance purpose and protection needs'
  },
  {
    id: 9,
    category: 'Credit & Debt',
    icon: Scale,
    question: 'If you only pay the minimum amount on your credit card each month, what typically happens?',
    options: [
      { value: 'a', label: 'You pay off the debt quickly', correct: false },
      { value: 'b', label: 'You pay significantly more in interest over time', correct: true },
      { value: 'c', label: 'Your credit score improves faster', correct: false },
      { value: 'd', label: 'The bank will close your account', correct: false },
    ],
    explanation: 'Paying only the minimum keeps you in debt longer and results in paying much more interest. Credit card interest rates in SA can exceed 20% per year.',
    cofiReference: 'Understanding of credit costs and debt management'
  },
  {
    id: 10,
    category: 'Financial Planning',
    icon: TrendingUp,
    question: 'Why is it important to have an emergency fund before investing?',
    options: [
      { value: 'a', label: 'It\'s a legal requirement', correct: false },
      { value: 'b', label: 'Emergency funds earn better returns than investments', correct: false },
      { value: 'c', label: 'To avoid selling investments at a loss during financial emergencies', correct: true },
      { value: 'd', label: 'Banks require it before opening investment accounts', correct: false },
    ],
    explanation: 'An emergency fund (typically 3-6 months of expenses) provides a buffer so you don\'t have to sell investments during market downturns when you face unexpected expenses.',
    cofiReference: 'Understanding of financial planning hierarchy'
  },
];

// Scoring and classification
const getLiteracyLevel = (score) => {
  const percentage = (score / questions.length) * 100;
  if (percentage >= 80) {
    return {
      level: 'High',
      color: 'emerald',
      description: 'Strong understanding of financial concepts. You can engage with more complex financial products and strategies.',
      recommendation: 'You demonstrate good financial literacy. You are ready for comprehensive financial planning including complex investment strategies.'
    };
  } else if (percentage >= 60) {
    return {
      level: 'Moderate',
      color: 'amber',
      description: 'Adequate understanding of basic concepts. Some areas may need additional review.',
      recommendation: 'You have foundational knowledge. Consider learning more about weaker areas before implementing complex strategies.'
    };
  } else if (percentage >= 40) {
    return {
      level: 'Basic',
      color: 'orange',
      description: 'Limited understanding of financial concepts. Additional education recommended.',
      recommendation: 'Consider focusing on basic financial concepts before exploring complex products. Simpler solutions may be more suitable initially.'
    };
  } else {
    return {
      level: 'Low',
      color: 'red',
      description: 'Significant gaps in financial understanding. Comprehensive education recommended.',
      recommendation: 'Start with the fundamentals of personal finance. Take time to understand any financial products thoroughly before committing. Consider using financial literacy resources.'
    };
  }
};

const FinancialLiteracyQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    setShowExplanation(false);
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setShowExplanation(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const answer = answers[q.id];
      const correctOption = q.options.find(o => o.correct);
      if (answer === correctOption?.value) {
        correct++;
      }
    });
    return correct;
  };

  const getAnswerStatus = (questionId) => {
    const answer = answers[questionId];
    if (!answer) return null;
    const question = questions.find(q => q.id === questionId);
    const correctOption = question?.options.find(o => o.correct);
    return answer === correctOption?.value ? 'correct' : 'incorrect';
  };

  const score = calculateScore();
  const literacyLevel = getLiteracyLevel(score);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Category breakdown for results
  const getCategoryResults = () => {
    const categories = {};
    questions.forEach(q => {
      if (!categories[q.category]) {
        categories[q.category] = { total: 0, correct: 0 };
      }
      categories[q.category].total++;
      const answer = answers[q.id];
      const correctOption = q.options.find(o => o.correct);
      if (answer === correctOption?.value) {
        categories[q.category].correct++;
      }
    });
    return categories;
  };

  if (showResults) {
    const categoryResults = getCategoryResults();
    
    return (
      <div className="space-y-6" data-testid="literacy-quiz-results">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-emerald-400" />
              Financial Literacy Assessment Results
            </h1>
            <p className="text-slate-400 mt-1">COFI-compliant assessment</p>
          </div>
          <div className="flex gap-2">
            <PrintReport
              title="Financial Literacy Assessment"
              calculatorType="COFI Compliance"
              inputs={[
                { label: 'Assessment Date', value: new Date().toLocaleDateString('en-ZA') },
                { label: 'Questions Answered', value: `${Object.keys(answers).length} of ${questions.length}` },
                { label: 'Literacy Level', value: literacyLevel.level },
              ]}
              results={[
                { label: 'Total Score', value: `${score}/${questions.length} (${Math.round((score/questions.length)*100)}%)` },
                ...Object.entries(categoryResults).map(([cat, result]) => ({
                  label: cat,
                  value: `${result.correct}/${result.total}`
                }))
              ]}
            />
            <Button onClick={resetQuiz} variant="outline" className="border-navy-600 text-slate-300">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>

        {/* Score Summary */}
        <Card className={`bg-gradient-to-br from-${literacyLevel.color}-500/10 to-navy-900 border-${literacyLevel.color}-500/30`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-400">Financial Literacy Level</p>
                <h2 className={`text-3xl font-bold text-${literacyLevel.color}-400`}>
                  {literacyLevel.level}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Score</p>
                <p className="text-4xl font-bold text-white">
                  {score}<span className="text-xl text-slate-400">/{questions.length}</span>
                </p>
                <p className="text-sm text-slate-400">{Math.round((score/questions.length)*100)}%</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Assessment</h4>
                <p className="text-slate-400 text-sm">{literacyLevel.description}</p>
              </div>
              <div className={`p-4 rounded-lg bg-${literacyLevel.color}-500/10 border border-${literacyLevel.color}-500/30`}>
                <h4 className={`text-sm font-medium text-${literacyLevel.color}-400 mb-2`}>COFI Recommendation</h4>
                <p className="text-sm text-slate-300">{literacyLevel.recommendation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Category Performance</CardTitle>
            <CardDescription>Breakdown by financial knowledge area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryResults).map(([category, result]) => {
                const percentage = (result.correct / result.total) * 100;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{category}</span>
                      <span className={`font-medium ${percentage >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.correct}/{result.total}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Question Review */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Question Review</CardTitle>
            <CardDescription>Detailed breakdown of each question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((q, index) => {
                const status = getAnswerStatus(q.id);
                const userAnswer = answers[q.id];
                const correctOption = q.options.find(o => o.correct);
                const userOption = q.options.find(o => o.value === userAnswer);
                
                return (
                  <div 
                    key={q.id} 
                    className={`p-4 rounded-lg border ${
                      status === 'correct' 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {status === 'correct' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white mb-1">
                          Q{index + 1}: {q.question}
                        </p>
                        <p className="text-xs text-slate-400 mb-2">
                          <Badge variant="outline" className="text-xs border-slate-600">
                            {q.category}
                          </Badge>
                        </p>
                        {status === 'incorrect' && (
                          <div className="text-sm space-y-1">
                            <p className="text-red-400">
                              Your answer: {userOption?.label}
                            </p>
                            <p className="text-emerald-400">
                              Correct answer: {correctOption?.label}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2 italic">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* COFI Compliance Note */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-1">COFI Compliance Note</h4>
                <p className="text-sm text-slate-300">
                  This assessment helps fulfill the Conduct of Financial Institutions (COFI) requirement 
                  to understand financial literacy levels. Results can be documented 
                  and considered when making financial planning decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const CategoryIcon = currentQ.icon;

  return (
    <div className="space-y-6" data-testid="literacy-quiz">
      <Disclaimer />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-emerald-400" />
            Financial Literacy Assessment
          </h1>
          <p className="text-slate-400 mt-1">COFI-compliant questionnaire</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
          {currentQuestion + 1} of {questions.length}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="bg-navy-900/60 border-navy-700">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CategoryIcon className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="border-slate-600 text-slate-400">
              {currentQ.category}
            </Badge>
          </div>
          <CardTitle className="text-xl text-white leading-relaxed">
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={(value) => handleAnswer(currentQ.id, value)}
            className="space-y-3"
          >
            {currentQ.options.map((option) => {
              const isSelected = answers[currentQ.id] === option.value;
              const isCorrect = option.correct;
              const showFeedback = showExplanation && isSelected;
              
              return (
                <div key={option.value}>
                  <Label
                    htmlFor={`q${currentQ.id}-${option.value}`}
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      showFeedback
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-red-500 bg-red-500/10'
                        : isSelected
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-navy-600 bg-navy-800/50 hover:border-navy-500'
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`q${currentQ.id}-${option.value}`}
                      className="border-slate-500"
                    />
                    <span className={`flex-1 ${
                      showFeedback && isSelected
                        ? isCorrect ? 'text-emerald-400' : 'text-red-400'
                        : 'text-slate-300'
                    }`}>
                      {option.label}
                    </span>
                    {showFeedback && isSelected && (
                      isCorrect 
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        : <AlertTriangle className="h-5 w-5 text-red-400" />
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* Explanation */}
          {showExplanation && answers[currentQ.id] && (
            <div className={`mt-4 p-4 rounded-lg ${
              getAnswerStatus(currentQ.id) === 'correct'
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <div className="flex items-start gap-2">
                <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  getAnswerStatus(currentQ.id) === 'correct' ? 'text-emerald-400' : 'text-amber-400'
                }`} />
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    getAnswerStatus(currentQ.id) === 'correct' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {getAnswerStatus(currentQ.id) === 'correct' ? 'Correct!' : 'Explanation'}
                  </p>
                  <p className="text-sm text-slate-300">{currentQ.explanation}</p>
                  <p className="text-xs text-slate-500 mt-2 italic">
                    COFI Reference: {currentQ.cofiReference}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          variant="outline"
          className="border-navy-600 text-slate-300 hover:bg-navy-800"
          data-testid="prev-question-btn"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={nextQuestion}
          disabled={!answers[currentQ.id]}
          className="bg-emerald-600 hover:bg-emerald-500"
          data-testid="next-question-btn"
        >
          {currentQuestion === questions.length - 1 ? 'View Results' : 'Next'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-2 pt-4">
        {questions.map((q, index) => {
          const status = getAnswerStatus(q.id);
          return (
            <button
              key={q.id}
              onClick={() => {
                setShowExplanation(false);
                setCurrentQuestion(index);
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentQuestion
                  ? 'bg-emerald-500 scale-125'
                  : status === 'correct'
                  ? 'bg-emerald-500/50'
                  : status === 'incorrect'
                  ? 'bg-red-500/50'
                  : answers[q.id]
                  ? 'bg-slate-500'
                  : 'bg-navy-700'
              }`}
              data-testid={`question-dot-${index}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FinancialLiteracyQuiz;
