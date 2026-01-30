import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, ComparisonBarChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingDown, Plus, Trash2, Target, Zap, Snowflake } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultDebt = () => ({
  id: generateId(),
  name: 'Credit Card',
  balance: 25000,
  interestRate: 21,
  minimumPayment: 750,
});

export const DebtPayoffCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [debts, setDebts] = useState([
    { id: generateId(), name: 'Credit Card 1', balance: 25000, interestRate: 21, minimumPayment: 750 },
    { id: generateId(), name: 'Personal Loan', balance: 50000, interestRate: 15, minimumPayment: 1500 },
    { id: generateId(), name: 'Car Loan', balance: 150000, interestRate: 11, minimumPayment: 3500 },
  ]);
  
  const [extraPayment, setExtraPayment] = useState(2000);
  const [strategy, setStrategy] = useState('avalanche'); // 'avalanche' or 'snowball'

  const addDebt = () => {
    setDebts(prev => [...prev, defaultDebt()]);
  };

  const removeDebt = (id) => {
    if (debts.length > 1) {
      setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  const updateDebt = (id, field, value) => {
    setDebts(prev => prev.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const results = useMemo(() => {
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinimum = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const totalMonthlyPayment = totalMinimum + extraPayment;
    
    // Calculate weighted average interest rate
    const weightedRate = debts.reduce((sum, d) => sum + (d.balance * d.interestRate), 0) / totalBalance;

    // Sort debts based on strategy
    const sortedDebts = [...debts].sort((a, b) => {
      if (strategy === 'avalanche') {
        return b.interestRate - a.interestRate; // Highest interest first
      } else {
        return a.balance - b.balance; // Lowest balance first
      }
    });

    // Simulate payoff - Minimum payments only
    const simulatePayoff = (debtList, monthlyExtra) => {
      let workingDebts = debtList.map(d => ({ ...d, remaining: d.balance }));
      let month = 0;
      let totalInterestPaid = 0;
      let monthlyData = [];
      
      while (workingDebts.some(d => d.remaining > 0) && month < 360) {
        month++;
        let extraPool = monthlyExtra;
        let monthTotal = 0;
        
        // Apply minimum payments and calculate interest
        workingDebts = workingDebts.map(d => {
          if (d.remaining <= 0) return d;
          
          const monthlyRate = d.interestRate / 100 / 12;
          const interest = d.remaining * monthlyRate;
          totalInterestPaid += interest;
          
          let payment = Math.min(d.minimumPayment, d.remaining + interest);
          d.remaining = d.remaining + interest - payment;
          monthTotal += payment;
          
          return d;
        });
        
        // Apply extra payment to priority debt
        for (const d of workingDebts) {
          if (d.remaining > 0 && extraPool > 0) {
            const extraApplied = Math.min(extraPool, d.remaining);
            d.remaining -= extraApplied;
            extraPool -= extraApplied;
            monthTotal += extraApplied;
          }
        }
        
        monthlyData.push({
          month: `Month ${month}`,
          remaining: workingDebts.reduce((sum, d) => sum + Math.max(0, d.remaining), 0),
          paid: totalBalance - workingDebts.reduce((sum, d) => sum + Math.max(0, d.remaining), 0),
        });
      }
      
      return { months: month, totalInterest: totalInterestPaid, monthlyData };
    };

    // Calculate with strategy (extra payments)
    const withExtra = simulatePayoff(sortedDebts, extraPayment);
    
    // Calculate minimum only
    const minimumOnly = simulatePayoff(debts, 0);
    
    // Savings
    const interestSaved = minimumOnly.totalInterest - withExtra.totalInterest;
    const timeSaved = minimumOnly.months - withExtra.months;
    
    // Calculate payoff order
    const payoffOrder = sortedDebts.map((d, i) => ({
      name: d.name,
      balance: d.balance,
      rate: d.interestRate,
      priority: i + 1,
    }));

    // Comparison data
    const comparisonData = [
      { name: 'Time to Payoff', withExtra: withExtra.months, minimumOnly: minimumOnly.months },
      { name: 'Total Interest', withExtra: withExtra.totalInterest, minimumOnly: minimumOnly.totalInterest },
    ];

    return {
      totalBalance,
      totalMinimum,
      totalMonthlyPayment,
      weightedRate: weightedRate.toFixed(2),
      monthsToPayoff: withExtra.months,
      totalInterest: withExtra.totalInterest,
      minimumMonths: minimumOnly.months,
      minimumInterest: minimumOnly.totalInterest,
      interestSaved,
      timeSaved,
      payoffOrder,
      monthlyData: withExtra.monthlyData,
      comparisonData,
    };
  }, [debts, extraPayment, strategy]);

  const printInputs = [
    { label: 'Total Debt Balance', value: formatCurrency(results.totalBalance) },
    { label: 'Monthly Payment', value: formatCurrency(results.totalMonthlyPayment) },
    { label: 'Extra Payment', value: formatCurrency(extraPayment) },
    { label: 'Strategy', value: strategy === 'avalanche' ? 'Avalanche (Highest Interest)' : 'Snowball (Lowest Balance)' },
    { label: 'Number of Debts', value: debts.length.toString() },
  ];

  const printResults = [
    { label: 'Months to Debt-Free', value: `${results.monthsToPayoff} months` },
    { label: 'Total Interest Paid', value: formatCurrency(results.totalInterest) },
    { label: 'Interest Saved', value: formatCurrency(results.interestSaved) },
    { label: 'Time Saved', value: `${results.timeSaved} months` },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Debt Payoff Calculator
          </h1>
          <p className="text-muted-foreground">
            Compare Snowball vs Avalanche strategies to become debt-free faster
          </p>
        </div>
        <PrintReport
          title="Debt Payoff Plan"
          calculatorType="debt-payoff"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Strategy Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-gold" />
                Payoff Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={strategy === 'avalanche' ? 'premium' : 'outline'}
                  onClick={() => setStrategy('avalanche')}
                  className="flex-col h-auto py-4 gap-1"
                >
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold">Avalanche</span>
                  <span className="text-xs opacity-80">Highest rate first</span>
                </Button>
                <Button
                  variant={strategy === 'snowball' ? 'premium' : 'outline'}
                  onClick={() => setStrategy('snowball')}
                  className="flex-col h-auto py-4 gap-1"
                >
                  <Snowflake className="h-5 w-5" />
                  <span className="font-semibold">Snowball</span>
                  <span className="text-xs opacity-80">Lowest balance first</span>
                </Button>
              </div>
              
              <InputField
                label="Extra Monthly Payment"
                id="extraPayment"
                value={extraPayment}
                onChange={setExtraPayment}
                prefix={symbol}
                min={0}
                step={500}
                tooltip="Additional amount above minimums"
              />
            </CardContent>
          </Card>

          {/* Debts List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gold" />
                  Your Debts
                </CardTitle>
                <Button variant="outline-gold" size="sm" onClick={addDebt}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {debts.map((debt, index) => (
                <div key={debt.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{index + 1}</Badge>
                    {debts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeDebt(debt.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <InputField
                    label="Name"
                    id={`name-${debt.id}`}
                    type="text"
                    value={debt.name}
                    onChange={(val) => updateDebt(debt.id, 'name', val)}
                  />
                  <InputField
                    label="Balance"
                    id={`balance-${debt.id}`}
                    value={debt.balance}
                    onChange={(val) => updateDebt(debt.id, 'balance', val)}
                    prefix={symbol}
                    min={0}
                    step={1000}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Rate %"
                      id={`rate-${debt.id}`}
                      value={debt.interestRate}
                      onChange={(val) => updateDebt(debt.id, 'interestRate', val)}
                      suffix="%"
                      min={0}
                      max={50}
                      step={0.5}
                    />
                    <InputField
                      label="Min Payment"
                      id={`min-${debt.id}`}
                      value={debt.minimumPayment}
                      onChange={(val) => updateDebt(debt.id, 'minimumPayment', val)}
                      prefix={symbol}
                      min={0}
                      step={100}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <ResultDisplay
                    label="Debt-Free In"
                    value={results.monthsToPayoff}
                    prefix=""
                    suffix=" months"
                    size="xl"
                    variant="premium"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {(results.monthsToPayoff / 12).toFixed(1)} years
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-success/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-success/10 to-gold/5 p-6">
                  <ResultDisplay
                    label="Interest Saved"
                    value={results.interestSaved}
                    prefix={symbol}
                    size="xl"
                    variant="success"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    vs minimum payments only
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Total Debt"
              value={results.totalBalance}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Monthly Payment"
              value={results.totalMonthlyPayment}
              prefix={symbol}
              variant="premium"
            />
            <ResultDisplay
              label="Total Interest"
              value={results.totalInterest}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Time Saved"
              value={results.timeSaved}
              prefix=""
              suffix=" mo"
              variant="success"
            />
          </ResultGrid>

          {/* Payoff Order */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-gold" />
                Recommended Payoff Order ({strategy === 'avalanche' ? 'Avalanche' : 'Snowball'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.payoffOrder.map((debt, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'outline'} className={index === 0 ? 'bg-gold text-primary' : ''}>
                        {debt.priority}
                      </Badge>
                      <div>
                        <p className="font-medium">{debt.name}</p>
                        <p className="text-sm text-muted-foreground">{debt.rate}% APR</p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(debt.balance)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card className="border-2 border-forest/20">
            <CardHeader>
              <CardTitle className="text-base font-medium">With Extra Payments vs Minimum Only</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-gold/10 border border-gold/20">
                  <p className="text-sm text-muted-foreground mb-1">With {formatCurrency(extraPayment)}/mo Extra</p>
                  <p className="text-2xl font-bold text-gold">{results.monthsToPayoff} months</p>
                  <p className="text-sm text-muted-foreground">Interest: {formatCurrency(results.totalInterest)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">Minimum Payments Only</p>
                  <p className="text-2xl font-bold">{results.minimumMonths} months</p>
                  <p className="text-sm text-muted-foreground">Interest: {formatCurrency(results.minimumInterest)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payoff Chart */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList>
              <TabsTrigger value="timeline">Payoff Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Debt Balance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <GrowthAreaChart
                    data={results.monthlyData.filter((_, i) => i % 3 === 0)} // Show every 3rd month
                    dataKeys={[
                      { key: 'remaining', name: 'Remaining Balance', color: 'hsl(0, 60%, 50%)' },
                      { key: 'paid', name: 'Amount Paid', color: 'hsl(150, 45%, 35%)' },
                    ]}
                    xAxisKey="month"
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
