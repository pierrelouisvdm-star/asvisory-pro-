import React, { useState, useMemo } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { SliderField } from '@/components/calculators/InputField';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { GrowthAreaChart } from '@/components/calculators/GrowthChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CashFlowProjector = () => {
  const { currentCurrency } = useCurrency();
  const currencySymbol = currentCurrency.symbol;

  const [income, setIncome] = useState({
    salary: 50000,
    bonus: 5000,
    rental: 0,
    investments: 500,
    other: 0,
  });

  const [expenses, setExpenses] = useState({
    housing: 15000,
    utilities: 2500,
    transport: 4000,
    groceries: 5000,
    insurance: 2000,
    healthcare: 1500,
    entertainment: 3000,
    debt: 5000,
    savings: 5000,
    other: 2000,
  });

  const [projectionYears, setProjectionYears] = useState(5);
  const [incomeGrowth, setIncomeGrowth] = useState(5);
  const [expenseGrowth, setExpenseGrowth] = useState(6);

  const calculations = useMemo(() => {
    const totalIncome = Object.values(income).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (expenses.savings / totalIncome) * 100 : 0;
    
    // Project cash flow over time
    const projection = [];
    let cumulativeSavings = 0;
    
    for (let year = 0; year <= projectionYears; year++) {
      const projectedIncome = totalIncome * 12 * Math.pow(1 + incomeGrowth / 100, year);
      const projectedExpenses = totalExpenses * 12 * Math.pow(1 + expenseGrowth / 100, year);
      const projectedNet = projectedIncome - projectedExpenses;
      cumulativeSavings += projectedNet;
      
      projection.push({
        year: `Year ${year}`,
        income: projectedIncome,
        expenses: projectedExpenses,
        netCashFlow: projectedNet,
        cumulativeSavings,
      });
    }

    // Monthly breakdown for chart
    const monthlyBreakdown = [
      { name: 'Housing', value: expenses.housing, color: '#0ea5e9' },
      { name: 'Transport', value: expenses.transport, color: '#f59e0b' },
      { name: 'Groceries', value: expenses.groceries, color: '#10b981' },
      { name: 'Savings', value: expenses.savings, color: '#8b5cf6' },
      { name: 'Debt', value: expenses.debt, color: '#ef4444' },
      { name: 'Other', value: expenses.utilities + expenses.insurance + expenses.healthcare + expenses.entertainment + expenses.other, color: '#64748b' },
    ].filter(item => item.value > 0);

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      savingsRate,
      projection,
      monthlyBreakdown,
      annualIncome: totalIncome * 12,
      annualExpenses: totalExpenses * 12,
      annualNetCashFlow: netCashFlow * 12,
    };
  }, [income, expenses, projectionYears, incomeGrowth, expenseGrowth]);

  return (
    <div className="min-h-screen bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-3 bg-cyan-100 text-cyan-700 border-cyan-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Cash Flow Analysis
          </Badge>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Cash Flow Projector
          </h1>
          <p className="text-slate-500 mt-2">
            Visualize monthly cash flow and project future financial health
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="income">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="income">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Income
                </TabsTrigger>
                <TabsTrigger value="expenses">
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="projection">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Projection
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="mt-6">
                <CalculatorCard title="Monthly Income" icon={ArrowUpCircle}>
                  <div className="space-y-5">
                    <SliderField
                      id="salary"
                      label="Salary / Wages"
                      value={income.salary}
                      onChange={(v) => setIncome({...income, salary: v})}
                      min={0}
                      max={200000}
                      step={1000}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="bonus"
                      label="Bonuses / Commission (Monthly Avg)"
                      value={income.bonus}
                      onChange={(v) => setIncome({...income, bonus: v})}
                      min={0}
                      max={50000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="rental"
                      label="Rental Income"
                      value={income.rental}
                      onChange={(v) => setIncome({...income, rental: v})}
                      min={0}
                      max={50000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="investments"
                      label="Investment Income"
                      value={income.investments}
                      onChange={(v) => setIncome({...income, investments: v})}
                      min={0}
                      max={50000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="otherIncome"
                      label="Other Income"
                      value={income.other}
                      onChange={(v) => setIncome({...income, other: v})}
                      min={0}
                      max={50000}
                      step={500}
                      prefix={currencySymbol}
                    />
                  </div>
                </CalculatorCard>
              </TabsContent>

              <TabsContent value="expenses" className="mt-6">
                <CalculatorCard title="Monthly Expenses" icon={ArrowDownCircle}>
                  <div className="space-y-5">
                    <SliderField
                      id="housing"
                      label="Housing (Rent/Bond)"
                      value={expenses.housing}
                      onChange={(v) => setExpenses({...expenses, housing: v})}
                      min={0}
                      max={50000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="utilities"
                      label="Utilities (Water, Electricity)"
                      value={expenses.utilities}
                      onChange={(v) => setExpenses({...expenses, utilities: v})}
                      min={0}
                      max={10000}
                      step={100}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="transport"
                      label="Transport (Fuel, Car Payment)"
                      value={expenses.transport}
                      onChange={(v) => setExpenses({...expenses, transport: v})}
                      min={0}
                      max={20000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="groceries"
                      label="Groceries & Food"
                      value={expenses.groceries}
                      onChange={(v) => setExpenses({...expenses, groceries: v})}
                      min={0}
                      max={20000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="debt"
                      label="Debt Repayments"
                      value={expenses.debt}
                      onChange={(v) => setExpenses({...expenses, debt: v})}
                      min={0}
                      max={30000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="savings"
                      label="Savings & Investments"
                      value={expenses.savings}
                      onChange={(v) => setExpenses({...expenses, savings: v})}
                      min={0}
                      max={50000}
                      step={500}
                      prefix={currencySymbol}
                    />
                    <SliderField
                      id="otherExpenses"
                      label="Other (Insurance, Healthcare, Entertainment)"
                      value={expenses.insurance + expenses.healthcare + expenses.entertainment + expenses.other}
                      onChange={(v) => setExpenses({...expenses, other: v})}
                      min={0}
                      max={30000}
                      step={500}
                      prefix={currencySymbol}
                    />
                  </div>
                </CalculatorCard>
              </TabsContent>

              <TabsContent value="projection" className="mt-6">
                <CalculatorCard title="Projection Settings" icon={TrendingUp}>
                  <div className="space-y-5">
                    <SliderField
                      id="projectionYears"
                      label="Projection Period"
                      value={projectionYears}
                      onChange={setProjectionYears}
                      min={1}
                      max={20}
                      step={1}
                      suffix=" years"
                    />
                    <SliderField
                      id="incomeGrowth"
                      label="Expected Income Growth"
                      value={incomeGrowth}
                      onChange={setIncomeGrowth}
                      min={0}
                      max={15}
                      step={0.5}
                      suffix="%/year"
                    />
                    <SliderField
                      id="expenseGrowth"
                      label="Expected Expense Growth (Inflation)"
                      value={expenseGrowth}
                      onChange={setExpenseGrowth}
                      min={0}
                      max={15}
                      step={0.5}
                      suffix="%/year"
                    />
                  </div>
                </CalculatorCard>
              </TabsContent>
            </Tabs>

            {/* Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthAreaChart
                  data={calculations.projection}
                  dataKeys={[
                    { key: 'income', name: 'Annual Income', color: '#10b981' },
                    { key: 'expenses', name: 'Annual Expenses', color: '#ef4444' },
                  ]}
                  xAxisKey="year"
                  prefix={currencySymbol}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Results Sidebar */}
          <div className="space-y-6">
            <Card className={cn(
              "border-l-4",
              calculations.netCashFlow >= 0 ? "border-l-emerald-500" : "border-l-red-500"
            )}>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-500">Total Income</span>
                  <span className="font-semibold text-emerald-600">
                    {currencySymbol}{calculations.totalIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-500">Total Expenses</span>
                  <span className="font-semibold text-red-600">
                    {currencySymbol}{calculations.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Net Cash Flow</span>
                  <span className={cn(
                    "text-xl font-bold",
                    calculations.netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {calculations.netCashFlow >= 0 ? '+' : ''}{currencySymbol}{calculations.netCashFlow.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <ResultGrid columns={1}>
              <ResultDisplay
                label="Savings Rate"
                value={calculations.savingsRate.toFixed(1)}
                suffix="%"
                variant={calculations.savingsRate >= 20 ? "success" : "muted"}
                trend={calculations.savingsRate >= 20 ? "up" : "down"}
                trendValue={calculations.savingsRate >= 20 ? "Good" : "Low"}
              />
              <ResultDisplay
                label="Annual Net Cash Flow"
                value={calculations.annualNetCashFlow}
                prefix={currencySymbol}
                variant={calculations.annualNetCashFlow >= 0 ? "premium" : "muted"}
              />
            </ResultGrid>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-emerald-600" />
                  {projectionYears} Year Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-emerald-600">
                    {currencySymbol}{(calculations.projection[calculations.projection.length - 1]?.cumulativeSavings || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Projected Cumulative Savings
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calculations.monthlyBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {currencySymbol}{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
