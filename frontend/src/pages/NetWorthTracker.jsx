import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField } from '@/components/calculators/InputField';
import { BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Landmark, Home, TrendingUp, Plus, Trash2, PiggyBank, CreditCard, 
  Save, History, Target, Award, Lightbulb, ArrowUpRight, ArrowDownRight,
  Calendar, Trophy, Star, Crown, Gem, Rocket, CheckCircle, AlertTriangle,
  Info, TrendingDown, BarChart3, PieChart, Calculator, Sparkles, Lock
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const generateId = () => Math.random().toString(36).substr(2, 9);

// Milestone icons mapping
const MILESTONE_ICONS = {
  'trending-up': TrendingUp,
  'star': Star,
  'award': Award,
  'crown': Crown,
  'gem': Gem,
  'trophy': Trophy,
  'rocket': Rocket,
};

// Asset categories with more options
const ASSET_CATEGORIES = [
  { value: 'property', label: 'Property', icon: Home },
  { value: 'retirement', label: 'Retirement', icon: PiggyBank },
  { value: 'investments', label: 'Investments', icon: TrendingUp },
  { value: 'cash', label: 'Cash/Savings', icon: Landmark },
  { value: 'crypto', label: 'Cryptocurrency', icon: Sparkles },
  { value: 'business', label: 'Business Equity', icon: BarChart3 },
  { value: 'collectibles', label: 'Collectibles', icon: Gem },
  { value: 'vehicles', label: 'Vehicles', icon: CreditCard },
  { value: 'other', label: 'Other', icon: PieChart },
];

const LIABILITY_CATEGORIES = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'vehicle', label: 'Vehicle Loan' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'student', label: 'Student Loan' },
  { value: 'business', label: 'Business Loan' },
  { value: 'other', label: 'Other' },
];

