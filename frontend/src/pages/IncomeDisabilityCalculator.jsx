import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, BreakdownPieChart, ComparisonBarChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { ComparisonMode } from '@/components/calculators/ComparisonMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Umbrella, Calculator, GitCompare, AlertTriangle, Clock, Wallet, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const waitingPeriodOptions = [
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
  { value: '90', label: '90 Days' },
  { value: '180', label: '180 Days' },
  { value: '365', label: '1 Year' },
];

const benefitPeriodOptions = [
  { value: '2', label: '2 Years' },
  { value: '5', label: '5 Years' },
  { value: '10', label: '10 Years' },
  { value: '65', label: 'To Age 65' },
];

const occupationClassOptions = [
  { value: '1', label: 'Class 1 - Office/Professional' },
  { value: '2', label: 'Class 2 - Light Manual Work' },
  { value: '3', label: 'Class 3 - Skilled Labor' },
  { value: '4', label: 'Class 4 - Heavy Labor' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  monthlyIncome: 0,
  age: 40,
  occupationClass: '1',
  waitingPeriod: '30',
  benefitPeriod: '65',
  coveragePercent: 75,
  monthlyExpenses: 0,
  emergencySavings: 0,
  existingDisabilityCoverage: 0,
  inflationProtection: true,
  residualBenefits: true,
});

