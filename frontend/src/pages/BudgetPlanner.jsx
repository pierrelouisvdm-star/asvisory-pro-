import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField } from '@/components/calculators/InputField';
import { BreakdownPieChart, ComparisonBarChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Home, Car, ShoppingCart, Heart, Briefcase, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const categoryIcons = {
  housing: Home,
  transport: Car,
  food: ShoppingCart,
  healthcare: Heart,
  savings: TrendingUp,
  other: Briefcase,
};

export const BudgetPlanner = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [income, setIncome] = useState({
    salary: 50000,
    bonus: 5000,
    investment: 2000,
    rental: 0,
    other: 0,
  });

  const [expenses, setExpenses] = useState({
    housing: 15000,
    utilities: 2500,
    transport: 5000,
    food: 6000,
    healthcare: 2000,
    insurance: 3000,
    debt: 5000,
    entertainment: 3000,
    clothing: 1500,
    education: 2000,
    savings: 5000,
    other: 2000,
  });

  const [savingsGoal, setSavingsGoal] = useState(20);

  const updateIncome = (field, value) => {
    setIncome(prev => ({ ...prev, [field]: value }));
  };

  const updateExpense = (field, value) => {
    setExpenses(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    // Total income
    const totalIncome = Object.values(income).reduce((sum, val) => sum + val, 0);
    
    // Total expenses
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    
    // Net income
    const netIncome = totalIncome - totalExpenses;
    
    // Savings rate
    const currentSavingsRate = totalIncome > 0 ? (expenses.savings / totalIncome * 100) : 0;
    const actualSavingsRate = totalIncome > 0 ? ((expenses.savings + netIncome) / totalIncome * 100) : 0;
    
    // 50/30/20 Rule Analysis
    const needsCategories = ['housing', 'utilities', 'transport', 'food', 'healthcare', 'insurance', 'debt'];
    const wantsCategories = ['entertainment', 'clothing', 'other'];
    const savingsCategories = ['savings', 'education'];
    
    const needs = needsCategories.reduce((sum, cat) => sum + (expenses[cat] || 0), 0);
    const wants = wantsCategories.reduce((sum, cat) => sum + (expenses[cat] || 0), 0);
    const savings = savingsCategories.reduce((sum, cat) => sum + (expenses[cat] || 0), 0);
    
    const needsPercent = totalIncome > 0 ? (needs / totalIncome * 100) : 0;
    const wantsPercent = totalIncome > 0 ? (wants / totalIncome * 100) : 0;
    const savingsPercent = totalIncome > 0 ? (savings / totalIncome * 100) : 0;
    
    // Target amounts based on 50/30/20
    const targetNeeds = totalIncome * 0.5;
    const targetWants = totalIncome * 0.3;
    const targetSavings = totalIncome * 0.2;
    
    // Goal tracking
    const savingsGoalAmount = totalIncome * (savingsGoal / 100);
    const savingsGap = savingsGoalAmount - savings;
    
    // Expense breakdown for pie chart
    const expenseBreakdown = [
      { name: 'Housing', value: expenses.housing, color: 'hsl(43, 74%, 49%)' },
      { name: 'Transport', value: expenses.transport, color: 'hsl(150, 45%, 35%)' },
      { name: 'Food', value: expenses.food, color: 'hsl(215, 50%, 35%)' },
      { name: 'Healthcare', value: expenses.healthcare + expenses.insurance, color: 'hsl(0, 60%, 50%)' },
      { name: 'Utilities', value: expenses.utilities, color: 'hsl(180, 45%, 40%)' },
      { name: 'Debt', value: expenses.debt, color: 'hsl(280, 45%, 45%)' },
      { name: 'Entertainment', value: expenses.entertainment, color: 'hsl(320, 45%, 45%)' },
      { name: 'Savings', value: expenses.savings, color: 'hsl(120, 45%, 40%)' },
      { name: 'Other', value: expenses.clothing + expenses.education + expenses.other, color: 'hsl(30, 60%, 50%)' },
    ].filter(e => e.value > 0);

    // 50/30/20 breakdown
    const ruleBreakdown = [
      { name: 'Needs (50%)', value: needs, color: 'hsl(43, 74%, 49%)' },
      { name: 'Wants (30%)', value: wants, color: 'hsl(150, 45%, 35%)' },
      { name: 'Savings (20%)', value: savings, color: 'hsl(215, 50%, 35%)' },
    ];

    // Comparison data
    const comparisonData = [
      { name: 'Needs', actual: needsPercent, target: 50 },
      { name: 'Wants', actual: wantsPercent, target: 30 },
      { name: 'Savings', actual: savingsPercent, target: 20 },
    ];

    // Health indicators
    const isHealthy = netIncome >= 0 && savingsPercent >= 15;
    const warnings = [];
    if (netIncome < 0) warnings.push('Spending exceeds income');
    if (needsPercent > 60) warnings.push('Needs exceed 60% of income');
    if (savingsPercent < 10) warnings.push('Savings below 10%');
    if (expenses.debt > totalIncome * 0.2) warnings.push('Debt payments exceed 20%');

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      currentSavingsRate: currentSavingsRate.toFixed(1),
      actualSavingsRate: actualSavingsRate.toFixed(1),
      needs,
      wants,
      savings,
      needsPercent: needsPercent.toFixed(1),
      wantsPercent: wantsPercent.toFixed(1),
      savingsPercent: savingsPercent.toFixed(1),
      targetNeeds,
      targetWants,
      targetSavings,
      savingsGoalAmount,
      savingsGap,
      expenseBreakdown,
      ruleBreakdown,
      comparisonData,
      isHealthy,
      warnings,
    };
  }, [income, expenses, savingsGoal]);

  const printInputs = [
    { label: 'Total Monthly Income', value: formatCurrency(results.totalIncome) },
    { label: 'Total Monthly Expenses', value: formatCurrency(results.totalExpenses) },
    { label: 'Savings Goal', value: `${savingsGoal}%` },
  ];

  const printResults = [
    { label: 'Net Monthly Income', value: formatCurrency(results.netIncome) },
    { label: 'Savings Rate', value: `${results.savingsPercent}%` },
    { label: 'Needs (Target 50%)', value: `${results.needsPercent}%` },
    { label: 'Wants (Target 30%)', value: `${results.wantsPercent}%` },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Budget Planner
          </h1>
          <p className="text-muted-foreground">
            Analyze your income and expenses with the 50/30/20 rule
          </p>
        </div>
        <PrintReport
          title="Budget Analysis"
          calculatorType="budget"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Monthly Income"
            description="All sources of income"
            icon={TrendingUp}
          >
            <div className="space-y-4">
              <InputField
                label="Salary/Wages"
                id="salary"
                value={income.salary}
                onChange={(val) => updateIncome('salary', val)}
                prefix={symbol}
                min={0}
                step={5000}
              />
              <InputField
                label="Bonus/Commission"
                id="bonus"
                value={income.bonus}
                onChange={(val) => updateIncome('bonus', val)}
                prefix={symbol}
                min={0}
                step={1000}
              />
              <InputField
                label="Investment Income"
                id="investment"
                value={income.investment}
                onChange={(val) => updateIncome('investment', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Rental Income"
                id="rental"
                value={income.rental}
                onChange={(val) => updateIncome('rental', val)}
                prefix={symbol}
                min={0}
                step={1000}
              />
              <InputField
                label="Other Income"
                id="otherIncome"
                value={income.other}
                onChange={(val) => updateIncome('other', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Monthly Expenses"
            description="Track your spending"
            icon={TrendingDown}
          >
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <InputField
                label="Housing (Rent/Bond)"
                id="housing"
                value={expenses.housing}
                onChange={(val) => updateExpense('housing', val)}
                prefix={symbol}
                min={0}
                step={1000}
              />
              <InputField
                label="Utilities"
                id="utilities"
                value={expenses.utilities}
                onChange={(val) => updateExpense('utilities', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Transport"
                id="transport"
                value={expenses.transport}
                onChange={(val) => updateExpense('transport', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Food & Groceries"
                id="food"
                value={expenses.food}
                onChange={(val) => updateExpense('food', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Healthcare"
                id="healthcare"
                value={expenses.healthcare}
                onChange={(val) => updateExpense('healthcare', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Insurance"
                id="insurance"
                value={expenses.insurance}
                onChange={(val) => updateExpense('insurance', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Debt Payments"
                id="debt"
                value={expenses.debt}
                onChange={(val) => updateExpense('debt', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Entertainment"
                id="entertainment"
                value={expenses.entertainment}
                onChange={(val) => updateExpense('entertainment', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Clothing"
                id="clothing"
                value={expenses.clothing}
                onChange={(val) => updateExpense('clothing', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Education"
                id="education"
                value={expenses.education}
                onChange={(val) => updateExpense('education', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Savings"
                id="savings"
                value={expenses.savings}
                onChange={(val) => updateExpense('savings', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              <InputField
                label="Other"
                id="otherExpense"
                value={expenses.other}
                onChange={(val) => updateExpense('other', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
            </div>
          </CalculatorCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Warnings */}
          {results.warnings.length > 0 && (
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Budget Warnings</h4>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      {results.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Results */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <ResultDisplay
                    label="Total Income"
                    value={results.totalIncome}
                    prefix={symbol}
                    size="lg"
                    variant="premium"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-muted">
              <CardContent className="p-0">
                <div className="p-6">
                  <ResultDisplay
                    label="Total Expenses"
                    value={results.totalExpenses}
                    prefix={symbol}
                    size="lg"
                    variant="muted"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className={`overflow-hidden border-2 ${results.netIncome >= 0 ? 'border-success/20' : 'border-destructive/20'}`}>
              <CardContent className="p-0">
                <div className={`p-6 ${results.netIncome >= 0 ? 'bg-success/5' : 'bg-destructive/5'}`}>
                  <ResultDisplay
                    label="Net Income"
                    value={results.netIncome}
                    prefix={symbol}
                    size="lg"
                    variant={results.netIncome >= 0 ? "success" : "muted"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 50/30/20 Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Target className="h-5 w-5 text-gold" />
                50/30/20 Budget Rule Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className={`p-4 rounded-lg ${parseFloat(results.needsPercent) <= 50 ? 'bg-success/10 border border-success/20' : 'bg-gold/10 border border-gold/20'}`}>
                  <p className="text-sm text-muted-foreground">Needs (Target: 50%)</p>
                  <p className="text-2xl font-bold">{results.needsPercent}%</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(results.needs)}</p>
                </div>
                <div className={`p-4 rounded-lg ${parseFloat(results.wantsPercent) <= 30 ? 'bg-success/10 border border-success/20' : 'bg-gold/10 border border-gold/20'}`}>
                  <p className="text-sm text-muted-foreground">Wants (Target: 30%)</p>
                  <p className="text-2xl font-bold">{results.wantsPercent}%</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(results.wants)}</p>
                </div>
                <div className={`p-4 rounded-lg ${parseFloat(results.savingsPercent) >= 20 ? 'bg-success/10 border border-success/20' : 'bg-gold/10 border border-gold/20'}`}>
                  <p className="text-sm text-muted-foreground">Savings (Target: 20%)</p>
                  <p className="text-2xl font-bold">{results.savingsPercent}%</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(results.savings)}</p>
                </div>
              </div>
              
              <ComparisonBarChart
                data={results.comparisonData}
                dataKeys={[
                  { key: 'actual', name: 'Actual %', color: 'hsl(43, 74%, 49%)' },
                  { key: 'target', name: 'Target %', color: 'hsl(150, 45%, 35%)' },
                ]}
                xAxisKey="name"
                height={200}
                prefix=""
              />
            </CardContent>
          </Card>

          {/* Savings Goal */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Savings Goal</h4>
                  <p className="text-sm text-muted-foreground">Set your target savings rate</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {savingsGoal}%
                </Badge>
              </div>
              <SliderField
                label=""
                id="savingsGoal"
                value={savingsGoal}
                onChange={setSavingsGoal}
                min={5}
                max={50}
                step={5}
                suffix="%"
                showValue={false}
              />
              <div className="mt-4 p-4 rounded-lg bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span>Target: {formatCurrency(results.savingsGoalAmount)}/month</span>
                  <span>Current: {formatCurrency(results.savings)}/month</span>
                </div>
                {results.savingsGap > 0 && (
                  <p className="text-sm text-gold mt-2">
                    Need to save {formatCurrency(results.savingsGap)} more per month
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList>
              <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
              <TabsTrigger value="rule">50/30/20 Split</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expenses" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Where Your Money Goes</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.expenseBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rule" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Needs vs Wants vs Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.ruleBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
