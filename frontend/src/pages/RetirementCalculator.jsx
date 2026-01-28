import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, BreakdownPieChart, MultiLineChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { ComparisonMode } from '@/components/calculators/ComparisonMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, Calculator, GitCompare, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const retirementAgeOptions = [
  { value: '55', label: '55 Years' },
  { value: '60', label: '60 Years' },
  { value: '62', label: '62 Years' },
  { value: '65', label: '65 Years' },
  { value: '67', label: '67 Years' },
  { value: '70', label: '70 Years' },
];

const lifeExpectancyOptions = [
  { value: '80', label: '80 Years' },
  { value: '85', label: '85 Years' },
  { value: '90', label: '90 Years' },
  { value: '95', label: '95 Years' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  currentAge: 35,
  retirementAge: '65',
  lifeExpectancy: '90',
  currentSavings: 50000,
  monthlyContribution: 1000,
  currentIncome: 80000,
  desiredRetirementIncome: 60, // as percentage of current income
  expectedReturn: 10,
  inflationRate: 5, // SA inflation typically higher
  investmentFee: 2,
  governmentPension: 2000, // SA Old Age Grant (means tested)
  pensionBenefit: 0,
  otherRetirementIncome: 0,
});

export const RetirementCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateRetirement = useCallback((scenario) => {
    const {
      currentAge, retirementAge, lifeExpectancy, currentSavings,
      monthlyContribution, currentIncome, desiredRetirementIncome,
      expectedReturn, inflationRate, investmentFee,
      governmentPension, pensionBenefit, otherRetirementIncome
    } = scenario;
    
    const retAge = parseFloat(retirementAge);
    const lifeExp = parseFloat(lifeExpectancy);
    const yearsToRetirement = retAge - currentAge;
    const retirementYears = lifeExp - retAge;
    
    // Net return after fees
    const grossReturn = expectedReturn / 100;
    const feeRate = investmentFee / 100;
    const netReturn = grossReturn - feeRate;
    const inflation = inflationRate / 100;
    const realReturn = ((1 + netReturn) / (1 + inflation)) - 1;
    
    // Calculate future value of current savings
    const fvCurrentSavings = currentSavings * Math.pow(1 + netReturn, yearsToRetirement);
    
    // Calculate future value of monthly contributions
    const monthlyReturn = netReturn / 12;
    const totalContributionMonths = yearsToRetirement * 12;
    const fvContributions = monthlyContribution * ((Math.pow(1 + monthlyReturn, totalContributionMonths) - 1) / monthlyReturn);
    
    // Total retirement nest egg at retirement
    const totalNestEgg = fvCurrentSavings + fvContributions;
    
    // Calculate needed retirement income (inflation-adjusted)
    const annualIncomeNeeded = (currentIncome * (desiredRetirementIncome / 100)) * Math.pow(1 + inflation, yearsToRetirement);
    const monthlyIncomeNeeded = annualIncomeNeeded / 12;
    
    // Inflation-adjusted other income sources
    const inflatedGovernmentPension = governmentPension * Math.pow(1 + inflation, yearsToRetirement);
    const inflatedPension = pensionBenefit * Math.pow(1 + inflation, yearsToRetirement);
    const inflatedOther = otherRetirementIncome;
    const totalOtherIncome = (inflatedGovernmentPension + inflatedPension + inflatedOther) * 12;
    
    // Gap that needs to be covered by savings
    const annualGap = annualIncomeNeeded - totalOtherIncome;
    
    // How much do you need to cover the gap for retirement years
    // Using present value of annuity formula with real return
    const pvFactor = realReturn > 0 
      ? (1 - Math.pow(1 + realReturn, -retirementYears)) / realReturn 
      : retirementYears;
    const neededNestEgg = annualGap * pvFactor;
    
    // Retirement readiness
    const fundingRatio = (totalNestEgg / neededNestEgg) * 100;
    const shortfall = Math.max(0, neededNestEgg - totalNestEgg);
    const surplus = Math.max(0, totalNestEgg - neededNestEgg);
    
    // Calculate additional monthly savings needed to close gap
    const additionalMonthlyNeeded = shortfall > 0 
      ? (shortfall / ((Math.pow(1 + monthlyReturn, totalContributionMonths) - 1) / monthlyReturn))
      : 0;
    
    // Sustainable withdrawal rate
    const sustainableWithdrawal = totalNestEgg / pvFactor;
    const monthlyWithdrawal = sustainableWithdrawal / 12;
    
    // Years money will last at desired withdrawal
    let yearsMoneyLasts = 0;
    let balance = totalNestEgg;
    const monthlyWithdrawalNeeded = annualGap / 12;
    while (balance > 0 && yearsMoneyLasts < 100) {
      balance = balance * (1 + realReturn) - annualGap;
      yearsMoneyLasts++;
    }
    
    // Generate projection data
    const projectionData = [];
    let projectedBalance = currentSavings;
    for (let year = 0; year <= yearsToRetirement; year++) {
      projectionData.push({
        year: `Age ${currentAge + year}`,
        balance: projectedBalance,
        contributions: monthlyContribution * 12 * year,
        target: neededNestEgg * (year / yearsToRetirement),
      });
      projectedBalance = projectedBalance * (1 + netReturn) + monthlyContribution * 12;
    }
    
    // Retirement phase projection
    const retirementData = [];
    let retirementBalance = totalNestEgg;
    for (let year = 0; year <= Math.min(retirementYears, 40); year++) {
      retirementData.push({
        year: `Age ${retAge + year}`,
        balance: Math.max(0, retirementBalance),
        withdrawal: annualGap,
      });
      retirementBalance = retirementBalance * (1 + realReturn) - annualGap;
    }
    
    const incomeBreakdown = [
      { name: 'From Savings', value: sustainableWithdrawal, color: 'hsl(43, 74%, 49%)' },
      { name: 'Government Pension', value: inflatedGovernmentPension * 12, color: 'hsl(150, 45%, 35%)' },
      { name: 'Pension', value: inflatedPension * 12, color: 'hsl(215, 50%, 35%)' },
      { name: 'Other Income', value: inflatedOther * 12, color: 'hsl(180, 45%, 40%)' },
    ].filter(item => item.value > 0);

    return {
      totalNestEgg,
      neededNestEgg,
      fundingRatio: Math.min(fundingRatio, 200),
      shortfall,
      surplus,
      additionalMonthlyNeeded,
      yearsToRetirement,
      retirementYears,
      annualIncomeNeeded,
      monthlyIncomeNeeded,
      sustainableWithdrawal,
      monthlyWithdrawal,
      yearsMoneyLasts,
      totalOtherIncome,
      fvCurrentSavings,
      fvContributions,
      projectionData,
      retirementData,
      incomeBreakdown,
      isOnTrack: fundingRatio >= 100,
      finalValue: totalNestEgg,
    };
  }, []);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateRetirement(currentScenario), [currentScenario, calculateRetirement]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateRetirement(scenario)),
    [scenarios, calculateRetirement]
  );

  const updateScenario = (index, field, value) => {
    setScenarios(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const addScenario = () => {
    if (scenarios.length < 3) {
      setScenarios(prev => [...prev, defaultScenario()]);
    }
  };

  const removeScenario = (index) => {
    if (scenarios.length > 1) {
      setScenarios(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateScenario = (index) => {
    if (scenarios.length < 3) {
      setScenarios(prev => [...prev, { ...prev[index], id: generateId() }]);
    }
  };

  const printInputs = [
    { label: 'Current Age', value: `${currentScenario.currentAge} years` },
    { label: 'Retirement Age', value: `${currentScenario.retirementAge} years` },
    { label: 'Current Savings', value: formatCurrency(currentScenario.currentSavings) },
    { label: 'Monthly Contribution', value: formatCurrency(currentScenario.monthlyContribution) },
    { label: 'Current Income', value: formatCurrency(currentScenario.currentIncome) },
    { label: 'Expected Return', value: `${currentScenario.expectedReturn}%` },
    { label: 'Inflation Rate', value: `${currentScenario.inflationRate}%` },
    { label: 'Investment Fee', value: `${currentScenario.investmentFee}%` },
  ];

  const printResults = [
    { label: 'Projected Nest Egg', value: formatCurrency(results.totalNestEgg) },
    { label: 'Needed for Retirement', value: formatCurrency(results.neededNestEgg) },
    { label: 'Funding Ratio', value: `${results.fundingRatio.toFixed(1)}%` },
    { label: 'Monthly Income in Retirement', value: formatCurrency(results.monthlyWithdrawal + results.totalOtherIncome / 12) },
    { label: 'Years Money Will Last', value: `${results.yearsMoneyLasts} years` },
  ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <SliderField
          label="Current Age"
          id={`age-${scenario.id}`}
          value={scenario.currentAge}
          onChange={(val) => updateScenario(index, 'currentAge', val)}
          min={18}
          max={70}
          step={1}
          suffix=" years"
        />
        <SelectField
          label="Retirement Age"
          id={`retAge-${scenario.id}`}
          value={scenario.retirementAge}
          onChange={(val) => updateScenario(index, 'retirementAge', val)}
          options={retirementAgeOptions}
        />
        <InputField
          label="Current Savings"
          id={`savings-${scenario.id}`}
          value={scenario.currentSavings}
          onChange={(val) => updateScenario(index, 'currentSavings', val)}
          prefix={symbol}
          min={0}
          step={10000}
        />
        <InputField
          label="Monthly Contribution"
          id={`contribution-${scenario.id}`}
          value={scenario.monthlyContribution}
          onChange={(val) => updateScenario(index, 'monthlyContribution', val)}
          prefix={symbol}
          min={0}
          step={100}
        />
        
        <div className="pt-4 border-t border-border space-y-2">
          <ResultDisplay
            label="Projected Nest Egg"
            value={scenarioResults.totalNestEgg}
            prefix={symbol}
            size="lg"
            variant="premium"
          />
          <div className="flex items-center gap-2">
            {scenarioResults.isOnTrack ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                On Track
              </Badge>
            ) : (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Gap: {formatCurrency(scenarioResults.shortfall)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Retirement Calculator
          </h1>
          <p className="text-muted-foreground">
            Plan your path to a comfortable retirement with inflation & fee adjustments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={mode === 'single' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('single')}
              className="gap-2"
            >
              <Calculator className="h-4 w-4" />
              Single
            </Button>
            <Button
              variant={mode === 'compare' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('compare')}
              className="gap-2"
            >
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
          </div>
          {mode === 'single' && (
            <PrintReport
              title="Retirement Planning Analysis"
              calculatorType="retirement"
              inputs={printInputs}
              results={printResults}
            />
          )}
        </div>
      </div>

      {mode === 'compare' ? (
        <ComparisonMode
          scenarios={scenarios}
          onAddScenario={addScenario}
          onRemoveScenario={removeScenario}
          onDuplicateScenario={duplicateScenario}
          renderScenarioForm={renderScenarioForm}
          compareResults={compareResults}
          maxScenarios={3}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Cards */}
          <div className="lg:col-span-1 space-y-6">
            <CalculatorCard
              title="Personal Details"
              description="Your current situation"
              icon={Target}
            >
              <div className="space-y-5">
                <SliderField
                  label="Current Age"
                  id="currentAge"
                  value={currentScenario.currentAge}
                  onChange={(val) => updateScenario(0, 'currentAge', val)}
                  min={18}
                  max={70}
                  step={1}
                  suffix=" years"
                />
                
                <SelectField
                  label="Retirement Age"
                  id="retirementAge"
                  value={currentScenario.retirementAge}
                  onChange={(val) => updateScenario(0, 'retirementAge', val)}
                  options={retirementAgeOptions}
                />
                
                <SelectField
                  label="Life Expectancy"
                  id="lifeExpectancy"
                  value={currentScenario.lifeExpectancy}
                  onChange={(val) => updateScenario(0, 'lifeExpectancy', val)}
                  options={lifeExpectancyOptions}
                />
                
                <InputField
                  label="Current Annual Income"
                  id="currentIncome"
                  value={currentScenario.currentIncome}
                  onChange={(val) => updateScenario(0, 'currentIncome', val)}
                  prefix={symbol}
                  min={0}
                  step={5000}
                />
                
                <SliderField
                  label="Desired Retirement Income"
                  id="desiredRetirementIncome"
                  value={currentScenario.desiredRetirementIncome}
                  onChange={(val) => updateScenario(0, 'desiredRetirementIncome', val)}
                  min={40}
                  max={100}
                  step={5}
                  suffix="% of current"
                  tooltip="Most retirees need 70-80% of pre-retirement income"
                />
              </div>
            </CalculatorCard>
            
            <CalculatorCard
              title="Savings & Contributions"
              description="Your retirement investments"
              icon={PiggyBank}
            >
              <div className="space-y-5">
                <InputField
                  label="Current Retirement Savings"
                  id="currentSavings"
                  value={currentScenario.currentSavings}
                  onChange={(val) => updateScenario(0, 'currentSavings', val)}
                  prefix={symbol}
                  min={0}
                  step={10000}
                />
                
                <InputField
                  label="Monthly Contribution"
                  id="monthlyContribution"
                  value={currentScenario.monthlyContribution}
                  onChange={(val) => updateScenario(0, 'monthlyContribution', val)}
                  prefix={symbol}
                  min={0}
                  step={100}
                />
                
                <SliderField
                  label="Expected Annual Return"
                  id="expectedReturn"
                  value={currentScenario.expectedReturn}
                  onChange={(val) => updateScenario(0, 'expectedReturn', val)}
                  min={1}
                  max={50}
                  step={0.5}
                  suffix="%"
                />
                  step={0.5}
                  suffix="%"
                />
                
                <SliderField
                  label="Inflation Rate"
                  id="inflationRate"
                  value={currentScenario.inflationRate}
                  onChange={(val) => updateScenario(0, 'inflationRate', val)}
                  min={0}
                  max={10}
                  step={0.5}
                  suffix="%"
                />
                
                <SliderField
                  label="Investment Fee"
                  id="investmentFee"
                  value={currentScenario.investmentFee}
                  onChange={(val) => updateScenario(0, 'investmentFee', val)}
                  min={0}
                  max={3}
                  step={0.1}
                  suffix="%"
                  tooltip="Annual management and admin fees"
                />
              </div>
            </CalculatorCard>

            <CalculatorCard
              title="Other Income Sources"
              description="Expected retirement income"
              icon={TrendingUp}
            >
              <div className="space-y-5">
                <InputField
                  label="Government Pension (Monthly)"
                  id="governmentPension"
                  value={currentScenario.governmentPension}
                  onChange={(val) => updateScenario(0, 'governmentPension', val)}
                  tooltip="SA Old Age Grant or other government pension (means tested)"
                  prefix={symbol}
                  min={0}
                  step={100}
                  tooltip="Expected monthly benefit at retirement"
                />
                
                <InputField
                  label="Pension (Monthly)"
                  id="pensionBenefit"
                  value={currentScenario.pensionBenefit}
                  onChange={(val) => updateScenario(0, 'pensionBenefit', val)}
                  prefix={symbol}
                  min={0}
                  step={100}
                />
                
                <InputField
                  label="Other Income (Monthly)"
                  id="otherRetirementIncome"
                  value={currentScenario.otherRetirementIncome}
                  onChange={(val) => updateScenario(0, 'otherRetirementIncome', val)}
                  prefix={symbol}
                  min={0}
                  step={100}
                  tooltip="Rental income, part-time work, etc."
                />
              </div>
            </CalculatorCard>
          </div>

          {/* Results & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Results */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="overflow-hidden border-2 border-gold/20">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                    <ResultDisplay
                      label="Projected Nest Egg at Retirement"
                      value={results.totalNestEgg}
                      prefix={symbol}
                      size="xl"
                      variant="premium"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      In {results.yearsToRetirement} years at age {currentScenario.retirementAge}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`overflow-hidden border-2 ${results.isOnTrack ? 'border-success/20' : 'border-destructive/20'}`}>
                <CardContent className="p-0">
                  <div className={`p-6 ${results.isOnTrack ? 'bg-success/5' : 'bg-destructive/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {results.isOnTrack ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          On Track
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Gap Detected
                        </Badge>
                      )}
                    </div>
                    <ResultDisplay
                      label="Funding Ratio"
                      value={results.fundingRatio.toFixed(1)}
                      prefix=""
                      suffix="%"
                      size="xl"
                      variant={results.isOnTrack ? "success" : "muted"}
                    />
                    {!results.isOnTrack && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Need {formatCurrency(results.additionalMonthlyNeeded)}/month more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Results */}
            <ResultGrid columns={4}>
              <ResultDisplay
                label="Needed for Retirement"
                value={results.neededNestEgg}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Monthly Income (Ret.)"
                value={results.monthlyWithdrawal + results.totalOtherIncome / 12}
                prefix={symbol}
                variant="success"
              />
              <ResultDisplay
                label="Years Money Lasts"
                value={results.yearsMoneyLasts}
                prefix=""
                suffix=" yrs"
                variant={results.yearsMoneyLasts >= results.retirementYears ? "success" : "muted"}
              />
              <ResultDisplay
                label={results.shortfall > 0 ? "Shortfall" : "Surplus"}
                value={results.shortfall > 0 ? results.shortfall : results.surplus}
                prefix={symbol}
                variant={results.shortfall > 0 ? "muted" : "success"}
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="accumulation" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="accumulation">Savings Growth</TabsTrigger>
                <TabsTrigger value="retirement">Retirement Phase</TabsTrigger>
                <TabsTrigger value="income">Income Sources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="accumulation" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Retirement Savings Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MultiLineChart
                      data={results.projectionData}
                      dataKeys={[
                        { key: 'balance', name: 'Projected Balance', color: 'hsl(43, 74%, 49%)' },
                        { key: 'target', name: 'Target', color: 'hsl(150, 45%, 35%)' },
                      ]}
                      xAxisKey="year"
                      height={320}
                      prefix={symbol}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="retirement" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Retirement Balance Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GrowthAreaChart
                      data={results.retirementData}
                      dataKeys={[
                        { key: 'balance', name: 'Remaining Balance', color: 'hsl(43, 74%, 49%)' },
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
                    <CardTitle className="text-base font-medium">Retirement Income Sources (Annual)</CardTitle>
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
      )}
    </div>
  );
};
