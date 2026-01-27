import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { ComparisonMode } from '@/components/calculators/ComparisonMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, GitCompare, BarChart3 } from 'lucide-react';

const compoundingOptions = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Semi-annually' },
  { value: '4', label: 'Quarterly' },
  { value: '12', label: 'Monthly' },
  { value: '365', label: 'Daily' },
];

const contributionFrequencyOptions = [
  { value: '12', label: 'Monthly' },
  { value: '4', label: 'Quarterly' },
  { value: '2', label: 'Semi-annually' },
  { value: '1', label: 'Annually' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  principal: 10000,
  rate: 7,
  years: 10,
  contribution: 500,
  contributionFrequency: '12',
  compounding: '12',
});

export const FutureValueCalculator = () => {
  const [mode, setMode] = useState('single'); // 'single' or 'compare'
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateFutureValue = useCallback((scenario) => {
    const { principal, rate, years, contribution, contributionFrequency, compounding } = scenario;
    const r = rate / 100;
    const n = parseFloat(compounding);
    const contributionsPerYear = parseFloat(contributionFrequency);
    
    // Future value of principal
    const fvPrincipal = principal * Math.pow(1 + r / n, n * years);
    
    // Future value of contributions (annuity)
    const periodicRate = r / contributionsPerYear;
    const totalPeriods = contributionsPerYear * years;
    const fvContributions = contribution * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
    
    const totalFV = fvPrincipal + fvContributions;
    const totalContributed = principal + (contribution * contributionsPerYear * years);
    const totalInterest = totalFV - totalContributed;

    // Generate yearly data for chart
    const yearlyData = [];
    for (let year = 0; year <= years; year++) {
      const yearFvPrincipal = principal * Math.pow(1 + r / n, n * year);
      const yearPeriods = contributionsPerYear * year;
      const yearFvContributions = year === 0 ? 0 : contribution * ((Math.pow(1 + periodicRate, yearPeriods) - 1) / periodicRate);
      const yearTotal = yearFvPrincipal + yearFvContributions;
      const yearContributed = principal + (contribution * contributionsPerYear * year);
      
      yearlyData.push({
        year: `Year ${year}`,
        total: yearTotal,
        principal: yearContributed,
        interest: yearTotal - yearContributed,
      });
    }

    return {
      futureValue: totalFV,
      totalContributed,
      totalInterest,
      interestPercentage: ((totalInterest / totalContributed) * 100).toFixed(1),
      yearlyData,
      finalValue: totalFV,
    };
  }, []);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateFutureValue(currentScenario), [currentScenario, calculateFutureValue]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateFutureValue(scenario)),
    [scenarios, calculateFutureValue]
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
    { name: 'Contributions', value: results.totalContributed - currentScenario.principal, color: 'hsl(150, 45%, 35%)' },
    { name: 'Interest Earned', value: results.totalInterest, color: 'hsl(43, 74%, 49%)' },
  ];

  const printInputs = [
    { label: 'Initial Investment', value: `$${currentScenario.principal.toLocaleString()}` },
    { label: 'Annual Interest Rate', value: `${currentScenario.rate}%` },
    { label: 'Investment Period', value: `${currentScenario.years} years` },
    { label: 'Regular Contribution', value: `$${currentScenario.contribution.toLocaleString()}` },
    { label: 'Contribution Frequency', value: contributionFrequencyOptions.find(o => o.value === currentScenario.contributionFrequency)?.label },
    { label: 'Compounding Frequency', value: compoundingOptions.find(o => o.value === currentScenario.compounding)?.label },
  ];

  const printResults = [
    { label: 'Future Value', value: `$${results.futureValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Total Contributed', value: `$${results.totalContributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Interest Earned', value: `$${results.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Return on Investment', value: `${results.interestPercentage}%` },
  ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <InputField
          label="Initial Investment"
          id={`principal-${scenario.id}`}
          value={scenario.principal}
          onChange={(val) => updateScenario(index, 'principal', val)}
          prefix="$"
          min={0}
          step={1000}
        />
        <SliderField
          label="Annual Interest Rate"
          id={`rate-${scenario.id}`}
          value={scenario.rate}
          onChange={(val) => updateScenario(index, 'rate', val)}
          min={0}
          max={20}
          step={0.1}
          suffix="%"
        />
        <SliderField
          label="Investment Period"
          id={`years-${scenario.id}`}
          value={scenario.years}
          onChange={(val) => updateScenario(index, 'years', val)}
          min={1}
          max={40}
          step={1}
          suffix=" years"
        />
        <InputField
          label="Regular Contribution"
          id={`contribution-${scenario.id}`}
          value={scenario.contribution}
          onChange={(val) => updateScenario(index, 'contribution', val)}
          prefix="$"
          min={0}
          step={100}
        />
        
        {/* Compact Result */}
        <div className="pt-4 border-t border-border">
          <ResultDisplay
            label="Future Value"
            value={scenarioResults.futureValue}
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
            Future Value Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate the future value of investments with regular contributions
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
              title="Future Value Analysis"
              calculatorType="future-value"
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
          {/* Input Card */}
          <div className="lg:col-span-1">
            <CalculatorCard
              title="Investment Details"
              description="Enter your investment parameters"
              icon={TrendingUp}
            >
              <div className="space-y-5">
                <InputField
                  label="Initial Investment"
                  id="principal"
                  value={currentScenario.principal}
                  onChange={(val) => updateScenario(0, 'principal', val)}
                  prefix="$"
                  min={0}
                  step={1000}
                  tooltip="The starting amount of your investment"
                />
                
                <SliderField
                  label="Annual Interest Rate"
                  id="rate"
                  value={currentScenario.rate}
                  onChange={(val) => updateScenario(0, 'rate', val)}
                  min={0}
                  max={20}
                  step={0.1}
                  suffix="%"
                  tooltip="Expected annual return on investment"
                />
                
                <SliderField
                  label="Investment Period"
                  id="years"
                  value={currentScenario.years}
                  onChange={(val) => updateScenario(0, 'years', val)}
                  min={1}
                  max={40}
                  step={1}
                  suffix=" years"
                />
                
                <InputField
                  label="Regular Contribution"
                  id="contribution"
                  value={currentScenario.contribution}
                  onChange={(val) => updateScenario(0, 'contribution', val)}
                  prefix="$"
                  min={0}
                  step={100}
                  tooltip="Amount added to your investment regularly"
                />
                
                <SelectField
                  label="Contribution Frequency"
                  id="contributionFrequency"
                  value={currentScenario.contributionFrequency}
                  onChange={(val) => updateScenario(0, 'contributionFrequency', val)}
                  options={contributionFrequencyOptions}
                />
                
                <SelectField
                  label="Compounding Frequency"
                  id="compounding"
                  value={currentScenario.compounding}
                  onChange={(val) => updateScenario(0, 'compounding', val)}
                  options={compoundingOptions}
                  tooltip="How often interest is calculated and added"
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
                    label="Future Value"
                    value={results.futureValue}
                    size="xl"
                    variant="premium"
                    trend="up"
                    trendValue={`+${results.interestPercentage}%`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Secondary Results */}
            <ResultGrid columns={3}>
              <ResultDisplay
                label="Total Contributed"
                value={results.totalContributed}
                variant="muted"
              />
              <ResultDisplay
                label="Interest Earned"
                value={results.totalInterest}
                variant="success"
              />
              <ResultDisplay
                label="Return on Investment"
                value={results.interestPercentage}
                prefix=""
                suffix="%"
                variant="muted"
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="growth" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="growth" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Growth Over Time
                </TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              </TabsList>
              
              <TabsContent value="growth" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Investment Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GrowthAreaChart
                      data={results.yearlyData}
                      dataKeys={[
                        { key: 'total', name: 'Total Value', color: 'hsl(43, 74%, 49%)' },
                        { key: 'principal', name: 'Contributions', color: 'hsl(150, 45%, 35%)' },
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
                    <CardTitle className="text-base font-medium">Value Breakdown</CardTitle>
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
