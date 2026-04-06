import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Award, CheckCircle2, AlertCircle, TrendingUp, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import SEOHead from '@/components/SEOHead';

const QUESTIONS = [
  {
    id: 'savings_rate',
    question: 'What is your current savings rate?',
    subtext: 'Percentage of gross income you save/invest monthly',
    options: [
      { label: 'Less than 5%', value: 0, points: 0 },
      { label: '5% – 15%', value: 1, points: 15 },
      { label: '15% – 25%', value: 2, points: 30 },
      { label: '25% – 50%', value: 3, points: 50 },
      { label: 'Over 50%', value: 4, points: 65 },
    ],
  },
  {
    id: 'emergency_fund',
    question: 'How many months of expenses is your emergency fund?',
    subtext: 'Liquid savings accessible within days',
    options: [
      { label: 'None', value: 0, points: 0 },
      { label: '1 – 3 months', value: 1, points: 10 },
      { label: '3 – 6 months', value: 2, points: 20 },
      { label: '6+ months', value: 3, points: 30 },
    ],
  },
  {
    id: 'debt',
    question: 'How would you describe your debt situation?',
    subtext: 'Excluding mortgage',
    options: [
      { label: 'High consumer debt (credit cards, personal loans)', value: 0, points: 0 },
      { label: 'Some debt being paid down', value: 1, points: 10 },
      { label: 'Only low-rate debt (student loans, car)', value: 2, points: 20 },
      { label: 'Debt-free (non-mortgage)', value: 3, points: 30 },
    ],
  },
  {
    id: 'retirement',
    question: 'How are you contributing to retirement accounts?',
    options: [
      { label: "Not contributing", value: 0, points: 0 },
      { label: 'Below employer match', value: 1, points: 10 },
      { label: 'Capturing full employer match', value: 2, points: 20 },
      { label: 'Maxing out IRA ($7k) + 401(k) match', value: 3, points: 30 },
      { label: 'Maxing 401(k) ($23k) + IRA + possibly HSA', value: 4, points: 45 },
    ],
  },
  {
    id: 'investments',
    question: 'How are your savings invested?',
    options: [
      { label: 'All in savings account or cash', value: 0, points: 0 },
      { label: 'Some stocks, mostly savings', value: 1, points: 8 },
      { label: 'Diversified mix (stocks, bonds)', value: 2, points: 15 },
      { label: 'Low-cost index funds / target-date funds', value: 3, points: 20 },
    ],
  },
  {
    id: 'net_worth',
    question: 'What is your net worth relative to your annual income?',
    subtext: 'Net worth = assets minus all debts',
    options: [
      { label: 'Negative (owe more than you own)', value: 0, points: 0 },
      { label: '0x – 1x income', value: 1, points: 5 },
      { label: '1x – 3x income', value: 2, points: 15 },
      { label: '3x – 7x income', value: 3, points: 25 },
      { label: '7x – 12x income', value: 4, points: 35 },
      { label: '12x+ income', value: 5, points: 45 },
    ],
  },
];

const MAX_SCORE = QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.points)), 0);

const TIERS = [
  { min: 0, max: 40, label: 'Financial Seedling', color: '#ef4444', desc: "You're just getting started. Focus on eliminating high-interest debt and building your emergency fund." },
  { min: 41, max: 80, label: 'Building Momentum', color: '#f97316', desc: "Good foundation. Capture your full 401(k) match and automate your savings to level up fast." },
  { min: 81, max: 120, label: 'Financially Stable', color: '#f59e0b', desc: "Solid footing! Work on maximizing tax-advantaged accounts and growing your investment portfolio." },
  { min: 121, max: 155, label: 'On the FIRE Path', color: '#6366f1', desc: "You're accumulating wealth effectively. Optimize asset allocation and consider your FIRE timeline." },
  { min: 156, max: 190, label: 'Coast FIRE Ready', color: '#10b981', desc: "Impressive! Your nest egg could compound to full retirement without additional contributions." },
  { min: 191, max: Infinity, label: 'Financial Independence', color: '#059669', desc: "You've achieved what most people only dream of. Consider giving back or pursuing your passions full-time." },
];

const getTier = (score) => TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];

