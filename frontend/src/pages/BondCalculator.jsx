import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, MultiLineChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { ComparisonMode } from '@/components/calculators/ComparisonMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calculator, GitCompare, BarChart3, LineChart, Wallet, Info, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

// SA Prime Rate (as of 2024)
const SA_PRIME_RATE = 11.75;

const loanTermOptions = [
  { value: '10', label: '10 years' },
  { value: '15', label: '15 years' },
  { value: '20', label: '20 years (Standard)' },
  { value: '25', label: '25 years' },
  { value: '30', label: '30 years' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  propertyPrice: 1500000,
  deposit: 150000,
  interestRate: SA_PRIME_RATE, // Prime rate
  loanTerm: '20',
  extraMonthlyPayment: 0,
});

export const BondCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateBond = useCallback((scenario) => {
    const { propertyPrice, deposit, interestRate, loanTerm, extraMonthlyPayment } = scenario;
    
    const loanAmount = propertyPrice - deposit;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = parseInt(loanTerm) * 12;
    
    // Monthly payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    // Calculate total with extra payments
    const totalMonthlyPayment = monthlyPayment + extraMonthlyPayment;
    
    // Amortization schedule
    let balance = loanAmount;
    let totalInterest = 0;
    let totalPaid = 0;
    let monthsToPayoff = 0;
    const amortizationData = [];
    const yearlyData = [];
    
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    
    for (let month = 1; month <= totalMonths && balance > 0; month++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = totalMonthlyPayment - interestPayment;
      
      // Handle final payment
      if (principalPayment > balance) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      totalPaid += principalPayment + interestPayment;
      monthsToPayoff = month;
      
      yearlyInterest += interestPayment;
      yearlyPrincipal += principalPayment;
      
      // Store yearly data
      if (month % 12 === 0 || balance <= 0) {
        const year = Math.ceil(month / 12);
        yearlyData.push({
          year: `Year ${year}`,
          balance: Math.max(0, balance),
          interest: yearlyInterest,
          principal: yearlyPrincipal,
          totalPaid: totalPaid,
        });
        yearlyInterest = 0;
        yearlyPrincipal = 0;
      }
      
      if (balance <= 0) break;
    }
    
    // Calculate savings from extra payments
    const standardTotalInterest = monthlyPayment * totalMonths - loanAmount;
    const interestSaved = standardTotalInterest - totalInterest;
    const monthsSaved = totalMonths - monthsToPayoff;
    const yearsSaved = Math.floor(monthsSaved / 12);
    const remainingMonthsSaved = monthsSaved % 12;
    
    // Loan to Value ratio
    const ltv = (loanAmount / propertyPrice) * 100;
    
    // Transfer costs estimate (SA specific)
    const transferDuty = calculateTransferDuty(propertyPrice);
    const conveyancingFees = Math.min(propertyPrice * 0.015, 50000) + 5000;
    const bondRegistrationCost = loanAmount * 0.01 + 5000;
    const totalClosingCosts = transferDuty + conveyancingFees + bondRegistrationCost;
    
    // Breakdown for pie chart
    const costBreakdown = [
      { name: 'Principal', value: loanAmount, color: 'hsl(150, 45%, 35%)' },
      { name: 'Total Interest', value: totalInterest, color: 'hsl(0, 60%, 50%)' },
    ];

    return {
      loanAmount,
      monthlyPayment,
      totalMonthlyPayment,
      totalInterest,
      totalPaid: loanAmount + totalInterest,
      monthsToPayoff,
      yearsToPayoff: Math.ceil(monthsToPayoff / 12),
      interestSaved,
      monthsSaved,
      yearsSaved,
      remainingMonthsSaved,
      ltv,
      transferDuty,
      conveyancingFees,
      bondRegistrationCost,
      totalClosingCosts,
      yearlyData,
      costBreakdown,
      interestToLoanRatio: (totalInterest / loanAmount) * 100,
    };
  }, []);

  // SA Transfer Duty calculation (2024 rates)
  function calculateTransferDuty(value) {
    if (value <= 1100000) return 0;
    if (value <= 1512500) return (value - 1100000) * 0.03;
    if (value <= 2117500) return 12375 + (value - 1512500) * 0.06;
    if (value <= 2722500) return 48675 + (value - 2117500) * 0.08;
    if (value <= 12100000) return 97075 + (value - 2722500) * 0.11;
    return 1128600 + (value - 12100000) * 0.13;
  }

  const results = useMemo(() => 
    scenarios.map(scenario => calculateBond(scenario)),
    [scenarios, calculateBond]
  );

  const currentScenario = scenarios[0];
  const currentResults = results[0];

  const updateScenario = (id, field, value) => {
    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addScenario = () => {
    if (scenarios.length < 3) {
      setScenarios(prev => [...prev, defaultScenario()]);
    }
  };

  const removeScenario = (id) => {
    if (scenarios.length > 1) {
      setScenarios(prev => prev.filter(s => s.id !== id));
    }
  };

  const printInputs = [
    { label: 'Property Price', value: formatCurrency(currentScenario.propertyPrice) },
    { label: 'Deposit', value: formatCurrency(currentScenario.deposit) },
    { label: 'Interest Rate', value: `${currentScenario.interestRate}%` },
    { label: 'Loan Term', value: `${currentScenario.loanTerm} years` },
    { label: 'Extra Monthly Payment', value: formatCurrency(currentScenario.extraMonthlyPayment) },
  ];

  const printResults = [
    { label: 'Loan Amount', value: formatCurrency(currentResults.loanAmount) },
    { label: 'Monthly Payment', value: formatCurrency(currentResults.monthlyPayment) },
    { label: 'Total Interest', value: formatCurrency(currentResults.totalInterest) },
    { label: 'Total Cost', value: formatCurrency(currentResults.totalPaid) },
    { label: 'Interest Saved', value: formatCurrency(currentResults.interestSaved) },
  ];

  const renderScenarioInputs = (scenario, index) => (
    <div className="space-y-4">
      <InputField
        label="Property Price"
        id={`price-${scenario.id}`}
        value={scenario.propertyPrice}
        onChange={(val) => updateScenario(scenario.id, 'propertyPrice', val)}
        prefix={symbol}
        min={100000}
        step={50000}
        tooltip="Purchase price of the property"
      />
      
      <InputField
        label="Deposit"
        id={`deposit-${scenario.id}`}
        value={scenario.deposit}
        onChange={(val) => updateScenario(scenario.id, 'deposit', val)}
        prefix={symbol}
        min={0}
        step={10000}
        tooltip="Your upfront deposit (10-20% recommended)"
      />

      <SliderField
        label="Interest Rate"
        id={`rate-${scenario.id}`}
        value={scenario.interestRate}
        onChange={(val) => updateScenario(scenario.id, 'interestRate', val)}
        min={7}
        max={18}
        step={0.25}
        suffix="%"
        tooltip={`SA Prime Rate: ${SA_PRIME_RATE}%. Banks typically offer Prime or Prime +/- margin`}
      />
      
      <SelectField
        label="Loan Term"
        id={`term-${scenario.id}`}
        value={scenario.loanTerm}
        onChange={(val) => updateScenario(scenario.id, 'loanTerm', val)}
        options={loanTermOptions}
      />

      <InputField
        label="Extra Monthly Payment"
        id={`extra-${scenario.id}`}
        value={scenario.extraMonthlyPayment}
        onChange={(val) => updateScenario(scenario.id, 'extraMonthlyPayment', val)}
        prefix={symbol}
        min={0}
        step={500}
        tooltip="Additional payment to reduce loan term and interest"
      />
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="bond-calculator">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Home Loan (Bond) Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate your monthly bond repayments using SA prime rate ({SA_PRIME_RATE}%)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ComparisonMode 
            mode={mode} 
            onModeChange={setMode}
            scenarioCount={scenarios.length}
          />
          <PrintReport
            title="Home Loan Analysis"
            calculatorType="bond"
            inputs={printInputs}
            results={printResults}
          />
        </div>
      </div>

      {/* Prime Rate Info */}
      <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-400 mb-1">SA Prime Lending Rate: {SA_PRIME_RATE}%</p>
              <p className="text-slate-400">
                Most home loans are priced at Prime rate. First-time buyers with good credit may qualify for 
                Prime minus 0.5% to Prime minus 1%. Your rate depends on your credit score, deposit size, and 
                loan-to-value ratio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          {mode === 'single' ? (
            <CalculatorCard
              title="Loan Details"
              description="Enter your home loan parameters"
              icon={Building2}
            >
              {renderScenarioInputs(currentScenario, 0)}
            </CalculatorCard>
          ) : (
            scenarios.map((scenario, index) => (
              <CalculatorCard
                key={scenario.id}
                title={`Scenario ${index + 1}`}
                description={index === 0 ? "Base scenario" : "Comparison"}
                icon={Building2}
                onRemove={scenarios.length > 1 ? () => removeScenario(scenario.id) : undefined}
              >
                {renderScenarioInputs(scenario, index)}
              </CalculatorCard>
            ))
          )}
          
          {mode === 'compare' && scenarios.length < 3 && (
            <Button onClick={addScenario} variant="outline" className="w-full gap-2">
              <GitCompare className="h-4 w-4" />
              Add Scenario
            </Button>
          )}

          {/* LTV Warning */}
          {currentResults.ltv > 90 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-400">High Loan-to-Value: {currentResults.ltv.toFixed(0)}%</p>
                    <p className="text-slate-400">
                      Consider a larger deposit to get better interest rates and avoid mortgage insurance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden border-2 border-emerald-500/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 p-6">
                  <ResultDisplay
                    label="Monthly Payment"
                    value={currentResults.totalMonthlyPayment}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                  {currentScenario.extraMonthlyPayment > 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      Includes {symbol}{currentScenario.extraMonthlyPayment.toLocaleString()} extra payment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-navy-700 bg-navy-900/50">
              <CardContent className="p-6">
                <ResultDisplay
                  label="Loan Amount"
                  value={currentResults.loanAmount}
                  prefix={symbol}
                  size="lg"
                  variant="muted"
                />
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    LTV: {currentResults.ltv.toFixed(0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Total Interest"
              value={currentResults.totalInterest}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Total Cost"
              value={currentResults.totalPaid}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Interest Ratio"
              value={currentResults.interestToLoanRatio.toFixed(0)}
              prefix=""
              suffix="%"
              variant="muted"
              tooltip="Interest as % of loan amount"
            />
            <ResultDisplay
              label="Years to Pay Off"
              value={currentResults.yearsToPayoff}
              prefix=""
              suffix=" years"
              variant={currentResults.interestSaved > 0 ? "success" : "muted"}
            />
          </ResultGrid>

          {/* Savings from Extra Payments */}
          {currentResults.interestSaved > 0 && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4">
                <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Savings from Extra Payments
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Interest Saved</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(currentResults.interestSaved)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Time Saved</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {currentResults.yearsSaved > 0 && `${currentResults.yearsSaved}y `}
                      {currentResults.remainingMonthsSaved}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Costs */}
          <Card className="border-navy-700 bg-navy-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-400" />
                Estimated Transfer & Registration Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Transfer Duty</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(currentResults.transferDuty)}</p>
                </div>
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Conveyancing</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(currentResults.conveyancingFees)}</p>
                </div>
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Bond Registration</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(currentResults.bondRegistrationCost)}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 mb-1">Total Costs</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatCurrency(currentResults.totalClosingCosts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="amortization" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="amortization" className="gap-2">
                <LineChart className="h-4 w-4" />
                Amortization
              </TabsTrigger>
              <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="amortization" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Loan Balance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiLineChart
                    data={currentResults.yearlyData}
                    dataKeys={[
                      { key: 'balance', name: 'Remaining Balance', color: 'hsl(0, 60%, 50%)' },
                      { key: 'totalPaid', name: 'Total Paid', color: 'hsl(150, 45%, 35%)' },
                    ]}
                    xAxisKey="year"
                    height={320}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="breakdown" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Principal vs Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={currentResults.costBreakdown}
                    height={320}
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

export default BondCalculator;
