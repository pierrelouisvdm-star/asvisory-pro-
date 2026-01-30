import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { MultiLineChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, Calculator, TrendingDown, AlertTriangle, CheckCircle, 
  Percent, Calendar, PiggyBank, Info
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

// SA Living Annuity drawdown limits (SARS regulated)
const MIN_DRAWDOWN = 2.5;
const MAX_DRAWDOWN = 17.5;

const drawdownOptions = [
  { value: '2.5', label: '2.5% (Minimum)' },
  { value: '5', label: '5%' },
  { value: '7.5', label: '7.5%' },
  { value: '10', label: '10%' },
  { value: '12.5', label: '12.5%' },
  { value: '15', label: '15%' },
  { value: '17.5', label: '17.5% (Maximum)' },
];

const frequencyOptions = [
  { value: '12', label: 'Monthly' },
  { value: '4', label: 'Quarterly' },
  { value: '2', label: 'Semi-Annually' },
  { value: '1', label: 'Annually' },
];

export const LivingAnnuityCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [inputs, setInputs] = useState({
    capitalAmount: 2000000,
    drawdownRate: '5',
    paymentFrequency: '12',
    expectedReturn: 8,
    inflationRate: 5,
    investmentFee: 1.5,
    currentAge: 65,
    lifeExpectancy: 90,
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    const {
      capitalAmount, drawdownRate, paymentFrequency, expectedReturn,
      inflationRate, investmentFee, currentAge, lifeExpectancy
    } = inputs;
    
    const drawdown = parseFloat(drawdownRate) / 100;
    const grossReturn = expectedReturn / 100;
    const feeRate = investmentFee / 100;
    const netReturn = grossReturn - feeRate;
    const inflation = inflationRate / 100;
    const realReturn = ((1 + netReturn) / (1 + inflation)) - 1;
    const frequency = parseInt(paymentFrequency);
    const yearsInRetirement = lifeExpectancy - currentAge;
    
    // Annual income from drawdown
    const annualIncome = capitalAmount * drawdown;
    const monthlyIncome = annualIncome / 12;
    const paymentAmount = annualIncome / frequency;
    
    // Calculate how long the capital will last
    let balance = capitalAmount;
    let yearsLasting = 0;
    const projectionData = [];
    const maxYears = 50;
    
    // First year data point
    projectionData.push({
      year: `Age ${currentAge}`,
      balance: balance,
      income: annualIncome,
      realBalance: balance,
    });
    
    while (balance > 0 && yearsLasting < maxYears) {
      // Apply growth
      balance = balance * (1 + netReturn);
      // Deduct drawdown (based on original capital percentage - fixed amount)
      balance = balance - annualIncome;
      yearsLasting++;
      
      const realBalance = balance / Math.pow(1 + inflation, yearsLasting);
      
      projectionData.push({
        year: `Age ${currentAge + yearsLasting}`,
        balance: Math.max(0, balance),
        income: balance > 0 ? annualIncome : 0,
        realBalance: Math.max(0, realBalance),
      });
      
      if (balance <= 0) break;
    }
    
    // Sustainable drawdown rate calculation (4% rule approximation adjusted for SA)
    // Using the formula: sustainable rate = real return / (1 - (1+real return)^-years)
    const sustainableRate = yearsInRetirement > 0 
      ? (realReturn / (1 - Math.pow(1 + realReturn, -yearsInRetirement))) * 100
      : 4;
    
    // Income sustainability analysis
    const isDrawdownSustainable = yearsLasting >= yearsInRetirement;
    const shortfallYears = Math.max(0, yearsInRetirement - yearsLasting);
    
    // Tax calculation (simplified - living annuity income is taxable)
    // Using SA tax brackets for 65+ (2024/25)
    const taxFreeThreshold = 165600; // R165,600 for 65+
    const taxableIncome = Math.max(0, annualIncome - taxFreeThreshold);
    const estimatedTax = calculateSATax(annualIncome, currentAge);
    const afterTaxAnnualIncome = annualIncome - estimatedTax;
    const afterTaxMonthlyIncome = afterTaxAnnualIncome / 12;
    
    // Real (inflation-adjusted) income in future years
    const realIncomeYear5 = annualIncome / Math.pow(1 + inflation, 5);
    const realIncomeYear10 = annualIncome / Math.pow(1 + inflation, 10);
    const realIncomeYear20 = annualIncome / Math.pow(1 + inflation, 20);
    
    // Capital depletion breakdown
    const incomeBreakdown = [
      { name: 'Gross Income', value: annualIncome, color: 'hsl(150, 45%, 35%)' },
      { name: 'Estimated Tax', value: estimatedTax, color: 'hsl(0, 60%, 50%)' },
      { name: 'Net Income', value: afterTaxAnnualIncome, color: 'hsl(43, 74%, 49%)' },
    ];

    return {
      annualIncome,
      monthlyIncome,
      paymentAmount,
      yearsLasting,
      yearsInRetirement,
      isDrawdownSustainable,
      shortfallYears,
      sustainableRate: Math.max(MIN_DRAWDOWN, Math.min(MAX_DRAWDOWN, sustainableRate)),
      estimatedTax,
      afterTaxAnnualIncome,
      afterTaxMonthlyIncome,
      realIncomeYear5,
      realIncomeYear10,
      realIncomeYear20,
      projectionData,
      incomeBreakdown,
      effectiveTaxRate: (estimatedTax / annualIncome) * 100,
      capitalAtYear10: projectionData[10]?.balance || 0,
      capitalAtYear20: projectionData[20]?.balance || 0,
    };
  }, [inputs]);

  // SA Tax calculation for seniors (simplified 2024/25 rates)
  function calculateSATax(income, age) {
    // Tax rebates for 65+
    const primaryRebate = 17235;
    const secondaryRebate = age >= 65 ? 9444 : 0;
    const tertiaryRebate = age >= 75 ? 3145 : 0;
    const totalRebate = primaryRebate + secondaryRebate + tertiaryRebate;
    
    // Tax brackets (2024/25)
    let tax = 0;
    if (income <= 237100) {
      tax = income * 0.18;
    } else if (income <= 370500) {
      tax = 42678 + (income - 237100) * 0.26;
    } else if (income <= 512800) {
      tax = 77362 + (income - 370500) * 0.31;
    } else if (income <= 673000) {
      tax = 121475 + (income - 512800) * 0.36;
    } else if (income <= 857900) {
      tax = 179147 + (income - 673000) * 0.39;
    } else if (income <= 1817000) {
      tax = 251258 + (income - 857900) * 0.41;
    } else {
      tax = 644489 + (income - 1817000) * 0.45;
    }
    
    return Math.max(0, tax - totalRebate);
  }

  const printInputs = [
    { label: 'Capital Amount', value: formatCurrency(inputs.capitalAmount) },
    { label: 'Drawdown Rate', value: `${inputs.drawdownRate}%` },
    { label: 'Payment Frequency', value: frequencyOptions.find(o => o.value === inputs.paymentFrequency)?.label },
    { label: 'Expected Return', value: `${inputs.expectedReturn}%` },
    { label: 'Inflation Rate', value: `${inputs.inflationRate}%` },
    { label: 'Investment Fee', value: `${inputs.investmentFee}%` },
    { label: 'Current Age', value: `${inputs.currentAge} years` },
    { label: 'Life Expectancy', value: `${inputs.lifeExpectancy} years` },
  ];

  const printResults = [
    { label: 'Annual Income (Gross)', value: formatCurrency(results.annualIncome) },
    { label: 'Monthly Income (Gross)', value: formatCurrency(results.monthlyIncome) },
    { label: 'Estimated Annual Tax', value: formatCurrency(results.estimatedTax) },
    { label: 'Net Annual Income', value: formatCurrency(results.afterTaxAnnualIncome) },
    { label: 'Years Capital Will Last', value: `${results.yearsLasting} years` },
    { label: 'Sustainable Drawdown Rate', value: `${results.sustainableRate.toFixed(1)}%` },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="living-annuity-calculator">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Living Annuity Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate sustainable drawdown rates for your living annuity (SA regulations: 2.5% - 17.5%)
          </p>
        </div>
        <PrintReport
          title="Living Annuity Analysis"
          calculatorType="living-annuity"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <Disclaimer />

      {/* Info Banner */}
      <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-400 mb-1">South African Living Annuity Rules</p>
              <p className="text-slate-400">
                SARS allows drawdown rates between 2.5% and 17.5% of your capital per year. 
                Lower rates preserve capital longer but provide less income. Income is taxable 
                but seniors (65+) receive additional tax rebates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Annuity Details"
            description="Your living annuity capital"
            icon={Wallet}
          >
            <div className="space-y-5">
              <InputField
                label="Capital Amount"
                id="capitalAmount"
                value={inputs.capitalAmount}
                onChange={(val) => updateInput('capitalAmount', val)}
                prefix={symbol}
                min={100000}
                step={50000}
                tooltip="Total capital in your living annuity"
              />
              
              <SelectField
                label="Drawdown Rate"
                id="drawdownRate"
                value={inputs.drawdownRate}
                onChange={(val) => updateInput('drawdownRate', val)}
                options={drawdownOptions}
                tooltip="Annual percentage of capital to withdraw (2.5% - 17.5%)"
              />
              
              <SelectField
                label="Payment Frequency"
                id="paymentFrequency"
                value={inputs.paymentFrequency}
                onChange={(val) => updateInput('paymentFrequency', val)}
                options={frequencyOptions}
              />
            </div>
          </CalculatorCard>
          
          <CalculatorCard
            title="Growth & Costs"
            description="Investment assumptions"
            icon={TrendingDown}
          >
            <div className="space-y-5">
              <SliderField
                label="Expected Return"
                id="expectedReturn"
                value={inputs.expectedReturn}
                onChange={(val) => updateInput('expectedReturn', val)}
                min={0}
                max={15}
                step={0.5}
                suffix="%"
                tooltip="Expected annual investment return"
              />
              
              <SliderField
                label="Inflation Rate"
                id="inflationRate"
                value={inputs.inflationRate}
                onChange={(val) => updateInput('inflationRate', val)}
                min={0}
                max={12}
                step={0.5}
                suffix="%"
              />
              
              <SliderField
                label="Investment Fee"
                id="investmentFee"
                value={inputs.investmentFee}
                onChange={(val) => updateInput('investmentFee', val)}
                min={0}
                max={3}
                step={0.1}
                suffix="%"
                tooltip="Annual management and platform fees"
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Personal Details"
            description="For longevity calculation"
            icon={Calendar}
          >
            <div className="space-y-5">
              <SliderField
                label="Current Age"
                id="currentAge"
                value={inputs.currentAge}
                onChange={(val) => updateInput('currentAge', val)}
                min={55}
                max={85}
                step={1}
                suffix=" years"
              />
              
              <SliderField
                label="Life Expectancy"
                id="lifeExpectancy"
                value={inputs.lifeExpectancy}
                onChange={(val) => updateInput('lifeExpectancy', val)}
                min={inputs.currentAge + 5}
                max={105}
                step={1}
                suffix=" years"
                tooltip="Plan conservatively - consider family history"
              />
            </div>
          </CalculatorCard>
        </div>

        {/* Results & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden border-2 border-emerald-500/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 p-6">
                  <ResultDisplay
                    label="Monthly Income (Gross)"
                    value={results.monthlyIncome}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {formatCurrency(results.afterTaxMonthlyIncome)} after tax
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`overflow-hidden border-2 ${results.isDrawdownSustainable ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
              <CardContent className="p-0">
                <div className={`p-6 ${results.isDrawdownSustainable ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {results.isDrawdownSustainable ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sustainable
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Capital Risk
                      </Badge>
                    )}
                  </div>
                  <ResultDisplay
                    label="Years Capital Will Last"
                    value={results.yearsLasting}
                    prefix=""
                    suffix=" years"
                    size="xl"
                    variant={results.isDrawdownSustainable ? "success" : "muted"}
                  />
                  {!results.isDrawdownSustainable && (
                    <p className="text-xs text-amber-400 mt-2">
                      May run out {results.shortfallYears} years before life expectancy
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Results */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Annual Income (Gross)"
              value={results.annualIncome}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Estimated Tax"
              value={results.estimatedTax}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Effective Tax Rate"
              value={results.effectiveTaxRate.toFixed(1)}
              prefix=""
              suffix="%"
              variant="muted"
            />
            <ResultDisplay
              label="Sustainable Rate"
              value={results.sustainableRate.toFixed(1)}
              prefix=""
              suffix="%"
              variant="success"
              tooltip="Recommended drawdown rate for your situation"
            />
          </ResultGrid>

          {/* Inflation Impact */}
          <Card className="border-navy-700 bg-navy-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-400" />
                Inflation Impact on Purchasing Power
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Year 5</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(results.realIncomeYear5)}</p>
                  <p className="text-xs text-slate-500">real value</p>
                </div>
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Year 10</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(results.realIncomeYear10)}</p>
                  <p className="text-xs text-slate-500">real value</p>
                </div>
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Year 20</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(results.realIncomeYear20)}</p>
                  <p className="text-xs text-slate-500">real value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="projection" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="projection">Capital Projection</TabsTrigger>
              <TabsTrigger value="income">Income Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projection" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Capital Balance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiLineChart
                    data={results.projectionData.slice(0, 35)}
                    dataKeys={[
                      { key: 'balance', name: 'Nominal Balance', color: 'hsl(43, 74%, 49%)' },
                      { key: 'realBalance', name: 'Real Balance (Inflation Adjusted)', color: 'hsl(150, 45%, 35%)' },
                    ]}
                    xAxisKey="year"
                    height={320}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="income" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Annual Income Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.incomeBreakdown}
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

export default LivingAnnuityCalculator;
