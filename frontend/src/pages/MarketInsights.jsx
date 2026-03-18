import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Newspaper, TrendingUp, Award, Calendar, ChevronRight, 
  BarChart3, Lightbulb, Bell, Clock, User
} from 'lucide-react';
import { CalculatorGate } from '../components/FeatureGate';
import { Disclaimer } from '../components/calculators/Disclaimer';

const MarketInsightsContent = () => {
  // Sample data - in production this would come from an API
  const latestUpdate = {
    date: 'March 18, 2026',
    title: 'SA Markets Weekly Wrap: JSE All Share hits new high',
    author: 'Financial Advisory Pro Research Team',
    summary: 'The JSE All Share Index gained 2.3% this week, driven by strong performance in the resources sector. Gold stocks led the charge as the precious metal price surged above $2,100/oz.',
  };

  const cfpTips = [
    {
      title: 'Maximize Your RA Contributions Before Tax Year End',
      author: 'Certified Financial Planner',
      tip: 'With only weeks left until the 2026/27 tax year ends, consider topping up your retirement annuity to claim the maximum 27.5% tax deduction (capped at R430,000).',
    },
    {
      title: 'TFSA Limit Increase: What It Means For You',
      author: 'Certified Financial Planner',
      tip: 'The new R46,000 annual TFSA limit presents an opportunity to shelter more investment growth from tax. Consider prioritizing TFSA contributions if you have maxed out your RA deductions.',
    },
    {
      title: 'Understanding the New CGT Exclusions',
      author: 'Certified Financial Planner',
      tip: 'The increased annual exclusion of R50,000 for capital gains means you can realize more profits tax-free. Consider this when rebalancing your portfolio.',
    },
  ];

  const marketHighlights = [
    { label: 'JSE All Share', value: '+2.3%', positive: true },
    { label: 'USD/ZAR', value: '18.45', positive: false },
    { label: 'Gold (USD/oz)', value: '$2,105', positive: true },
    { label: 'Brent Crude', value: '$82.50', positive: true },
  ];

  return (
    <div className="space-y-6" data-testid="market-insights">
      <Disclaimer />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-blue-400" />
            Weekly Market Insights
          </h1>
          <p className="text-slate-400 mt-1">Expert analysis & tips from certified financial planners</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Bell className="h-3 w-3 mr-1" />
            Updated Weekly
          </Badge>
        </div>
      </div>

      {/* Market Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketHighlights.map((item, idx) => (
          <Card key={idx} className="bg-navy-900/50 border-navy-700">
            <CardContent className="p-4">
              <p className="text-sm text-slate-400 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.positive ? 'text-emerald-400' : 'text-slate-300'}`}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest Weekly Update */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-navy-900 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-500/20 text-blue-400">
              <Calendar className="h-3 w-3 mr-1" />
              {latestUpdate.date}
            </Badge>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              Latest Update
            </Badge>
          </div>
          <CardTitle className="text-xl text-white mt-3">{latestUpdate.title}</CardTitle>
          <CardDescription className="flex items-center gap-2 text-slate-400">
            <User className="h-4 w-4" />
            {latestUpdate.author}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 leading-relaxed">{latestUpdate.summary}</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            Read Full Analysis
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* CFP Tips Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-6 w-6 text-amber-400" />
          <h2 className="text-xl font-semibold text-white">Tips from Certified Financial Planners</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {cfpTips.map((tip, idx) => (
            <Card key={idx} className="bg-navy-900/50 border-navy-700 hover:border-amber-500/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">CFP® Tip</Badge>
                </div>
                <CardTitle className="text-base text-white">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 leading-relaxed">{tip.tip}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Features */}
      <Card className="bg-navy-900/50 border-navy-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">More Insights Coming Soon</h3>
              <p className="text-slate-400 text-sm">
                We're working on bringing you sector analysis, stock picks, and personalized recommendations 
                based on your portfolio. Stay tuned for updates!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Schedule */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <Clock className="h-4 w-4" />
        <span>Market insights are updated every Monday morning</span>
      </div>
    </div>
  );
};

// Wrap with CalculatorGate for premium access
const MarketInsights = () => {
  return (
    <CalculatorGate path="/market-insights">
      <MarketInsightsContent />
    </CalculatorGate>
  );
};

export default MarketInsights;