export default function FinancialIndependenceScore() {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  const score = useMemo(() =>
    Object.values(answers).reduce((sum, pts) => sum + pts, 0)
  , [answers]);

  const tier = getTier(score);
  const pct = Math.round((score / MAX_SCORE) * 100);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;

  const handleAnswer = (questionId, points) => {
    const newAnswers = { ...answers, [questionId]: points };
    setAnswers(newAnswers);
    if (currentQuestion < totalQuestions - 1) {
      setTimeout(() => setCurrentQuestion(q => q + 1), 300);
    } else {
      setTimeout(() => setCompleted(true), 300);
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setCompleted(false);
    setShowShare(false);
    setLeadSubmitted(false);
    setLeadEmail('');
  };

  const handleLeadCapture = async (e) => {
    e.preventDefault();
    if (!leadEmail.trim() || !leadEmail.includes('@')) return;
    setLeadLoading(true);
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${API_URL}/api/growth/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail.trim(),
          source: 'fi_score_quiz',
          score,
          tier: tier.label,
        }),
      });
      const data = await res.json();
      setLeadSubmitted(true);
      toast.success(data.message || "You're on the list!");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLeadLoading(false);
    }
  };

  const shareText = `My Financial Independence Score: ${score}/${MAX_SCORE} (${pct}%) — "${tier.label}" 🏆\nCalculated at Financial Advisory Pro: ${window.location.origin}/us/fi-score`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    toast.success('Copied to clipboard!');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleRedditShare = () => {
    const title = `My Financial Independence Score: ${score}/${MAX_SCORE} (${tier.label})`;
    const url = `https://www.reddit.com/r/financialindependence/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  if (completed) {
    const radarData = [{ value: score, fill: tier.color }];
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <SEOHead
          title="Financial Independence Score — Your FI Progress"
          description="Take our 6-question Financial Independence quiz to score your savings rate, net worth, retirement contributions, and more. Free, instant, shareable."
          path="/us/fi-score"
          keywords="financial independence score, FI quiz, financial independence calculator, savings rate calculator, FIRE progress quiz"
        />
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: `${tier.color}20` }}>
            <Award className="h-8 w-8" style={{ color: tier.color }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-display mb-2">Your FI Score</h1>
          <p className="text-muted-foreground">Based on {totalQuestions} key financial health indicators</p>
        </div>

        <Card className="border-2" style={{ borderColor: `${tier.color}40` }}>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" data={[{ value: pct, fill: tier.color }]} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={10} fill={tier.color} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-6xl font-bold mb-1" style={{ color: tier.color }}>{score}</p>
            <p className="text-muted-foreground text-sm mb-3">out of {MAX_SCORE} points ({pct}%)</p>
            <Badge className="text-sm px-4 py-1.5 mb-4" style={{ backgroundColor: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}>
              {tier.label}
            </Badge>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">{tier.desc}</p>
          </CardContent>
        </Card>

        {/* Email Capture */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-card border-blue-500/30 border-2">
          <CardContent className="p-5 text-center">
            {leadSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-emerald-500 py-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">You're on the list! Your personalized FI roadmap is on its way.</span>
              </div>
            ) : (
              <>
                <p className="font-semibold text-foreground mb-1">Get your personalized FI roadmap</p>
                <p className="text-sm text-muted-foreground mb-4">Based on your {tier.label} score — we'll send you the highest-impact next steps to accelerate your path to financial independence.</p>
                <form onSubmit={handleLeadCapture} className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={leadEmail}
                    onChange={e => setLeadEmail(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="fi-email-input"
                  />
                  <Button type="submit" disabled={leadLoading} size="sm" className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white" data-testid="fi-email-submit">
                    {leadLoading ? '...' : 'Send Roadmap'}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">No spam — just actionable steps based on your score.</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Question breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Breakdown by Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {QUESTIONS.map((q) => {
              const pts = answers[q.id] || 0;
              const maxPts = Math.max(...q.options.map(o => o.points));
              const pctQ = maxPts > 0 ? pts / maxPts : 0;
              const selectedOption = q.options.find(o => o.points === pts);
              return (
                <div key={q.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{q.question}</span>
                    <span className="text-muted-foreground text-xs">{pts}/{maxPts}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctQ * 100}%`, backgroundColor: pctQ >= 0.7 ? '#10b981' : pctQ >= 0.4 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedOption?.label}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Social Share */}
        {showShare ? (
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Share your score</p>
              <div className="p-3 bg-background rounded-lg border text-xs text-muted-foreground font-mono whitespace-pre-wrap">{shareText}</div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleTwitterShare} className="bg-black hover:bg-black/80 text-white" data-testid="fi-share-twitter">
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share on X
                </Button>
                <Button size="sm" variant="outline" onClick={handleRedditShare} className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10" data-testid="fi-share-reddit">
                  Share on Reddit
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} data-testid="fi-share-copy">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex gap-3 justify-center">
          <Button onClick={() => setShowShare(s => !s)} variant="outline" data-testid="fi-share-btn">
            <Share2 className="h-4 w-4 mr-2" /> Share Score
          </Button>
          <Button onClick={restart} variant="outline">Retake Quiz</Button>
        </div>

        <Disclaimer />
      </div>
    );
  }

  const q = QUESTIONS[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <Award className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Financial Independence Score</h1>
          <p className="text-muted-foreground text-sm">6 questions · 2 minutes · See where you stand on the path to FI</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {currentQuestion + 1} of {totalQuestions}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <p className="text-lg font-semibold text-foreground mb-1">{q.question}</p>
          {q.subtext && <p className="text-sm text-muted-foreground mb-6">{q.subtext}</p>}
          {!q.subtext && <div className="mb-6" />}
          <div className="space-y-2">
            {q.options.map((option) => {
              const isSelected = answers[q.id] === option.points;
              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(q.id, option.points)}
                  data-testid={`fi-option-${option.value}`}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {currentQuestion > 0 && (
        <div className="flex justify-start">
          <Button variant="ghost" size="sm" onClick={() => setCurrentQuestion(q => q - 1)} className="text-muted-foreground">
            ← Previous
          </Button>
        </div>
      )}
    </div>
  );
}