export const NetWorthTracker = () => {
  const { symbol, formatCurrency } = useCurrency();
  const { token } = useAuth();
  
  // Core state
  const [assets, setAssets] = useState([
    { id: generateId(), name: 'Primary Residence', value: 2500000, category: 'property' },
    { id: generateId(), name: 'Investment Property', value: 1500000, category: 'property' },
    { id: generateId(), name: 'Retirement Annuity', value: 800000, category: 'retirement' },
    { id: generateId(), name: 'Pension Fund', value: 600000, category: 'retirement' },
    { id: generateId(), name: 'Stock Portfolio', value: 500000, category: 'investments' },
    { id: generateId(), name: 'Unit Trusts', value: 300000, category: 'investments' },
    { id: generateId(), name: 'Emergency Fund', value: 150000, category: 'cash' },
    { id: generateId(), name: 'Savings Account', value: 100000, category: 'cash' },
    { id: generateId(), name: 'Vehicle', value: 350000, category: 'vehicles' },
  ]);

  const [liabilities, setLiabilities] = useState([
    { id: generateId(), name: 'Home Loan', value: 1800000, category: 'mortgage', interestRate: 11.5 },
    { id: generateId(), name: 'Car Finance', value: 200000, category: 'vehicle', interestRate: 13 },
    { id: generateId(), name: 'Credit Card', value: 50000, category: 'credit', interestRate: 21 },
    { id: generateId(), name: 'Personal Loan', value: 100000, category: 'personal', interestRate: 18 },
  ]);

  // Enhanced state
  const [activeTab, setActiveTab] = useState('overview');
  const [snapshots, setSnapshots] = useState([]);
  const [goals, setGoals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [insights, setInsights] = useState({ insights: [], recommendations: [], summary: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Goal form state
  const [newGoalAmount, setNewGoalAmount] = useState(5000000);
  const [newGoalDate, setNewGoalDate] = useState('2030-12-31');
  const [newGoalName, setNewGoalName] = useState('Financial Freedom');

  // What-if scenario state
  const [scenario, setScenario] = useState({
    additionalMonthlySavings: 5000,
    debtToPayOff: '',
    years: 5,
    expectedReturn: 8,
  });

  // Fetch data on mount
  useEffect(() => {
    if (token) {
      fetchSnapshots();
      fetchGoals();
      fetchMilestones();
    }
  }, [token]);

  // Calculate results
  const results = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Get previous net worth from snapshots
    const previousNetWorth = snapshots.length > 0 ? snapshots[0].net_worth : netWorth;
    const netWorthChange = netWorth - previousNetWorth;
    const netWorthChangePercent = previousNetWorth > 0 ? (netWorthChange / previousNetWorth * 100) : 0;
    
    // Ratios
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
    
    // Asset breakdown
    const assetCategories = {};
    ASSET_CATEGORIES.forEach(cat => {
      assetCategories[cat.value] = { name: cat.label, value: 0, color: getColorForCategory(cat.value) };
    });
    assets.forEach(asset => {
      if (assetCategories[asset.category]) {
        assetCategories[asset.category].value += asset.value;
      }
    });
    const assetBreakdown = Object.values(assetCategories).filter(c => c.value > 0);
    
    // Liability breakdown
    const liabilityCategories = {};
    LIABILITY_CATEGORIES.forEach(cat => {
      liabilityCategories[cat.value] = { name: cat.label, value: 0, color: getColorForLiability(cat.value) };
    });
    liabilities.forEach(liability => {
      if (liabilityCategories[liability.category]) {
        liabilityCategories[liability.category].value += liability.value;
      }
    });
    const liabilityBreakdown = Object.values(liabilityCategories).filter(c => c.value > 0);
    
    // Liquidity
    const liquidAssets = assets.filter(a => ['cash', 'investments', 'crypto'].includes(a.category))
                               .reduce((sum, a) => sum + a.value, 0);
    const liquidityRatio = totalLiabilities > 0 ? (liquidAssets / totalLiabilities * 100) : 100;
    
    // Health score
    let healthScore = 50;
    if (netWorth > 0) healthScore += 20;
    if (debtToAssetRatio < 50) healthScore += 15;
    if (liquidityRatio > 20) healthScore += 15;
    healthScore = Math.min(100, healthScore);

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      netWorthChange,
      netWorthChangePercent: netWorthChangePercent.toFixed(2),
      debtToAssetRatio: debtToAssetRatio.toFixed(1),
      liquidAssets,
      liquidityRatio: liquidityRatio.toFixed(1),
      healthScore,
      assetBreakdown,
      liabilityBreakdown,
      isPositive: netWorth >= 0,
      isGrowing: netWorthChange >= 0,
    };
  }, [assets, liabilities, snapshots]);

  // Fetch insights when data changes
  useEffect(() => {
    if (token && results.totalAssets > 0) {
      fetchInsights();
    }
  }, [results.totalAssets, results.totalLiabilities, token]);

  // API Functions
  const fetchSnapshots = async () => {
    try {
      const res = await fetch(`${API_URL}/api/net-worth/snapshots/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_URL}/api/net-worth/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    }
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/net-worth/milestones/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMilestones(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_URL}/api/net-worth/insights`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assets,
          liabilities,
          total_assets: results.totalAssets,
          total_liabilities: results.totalLiabilities,
          net_worth: results.netWorth
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  };

  const saveSnapshot = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/net-worth/snapshots`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assets,
          liabilities,
          total_assets: results.totalAssets,
          total_liabilities: results.totalLiabilities,
          net_worth: results.netWorth
        })
      });
      if (res.ok) {
        toast.success('Snapshot saved! Your net worth has been recorded.');
        fetchSnapshots();
        fetchMilestones();
      } else {
        toast.error('Failed to save snapshot');
      }
    } catch (err) {
      toast.error('Failed to save snapshot');
    } finally {
      setIsSaving(false);
    }
  };

  const createGoal = async () => {
    try {
      const res = await fetch(`${API_URL}/api/net-worth/goals`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_amount: newGoalAmount,
          target_date: newGoalDate,
          name: newGoalName
        })
      });
      if (res.ok) {
        toast.success('Goal created!');
        fetchGoals();
        setNewGoalName('');
      } else {
        toast.error('Failed to create goal');
      }
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await fetch(`${API_URL}/api/net-worth/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchGoals();
      toast.success('Goal deleted');
    } catch (err) {
      toast.error('Failed to delete goal');
    }
  };

  // Helper functions
  const addAsset = () => {
    setAssets(prev => [...prev, { id: generateId(), name: 'New Asset', value: 0, category: 'other' }]);
  };

  const addLiability = () => {
    setLiabilities(prev => [...prev, { id: generateId(), name: 'New Liability', value: 0, category: 'personal', interestRate: 15 }]);
  };

  const removeAsset = (id) => setAssets(prev => prev.filter(a => a.id !== id));
  const removeLiability = (id) => setLiabilities(prev => prev.filter(l => l.id !== id));
  const updateAsset = (id, field, value) => setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  const updateLiability = (id, field, value) => setLiabilities(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

  // Calculate goal progress
  const calculateGoalProgress = (goal) => {
    const progress = (results.netWorth / goal.target_amount) * 100;
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const monthsRemaining = Math.max(0, (targetDate - today) / (1000 * 60 * 60 * 24 * 30));
    const amountNeeded = goal.target_amount - results.netWorth;
    const monthlySavingsNeeded = monthsRemaining > 0 ? amountNeeded / monthsRemaining : amountNeeded;
    
    return {
      progress: Math.min(100, progress),
      monthsRemaining: Math.round(monthsRemaining),
      amountNeeded: Math.max(0, amountNeeded),
      monthlySavingsNeeded: Math.max(0, monthlySavingsNeeded),
      isOnTrack: progress >= (100 - (monthsRemaining / 12 * 10))
    };
  };

  // What-if calculations
  const whatIfResults = useMemo(() => {
    const { additionalMonthlySavings, years, expectedReturn } = scenario;
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    
    // Future value of additional savings
    const futureValueSavings = additionalMonthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    // Current investments growth
    const currentInvestments = assets.filter(a => ['investments', 'retirement', 'crypto'].includes(a.category))
                                     .reduce((sum, a) => sum + a.value, 0);
    const futureValueInvestments = currentInvestments * Math.pow(1 + expectedReturn / 100, years);
    
    // Project liabilities (assuming minimum payments)
    const projectedLiabilities = results.totalLiabilities * 0.5; // Rough estimate
    
    const projectedNetWorth = results.netWorth + futureValueSavings + (futureValueInvestments - currentInvestments);
    
    return {
      futureValueSavings,
      futureValueInvestments,
      projectedNetWorth,
      projectedGrowth: projectedNetWorth - results.netWorth,
      growthPercent: ((projectedNetWorth - results.netWorth) / results.netWorth * 100).toFixed(1)
    };
  }, [scenario, assets, results]);

  // Print data
  const printInputs = [
    { label: 'Total Assets', value: formatCurrency(results.totalAssets) },
    { label: 'Total Liabilities', value: formatCurrency(results.totalLiabilities) },
    { label: 'Number of Assets', value: assets.length.toString() },
    { label: 'Number of Liabilities', value: liabilities.length.toString() },
  ];

  const printResults = [
    { label: 'Net Worth', value: formatCurrency(results.netWorth) },
    { label: 'Debt-to-Asset Ratio', value: `${results.debtToAssetRatio}%` },
    { label: 'Liquidity Ratio', value: `${results.liquidityRatio}%` },
    { label: 'Financial Health Score', value: `${results.healthScore}/100` },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="net-worth-tracker">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Net Worth Tracker
          </h1>
          <p className="text-muted-foreground">
            Track, analyze, and grow your wealth with powerful insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={saveSnapshot} 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Snapshot'}
          </Button>
          <PrintReport
            title="Net Worth Statement"
            calculatorType="net-worth"
            inputs={printInputs}
            results={printResults}
          />
        </div>
      </div>

      <Disclaimer />

      {/* Main Net Worth Display */}
      <Card className={`mb-6 overflow-hidden border-2 ${results.isPositive ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
        <CardContent className="p-0">
          <div className={`p-8 ${results.isPositive ? 'bg-gradient-to-br from-emerald-500/10 to-navy-900' : 'bg-gradient-to-br from-red-500/10 to-navy-900'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={results.isPositive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                    <Landmark className="h-3 w-3 mr-1" />
                    Net Worth
                  </Badge>
                  {snapshots.length > 0 && (
                    <Badge className={results.isGrowing ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                      {results.isGrowing ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {results.netWorthChangePercent}%
                    </Badge>
                  )}
                </div>
                <p className={`text-5xl font-bold font-display ${results.isPositive ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrency(results.netWorth)}
                </p>
                {snapshots.length > 0 && (
                  <p className="text-sm text-slate-400 mt-2">
                    Change: {results.netWorthChange >= 0 ? '+' : ''}{formatCurrency(results.netWorthChange)} since last snapshot
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Assets</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(results.totalAssets)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Liabilities</p>
                  <p className="text-lg font-bold text-red-400">{formatCurrency(results.totalLiabilities)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Debt Ratio</p>
                  <p className={`text-lg font-bold ${parseFloat(results.debtToAssetRatio) < 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {results.debtToAssetRatio}%
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Health Score</p>
                  <p className={`text-lg font-bold ${results.healthScore >= 70 ? 'text-emerald-400' : results.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {results.healthScore}/100
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="whatif" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">What-If</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Assets Input */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Assets
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={addAsset}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {assets.map((asset) => (
                  <div key={asset.id} className="p-3 border border-border rounded-lg space-y-2 bg-navy-800/30">
                    <div className="flex items-center justify-between">
                      <select
                        value={asset.category}
                        onChange={(e) => updateAsset(asset.id, 'category', e.target.value)}
                        className="text-xs bg-navy-700 px-2 py-1 rounded border-0 text-slate-300"
                      >
                        {ASSET_CATEGORIES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300"
                        onClick={() => removeAsset(asset.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                      className="w-full text-sm font-medium bg-transparent border-0 p-0 focus:outline-none text-white"
                    />
                    <InputField
                      label=""
                      id={`asset-${asset.id}`}
                      value={asset.value}
                      onChange={(val) => updateAsset(asset.id, 'value', val)}
                      prefix={symbol}
                      min={0}
                      step={10000}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Liabilities Input */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-500" />
                    Liabilities
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={addLiability}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {liabilities.map((liability) => (
                  <div key={liability.id} className="p-3 border border-border rounded-lg space-y-2 bg-navy-800/30">
                    <div className="flex items-center justify-between">
                      <select
                        value={liability.category}
                        onChange={(e) => updateLiability(liability.id, 'category', e.target.value)}
                        className="text-xs bg-navy-700 px-2 py-1 rounded border-0 text-slate-300"
                      >
                        {LIABILITY_CATEGORIES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300"
                        onClick={() => removeLiability(liability.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <input
                      type="text"
                      value={liability.name}
                      onChange={(e) => updateLiability(liability.id, 'name', e.target.value)}
                      className="w-full text-sm font-medium bg-transparent border-0 p-0 focus:outline-none text-white"
                    />
                    <InputField
                      label=""
                      id={`liability-${liability.id}`}
                      value={liability.value}
                      onChange={(val) => updateLiability(liability.id, 'value', val)}
                      prefix={symbol}
                      min={0}
                      step={10000}
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Interest:</span>
                      <input
                        type="number"
                        value={liability.interestRate || 0}
                        onChange={(e) => updateLiability(liability.id, 'interestRate', parseFloat(e.target.value))}
                        className="w-16 bg-navy-700 px-2 py-1 rounded text-slate-300"
                        step="0.5"
                      />
                      <span>%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.assetBreakdown}
                    height={200}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Liability Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.liabilityBreakdown.length > 0 ? (
                    <BreakdownPieChart
                      data={results.liabilityBreakdown}
                      height={200}
                      prefix={symbol}
                    />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-emerald-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Debt-free!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Financial Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {milestones.map((milestone, idx) => {
                  const IconComponent = MILESTONE_ICONS[milestone.icon] || Award;
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg text-center transition-all ${
                        milestone.is_achieved 
                          ? 'bg-gradient-to-br from-amber-500/20 to-emerald-500/10 border border-amber-500/30' 
                          : 'bg-navy-800/50 border border-navy-700 opacity-50'
                      }`}
                    >
                      <IconComponent className={`h-8 w-8 mx-auto mb-2 ${milestone.is_achieved ? 'text-amber-500' : 'text-slate-500'}`} />
                      <p className={`text-xs font-medium ${milestone.is_achieved ? 'text-white' : 'text-slate-500'}`}>
                        {milestone.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatCurrency(milestone.amount)}
                      </p>
                      {milestone.is_achieved && (
                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Net Worth History</CardTitle>
              <CardDescription>Track your wealth growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots.length > 1 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={snapshots.slice().reverse()}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' })}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      tickFormatter={(val) => `R${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      formatter={(val) => [formatCurrency(val), 'Net Worth']}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="net_worth" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#netWorthGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-400">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No history yet</p>
                  <p className="text-sm">Save snapshots regularly to track your progress</p>
                  <Button onClick={saveSnapshot} className="mt-4" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Your First Snapshot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Snapshots List */}
          {snapshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Snapshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {snapshots.slice(0, 10).map((snapshot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-navy-800/30">
                      <div>
                        <p className="font-medium text-white">
                          {new Date(snapshot.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-400">
                          Assets: {formatCurrency(snapshot.total_assets)} | Liabilities: {formatCurrency(snapshot.total_liabilities)}
                        </p>
                      </div>
                      <p className={`text-lg font-bold ${snapshot.net_worth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(snapshot.net_worth)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          {/* Create Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Set a New Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Goal Name</label>
                  <Input
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="e.g., Financial Freedom"
                    className="bg-navy-800"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Target Amount</label>
                  <InputField
                    label=""
                    id="goalAmount"
                    value={newGoalAmount}
                    onChange={setNewGoalAmount}
                    prefix={symbol}
                    min={0}
                    step={100000}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Target Date</label>
                  <Input
                    type="date"
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="bg-navy-800"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createGoal} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Goals */}
          <div className="grid md:grid-cols-2 gap-6">
            {goals.length > 0 ? goals.map((goal) => {
              const progress = calculateGoalProgress(goal);
              return (
                <Card key={goal.id} className={`border-2 ${progress.isOnTrack ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <CardDescription>
                          Target: {formatCurrency(goal.target_amount)} by {new Date(goal.target_date).toLocaleDateString('en-ZA')}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-400">Progress</span>
                          <span className={progress.isOnTrack ? 'text-emerald-400' : 'text-amber-400'}>
                            {progress.progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress.progress} className="h-3" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Amount Needed</p>
                          <p className="font-bold text-white">{formatCurrency(progress.amountNeeded)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Months Remaining</p>
                          <p className="font-bold text-white">{progress.monthsRemaining} months</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400">Monthly Savings Needed</p>
                          <p className={`font-bold ${progress.monthlySavingsNeeded > 20000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {formatCurrency(progress.monthlySavingsNeeded)}/month
                          </p>
                        </div>
                      </div>
                      
                      <Badge className={progress.isOnTrack ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                        {progress.isOnTrack ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> On Track</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 mr-1" /> Needs Attention</>
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <Card className="md:col-span-2">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                  <p className="text-lg font-medium text-slate-400">No goals set yet</p>
                  <p className="text-sm text-slate-500">Create your first financial goal above</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Smart Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.insights?.length > 0 ? insights.insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border ${
                      insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                      insight.type === 'danger' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" /> :
                       insight.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" /> :
                       insight.type === 'danger' ? <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" /> :
                       <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-white">{insight.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-400 text-center py-8">Add your assets and liabilities to get personalized insights</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.recommendations?.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-navy-800/50">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-emerald-400">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-slate-300">{rec}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-center py-8">Recommendations will appear based on your financial data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Allocation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {Object.entries(insights.summary || {}).map(([key, value]) => (
                  <div key={key} className="text-center p-4 rounded-lg bg-navy-800/50">
                    <p className="text-xs text-slate-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-white">{value}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* What-If Tab */}
        <TabsContent value="whatif" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                What-If Scenario Planner
              </CardTitle>
              <CardDescription>See how changes could impact your future net worth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Additional Monthly Savings</label>
                    <InputField
                      label=""
                      id="additionalSavings"
                      value={scenario.additionalMonthlySavings}
                      onChange={(val) => setScenario(s => ({ ...s, additionalMonthlySavings: val }))}
                      prefix={symbol}
                      min={0}
                      step={500}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Time Horizon (Years)</label>
                    <Input
                      type="number"
                      value={scenario.years}
                      onChange={(e) => setScenario(s => ({ ...s, years: parseInt(e.target.value) || 1 }))}
                      className="bg-navy-800"
                      min={1}
                      max={30}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Expected Annual Return (%)</label>
                    <Input
                      type="number"
                      value={scenario.expectedReturn}
                      onChange={(e) => setScenario(s => ({ ...s, expectedReturn: parseFloat(e.target.value) || 0 }))}
                      className="bg-navy-800"
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/10 border border-blue-500/30">
                    <p className="text-sm text-slate-400 mb-1">Projected Net Worth in {scenario.years} Years</p>
                    <p className="text-4xl font-bold text-white">{formatCurrency(whatIfResults.projectedNetWorth)}</p>
                    <p className="text-sm text-emerald-400 mt-2">
                      +{formatCurrency(whatIfResults.projectedGrowth)} ({whatIfResults.growthPercent}% growth)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-navy-800/50">
                      <p className="text-xs text-slate-400 mb-1">From Additional Savings</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(whatIfResults.futureValueSavings)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-navy-800/50">
                      <p className="text-xs text-slate-400 mb-1">Investment Growth</p>
                      <p className="text-lg font-bold text-blue-400">{formatCurrency(whatIfResults.futureValueInvestments)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions for colors
function getColorForCategory(category) {
  const colors = {
    property: 'hsl(43, 74%, 49%)',
    retirement: 'hsl(150, 45%, 35%)',
    investments: 'hsl(215, 50%, 45%)',
    cash: 'hsl(180, 45%, 40%)',
    crypto: 'hsl(280, 60%, 55%)',
    business: 'hsl(320, 50%, 45%)',
    collectibles: 'hsl(35, 70%, 50%)',
    vehicles: 'hsl(200, 40%, 40%)',
    other: 'hsl(240, 30%, 45%)',
  };
  return colors[category] || colors.other;
}

function getColorForLiability(category) {
  const colors = {
    mortgage: 'hsl(0, 60%, 50%)',
    vehicle: 'hsl(30, 60%, 50%)',
    credit: 'hsl(350, 70%, 55%)',
    personal: 'hsl(320, 45%, 45%)',
    student: 'hsl(280, 50%, 50%)',
    business: 'hsl(15, 60%, 50%)',
    other: 'hsl(0, 40%, 45%)',
  };
  return colors[category] || colors.other;
}
