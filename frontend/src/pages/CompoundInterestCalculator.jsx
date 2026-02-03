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
import { Percent, Calculator, GitCompare, BarChart3, LineChart } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const compoundingOptions = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Semi-annually' },
  { value: '4', label: 'Quarterly' },
  { value: '12', label: 'Monthly' },
  { value: '52', label: 'Weekly' },
  { value: '365', label: 'Daily' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  principal: 25000,
  rate: 10,
  years: 15,
  contribution: 1000,
  contributionIncrease: 5,
  compounding: '12',
});

export const CompoundInterestCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateCompoundInterest = useCallback((scenario) => {
    const { principal, rate, years, compounding } = scenario;
    const r = rate / 100;
    const n = parseFloat(compounding);
    
    // Compound interest formula: A = P(1 + r/n)^(nt)
    const finalAmount = principal * Math.pow(1 + r / n, n * years);
    const totalInterest = finalAmount - principal;
    const effectiveRate = (Math.pow(1 + r / n, n) - 1) * 100;
    
    // Simple interest for comparison
    const simpleInterest = principal * r * years;
    const simpleTotal = principal + simpleInterest;
    const compoundBenefit = finalAmount - simpleTotal;

    // Generate yearly data
    const yearlyData = [];
    for (let year = 0; year <= years; year++) {
      const compound = principal * Math.pow(1 + r / n, n * year);
      const simple = principal + (principal * r * year);
      
      yearlyData.push({
        year: `Year ${year}`,
        compound,
        simple,
        difference: compound - simple,
      });
    }

    // Generate interest accumulation data
    const interestData = [];
    let previousValue = principal;
    for (let year = 1; year <= years; year++) {
      const currentValue = principal * Math.pow(1 + r / n, n * year);
      const yearlyInterest = currentValue - previousValue;
      interestData.push({
        year: `Year ${year}`,
        interest: yearlyInterest,
        cumulative: currentValue - principal,
      });
      previousValue = currentValue;
    }

    return {
      finalAmount,
      totalInterest,
      effectiveRate: effectiveRate.toFixed(2),
      simpleTotal,
      simpleInterest,
      compoundBenefit,
      yearlyData,
      interestData,
      finalValue: finalAmount,
    };
  }, []);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateCompoundInterest(currentScenario), [currentScenario, calculateCompoundInterest]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateCompoundInterest(scenario)),
    [scenarios, calculateCompoundInterest]
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

  const pieData = [
    { name: 'Principal', value: currentScenario.principal, color: 'hsl(215, 50%, 35%)' },
    { name: 'Interest Earned', value: results.totalInterest, color: 'hsl(43, 74%, 49%)' },
  ];

  const printInputs = [
    { label: 'Principal Amount', value: `$${currentScenario.principal.toLocaleString()}` },
    { label: 'Annual Interest Rate', value: `${currentScenario.rate}%` },
    { label: 'Investment Period', value: `${currentScenario.years} years` },
    { label: 'Compounding Frequency', value: compoundingOptions.find(o => o.value === currentScenario.compounding)?.label },
  ];

  const printResults = [
    { label: 'Final Amount', value: `$${results.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Total Interest Earned', value: `$${results.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Effective Annual Rate', value: `${results.effectiveRate}%` },
    { label: 'Compound vs Simple Benefit', value: `$${results.compoundBenefit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <InputField
          label="Principal Amount"
          id={`principal-${scenario.id}`}
          value={scenario.principal}
          onChange={(val) => updateScenario(index, 'principal', val)}
          prefix={symbol}
          min={0}
          step={1000}
        />
        <SliderField
          label="Annual Interest Rate"
          id={`rate-${scenario.id}`}
          value={scenario.rate}
          onChange={(val) => updateScenario(index, 'rate', val)}
          min={0}
          max={50}
          step={0.5}
          suffix="%"
        />
        <SliderField
          label="Time Period"
          id={`years-${scenario.id}`}
          value={scenario.years}
          onChange={(val) => updateScenario(index, 'years', val)}
          min={1}
          max={40}
          step={1}
          suffix=" years"
        />
        <SelectField
          label="Compounding"
          id={`compounding-${scenario.id}`}
          value={scenario.compounding}
          onChange={(val) => updateScenario(index, 'compounding', val)}
          options={compoundingOptions}
        />
        
        <div className="pt-4 border-t border-border">
          <ResultDisplay
            label="Final Amount"
            value={scenarioResults.finalAmount}
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
            Compound Interest Calculator
          </h1>
          <p className="text-muted-foreground">
            Understand the power of compound interest over time
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
              title="Compound Interest Analysis"
              calculatorType="compound-interest"
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
          <div className="lg:col-span-1">
            <CalculatorCard
              title="Investment Parameters"
              description="Configure your compound interest calculation"
              icon={Percent}
            >
              <div className="space-y-5">
                <InputField
                  label="Principal Amount"
                  id="principal"
                  value={currentScenario.principal}
                  onChange={(val) => updateScenario(0, 'principal', val)}
                  prefix={symbol}
                  min={0}
                  step={1000}
                  tooltip="The initial amount invested"
                />
                
                <SliderField
                  label="Annual Interest Rate"
                  id="rate"
                  value={currentScenario.rate}
                  onChange={(val) => updateScenario(0, 'rate', val)}
                  min={0}
                  max={50}
                  step={0.5}
                  suffix="%"
                  tooltip="The nominal annual interest rate"
                />
                
                <SliderField
                  label="Time Period"
                  id="years"
                  value={currentScenario.years}
                  onChange={(val) => updateScenario(0, 'years', val)}
                  min={1}
                  max={40}
                  step={1}
                  suffix=" years"
                />
                
                <SelectField
                  label="Compounding Frequency"
                  id="compounding"
                  value={currentScenario.compounding}
                  onChange={(val) => updateScenario(0, 'compounding', val)}
                  options={compoundingOptions}
                  tooltip="How often interest is compounded"
                />
              </div>
            </CalculatorCard>
          </div>

          {/* Results & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Result */}
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <ResultDisplay
                    label="Final Amount"
                    value={results.finalAmount}
                    size="xl"
                    variant="premium"
                    trend="up"
                    trendValue={`+${((results.totalInterest / currentScenario.principal) * 100).toFixed(1)}%`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Secondary Results */}
            <ResultGrid columns={4}>
              <ResultDisplay
                label="Total Interest"
                value={results.totalInterest}
                variant="success"
              />
              <ResultDisplay
                label="Effective Rate"
                value={results.effectiveRate}
                prefix=""
                suffix="%"
                variant="muted"
              />
              <ResultDisplay
                label="Simple Interest"
                value={results.simpleInterest}
                variant="muted"
              />
              <ResultDisplay
                label="Compound Benefit"
                value={results.compoundBenefit}
                variant="premium"
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="comparison" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  Compound vs Simple
                </TabsTrigger>
                <TabsTrigger value="growth" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Growth Chart
                </TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparison" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Compound vs Simple Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MultiLineChart
                      data={results.yearlyData}
                      dataKeys={[
                        { key: 'compound', name: 'Compound Interest', color: 'hsl(43, 74%, 49%)' },
                        { key: 'simple', name: 'Simple Interest', color: 'hsl(150, 45%, 35%)' },
                      ]}
                      xAxisKey="year"
                      height={320}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="growth" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Interest Growth Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GrowthAreaChart
                      data={results.yearlyData}
                      dataKeys={[
                        { key: 'compound', name: 'Total Value', color: 'hsl(43, 74%, 49%)' },
                      ]}
                      xAxisKey="year"
                      height={320}
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
                      data={pieData}
                      height={320}
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