export const IncomeDisabilityCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateDisabilityInsurance = useCallback((scenario) => {
    const {
      monthlyIncome, age, occupationClass, waitingPeriod, benefitPeriod,
      coveragePercent, monthlyExpenses, emergencySavings, existingDisabilityCoverage,
      inflationProtection, residualBenefits
    } = scenario;
    
    // Calculate monthly benefit needed
    const monthlyBenefitNeeded = monthlyIncome * (coveragePercent / 100);
    const monthlyGap = Math.max(0, monthlyExpenses - existingDisabilityCoverage);
    const recommendedBenefit = monthlyBenefitNeeded; // Allow up to 100% coverage
    
    // Calculate coverage gap during waiting period
    const waitingPeriodMonths = parseFloat(waitingPeriod) / 30;
    const waitingPeriodGap = monthlyExpenses * waitingPeriodMonths;
    const emergencyCoverage = Math.min(emergencySavings, waitingPeriodGap);
    const uncoveredWaitingPeriod = Math.max(0, waitingPeriodGap - emergencyCoverage);
    
    // Calculate benefit period in years
    const benefitYears = benefitPeriod === '65' ? (65 - age) : parseFloat(benefitPeriod);
    const totalPotentialBenefits = recommendedBenefit * 12 * benefitYears;
    
    // Estimate premium (simplified actuarial calculation)
    const baseRate = 0.02; // Base rate per $100 of benefit
    const ageMultiplier = 1 + ((age - 25) * 0.02);
    const occupationMultiplier = parseFloat(occupationClass) * 0.15 + 0.85;
    const waitingMultiplier = parseFloat(waitingPeriod) === 30 ? 1.3 : parseFloat(waitingPeriod) === 180 ? 0.7 : 1;
    const benefitMultiplier = benefitYears > 10 ? 1.4 : benefitYears > 5 ? 1.2 : 1;
    const riderMultiplier = (inflationProtection ? 1.1 : 1) * (residualBenefits ? 1.05 : 1);
    
    const monthlyPremium = (recommendedBenefit / 100) * baseRate * ageMultiplier * occupationMultiplier * waitingMultiplier * benefitMultiplier * riderMultiplier * 100;
    const annualPremium = monthlyPremium * 12;
    
    // Income gap analysis
    const monthlyIncomeGap = monthlyExpenses - recommendedBenefit;
    const coverageRatio = (recommendedBenefit / monthlyExpenses * 100).toFixed(1);
    
    // Scenario data for charts
    const scenarioData = [
      { name: 'Monthly Income', value: monthlyIncome },
      { name: 'Monthly Expenses', value: monthlyExpenses },
      { name: 'Benefit Amount', value: recommendedBenefit },
      { name: 'Coverage Gap', value: Math.max(0, monthlyIncomeGap) },
    ];

    const breakdownData = [
      { name: 'Covered by Insurance', value: recommendedBenefit, color: 'hsl(150, 45%, 35%)' },
      { name: 'Existing Coverage', value: existingDisabilityCoverage, color: 'hsl(43, 74%, 49%)' },
      { name: 'Income Gap', value: Math.max(0, monthlyExpenses - recommendedBenefit - existingDisabilityCoverage), color: 'hsl(0, 60%, 50%)' },
    ];

    // Yearly projection
    const yearlyData = [];
    for (let year = 0; year <= Math.min(benefitYears, 30); year++) {
      const inflationFactor = inflationProtection ? Math.pow(1.03, year) : 1;
      yearlyData.push({
        year: `Year ${year}`,
        annualBenefit: recommendedBenefit * 12 * inflationFactor,
        expenses: monthlyExpenses * 12 * Math.pow(1.03, year),
        gap: Math.max(0, (monthlyExpenses * 12 * Math.pow(1.03, year)) - (recommendedBenefit * 12 * inflationFactor)),
      });
    }

    return {
      recommendedBenefit,
      monthlyBenefitNeeded,
      monthlyIncomeGap,
      coverageRatio,
      waitingPeriodGap,
      emergencyCoverage,
      uncoveredWaitingPeriod,
      benefitYears,
      totalPotentialBenefits,
      monthlyPremium,
      annualPremium,
      scenarioData,
      breakdownData,
      yearlyData,
      finalValue: recommendedBenefit,
    };
  }, []);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateDisabilityInsurance(currentScenario), [currentScenario, calculateDisabilityInsurance]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateDisabilityInsurance(scenario)),
    [scenarios, calculateDisabilityInsurance]
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
    { label: 'Monthly Income', value: formatCurrency(currentScenario.monthlyIncome) },
    { label: 'Monthly Expenses', value: formatCurrency(currentScenario.monthlyExpenses) },
    { label: 'Age', value: `${currentScenario.age} years` },
    { label: 'Coverage Percentage', value: `${currentScenario.coveragePercent}%` },
    { label: 'Waiting Period', value: waitingPeriodOptions.find(o => o.value === currentScenario.waitingPeriod)?.label },
    { label: 'Benefit Period', value: benefitPeriodOptions.find(o => o.value === currentScenario.benefitPeriod)?.label },
  ];

  const printResults = [
    { label: 'Recommended Monthly Benefit', value: formatCurrency(results.recommendedBenefit) },
    { label: 'Coverage Ratio', value: `${results.coverageRatio}%` },
    { label: 'Estimated Monthly Premium', value: formatCurrency(results.monthlyPremium) },
    { label: 'Estimated Annual Premium', value: formatCurrency(results.annualPremium) },
    { label: 'Total Potential Benefits', value: formatCurrency(results.totalPotentialBenefits) },
  ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <InputField
          label="Monthly Income"
          id={`income-${scenario.id}`}
          value={scenario.monthlyIncome}
          onChange={(val) => updateScenario(index, 'monthlyIncome', val)}
          prefix={symbol}
          min={0}
          step={500}
        />
        <InputField
          label="Monthly Expenses"
          id={`expenses-${scenario.id}`}
          value={scenario.monthlyExpenses}
          onChange={(val) => updateScenario(index, 'monthlyExpenses', val)}
          prefix={symbol}
          min={0}
          step={500}
        />
        <SliderField
          label="Coverage Percentage"
          id={`coverage-${scenario.id}`}
          value={scenario.coveragePercent}
          onChange={(val) => updateScenario(index, 'coveragePercent', val)}
          min={50}
          max={100}
          step={5}
          suffix="%"
        />
        <SelectField
          label="Waiting Period"
          id={`waiting-${scenario.id}`}
          value={scenario.waitingPeriod}
          onChange={(val) => updateScenario(index, 'waitingPeriod', val)}
          options={waitingPeriodOptions}
        />
        
        <div className="pt-4 border-t border-border">
          <ResultDisplay
            label="Monthly Benefit"
            value={scenarioResults.recommendedBenefit}
            prefix={symbol}
            size="lg"
            variant="premium"
          />
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
            Income Disability Calculator
          </h1>
          <p className="text-muted-foreground">
            Protect your income with the right disability coverage
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
              title="Income Disability Analysis"
              calculatorType="income-disability"
              inputs={printInputs}
              results={printResults}
            />
          )}
        </div>
      </div>

      <Disclaimer />

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
          {/* Input Card */}
          <div className="lg:col-span-1 space-y-6">
            <CalculatorCard
              title="Income & Expenses"
              description="Your current financial situation"
              icon={Wallet}
            >
              <div className="space-y-5">
                <InputField
                  label="Monthly Gross Income"
                  id="monthlyIncome"
                  value={currentScenario.monthlyIncome}
                  onChange={(val) => updateScenario(0, 'monthlyIncome', val)}
                  prefix={symbol}
                  min={0}
                  step={500}
                />
                
                <InputField
                  label="Monthly Expenses"
                  id="monthlyExpenses"
                  value={currentScenario.monthlyExpenses}
                  onChange={(val) => updateScenario(0, 'monthlyExpenses', val)}
                  prefix={symbol}
                  min={0}
                  step={500}
                  tooltip="Essential monthly expenses you must cover"
                />
                
                <InputField
                  label="Emergency Savings"
                  id="emergencySavings"
                  value={currentScenario.emergencySavings}
                  onChange={(val) => updateScenario(0, 'emergencySavings', val)}
                  prefix={symbol}
                  min={0}
                  step={1000}
                  tooltip="Savings to cover waiting period"
                />
                
                <InputField
                  label="Existing Disability Coverage"
                  id="existingDisabilityCoverage"
                  value={currentScenario.existingDisabilityCoverage}
                  onChange={(val) => updateScenario(0, 'existingDisabilityCoverage', val)}
                  prefix={symbol}
                  min={0}
                  step={500}
                  tooltip="Employer-provided or existing coverage"
                />
                
                <SliderField
                  label="Your Age"
                  id="age"
                  value={currentScenario.age}
                  onChange={(val) => updateScenario(0, 'age', val)}
                  min={18}
                  max={64}
                  step={1}
                  suffix=" years"
                />
              </div>
            </CalculatorCard>
            
            <CalculatorCard
              title="Policy Options"
              description="Configure your coverage"
              icon={Umbrella}
            >
              <div className="space-y-5">
                <SliderField
                  label="Coverage Percentage"
                  id="coveragePercent"
                  value={currentScenario.coveragePercent}
                  onChange={(val) => updateScenario(0, 'coveragePercent', val)}
                  min={50}
                  max={100}
                  step={5}
                  suffix="%"
                  tooltip="Percentage of income to cover (75% recommended)"
                />
                
                <SelectField
                  label="Occupation Class"
                  id="occupationClass"
                  value={currentScenario.occupationClass}
                  onChange={(val) => updateScenario(0, 'occupationClass', val)}
                  options={occupationClassOptions}
                  tooltip="Lower risk occupations = lower premiums"
                />
                
                <SelectField
                  label="Waiting Period"
                  id="waitingPeriod"
                  value={currentScenario.waitingPeriod}
                  onChange={(val) => updateScenario(0, 'waitingPeriod', val)}
                  options={waitingPeriodOptions}
                  tooltip="Longer waiting = lower premiums"
                />
                
                <SelectField
                  label="Benefit Period"
                  id="benefitPeriod"
                  value={currentScenario.benefitPeriod}
                  onChange={(val) => updateScenario(0, 'benefitPeriod', val)}
                  options={benefitPeriodOptions}
                />
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Inflation Protection</label>
                    <div className="flex gap-2">
                      <Button
                        variant={currentScenario.inflationProtection ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => updateScenario(0, 'inflationProtection', true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={!currentScenario.inflationProtection ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => updateScenario(0, 'inflationProtection', false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Residual Benefits</label>
                    <div className="flex gap-2">
                      <Button
                        variant={currentScenario.residualBenefits ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => updateScenario(0, 'residualBenefits', true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={!currentScenario.residualBenefits ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => updateScenario(0, 'residualBenefits', false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CalculatorCard>
          </div>

          {/* Results & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Result */}
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                      <Umbrella className="h-3 w-3 mr-1" />
                      Recommended Monthly Benefit
                    </Badge>
                  </div>
                  <ResultDisplay
                    label="Monthly Disability Benefit"
                    value={results.recommendedBenefit}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {results.coverageRatio}% of your monthly expenses covered
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Waiting Period Warning */}
            {results.uncoveredWaitingPeriod > 0 && (
              <Card className="border-2 border-gold/30 bg-gold/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gold mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Waiting Period Gap</h4>
                      <p className="text-sm text-muted-foreground">
                        Your emergency savings ({formatCurrency(results.emergencyCoverage)}) will cover part of the waiting period.
                        You may need an additional {formatCurrency(results.uncoveredWaitingPeriod)} for the remaining gap.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Secondary Results */}
            <ResultGrid columns={4}>
              <ResultDisplay
                label="Monthly Premium (Est.)"
                value={results.monthlyPremium}
                prefix={symbol}
                variant="premium"
              />
              <ResultDisplay
                label="Annual Premium"
                value={results.annualPremium}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Benefit Years"
                value={results.benefitYears}
                prefix=""
                suffix=" yrs"
                variant="muted"
              />
              <ResultDisplay
                label="Total Potential Benefits"
                value={results.totalPotentialBenefits}
                prefix={symbol}
                variant="success"
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="coverage" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="coverage">Coverage Analysis</TabsTrigger>
                <TabsTrigger value="projection">Benefit Projection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="coverage" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Monthly Coverage Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BreakdownPieChart
                      data={results.breakdownData}
                      height={320}
                      prefix={symbol}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="projection" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Benefits vs Expenses Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GrowthAreaChart
                      data={results.yearlyData}
                      dataKeys={[
                        { key: 'annualBenefit', name: 'Annual Benefit', color: 'hsl(150, 45%, 35%)' },
                        { key: 'expenses', name: 'Annual Expenses', color: 'hsl(43, 74%, 49%)' },
                      ]}
                      xAxisKey="year"
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
