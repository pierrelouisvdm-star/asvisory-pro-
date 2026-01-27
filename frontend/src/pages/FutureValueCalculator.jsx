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
import { TrendingUp, Calculator, GitCompare, BarChart3, TrendingDown, Percent } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

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
  rate: 25,
  years: 10,
  contribution: 500,
  contributionFrequency: '12',
  compounding: '12',
  inflationRate: 3,
  investmentFee: 1,
});

export const FutureValueCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateFutureValue = useCallback((scenario) => {
    const { principal, rate, years, contribution, contributionFrequency, compounding, inflationRate, investmentFee } = scenario;
    
    // Net rate after fees
    const grossRate = rate / 100;
    const feeRate = investmentFee / 100;
    const netRate = grossRate - feeRate;
    const inflation = inflationRate / 100;
    const n = parseFloat(compounding);
    const contributionsPerYear = parseFloat(contributionFrequency);
    
    // Future value calculations with net rate (after fees)
    const fvPrincipal = principal * Math.pow(1 + netRate / n, n * years);
    const periodicRate = netRate / contributionsPerYear;
    const totalPeriods = contributionsPerYear * years;
    const fvContributions = contribution * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
    
    const nominalFV = fvPrincipal + fvContributions;
    const totalContributed = principal + (contribution * contributionsPerYear * years);
    const totalInterest = nominalFV - totalContributed;
    
    // Calculate total fees paid
    const fvWithoutFees = principal * Math.pow(1 + grossRate / n, n * years) + 
      contribution * ((Math.pow(1 + grossRate / contributionsPerYear, totalPeriods) - 1) / (grossRate / contributionsPerYear));
    const totalFeesPaid = fvWithoutFees - nominalFV;
    
    // Real (inflation-adjusted) future value
    const realFV = nominalFV / Math.pow(1 + inflation, years);
    const purchasingPowerLoss = nominalFV - realFV;

    // Generate yearly data for chart
    const yearlyData = [];
    for (let year = 0; year <= years; year++) {
      const yearFvPrincipal = principal * Math.pow(1 + netRate / n, n * year);
      const yearPeriods = contributionsPerYear * year;
      const yearFvContributions = year === 0 ? 0 : contribution * ((Math.pow(1 + periodicRate, yearPeriods) - 1) / periodicRate);
      const yearNominal = yearFvPrincipal + yearFvContributions;
      const yearReal = yearNominal / Math.pow(1 + inflation, year);
      const yearContributed = principal + (contribution * contributionsPerYear * year);
      
      yearlyData.push({
        year: `Year ${year}`,
        nominal: yearNominal,
        real: yearReal,
        principal: yearContributed,
        interest: yearNominal - yearContributed,
      });
    }

    return {
      futureValue: nominalFV,
      realFutureValue: realFV,
      totalContributed,
      totalInterest,
      totalFeesPaid,
      purchasingPowerLoss,
      interestPercentage: ((totalInterest / totalContributed) * 100).toFixed(1),
      effectiveReturn: (((nominalFV / totalContributed) - 1) * 100 / years).toFixed(2),
      yearlyData,
      finalValue: nominalFV,
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
    { name: 'Fees Paid', value: results.totalFeesPaid, color: 'hsl(0, 60%, 50%)' },
  ];

  const printInputs = [
    { label: 'Initial Investment', value: formatCurrency(currentScenario.principal) },
    { label: 'Annual Interest Rate', value: `${currentScenario.rate}%` },
    { label: 'Investment Period', value: `${currentScenario.years} years` },
    { label: 'Regular Contribution', value: formatCurrency(currentScenario.contribution) },
    { label: 'Contribution Frequency', value: contributionFrequencyOptions.find(o => o.value === currentScenario.contributionFrequency)?.label },
    { label: 'Compounding Frequency', value: compoundingOptions.find(o => o.value === currentScenario.compounding)?.label },
    { label: 'Inflation Rate', value: `${currentScenario.inflationRate}%` },
    { label: 'Investment Fee', value: `${currentScenario.investmentFee}%` },
  ];

  const printResults = [
    { label: 'Nominal Future Value', value: formatCurrency(results.futureValue) },
    { label: 'Real Future Value (Inflation Adjusted)', value: formatCurrency(results.realFutureValue) },
    { label: 'Total Contributed', value: formatCurrency(results.totalContributed) },
    { label: 'Interest Earned', value: formatCurrency(results.totalInterest) },
    { label: 'Total Fees Paid', value: formatCurrency(results.totalFeesPaid) },
    { label: 'Purchasing Power Loss', value: formatCurrency(results.purchasingPowerLoss) },
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
          prefix={symbol}
          min={0}
          step={100}
        />
        <SliderField
          label="Inflation Rate"
          id={`inflation-${scenario.id}`}
          value={scenario.inflationRate}
          onChange={(val) => updateScenario(index, 'inflationRate', val)}
          min={0}
          max={15}
          step={0.1}
          suffix="%"
        />
        <SliderField
          label="Investment Fee"
          id={`fee-${scenario.id}`}
          value={scenario.investmentFee}
          onChange={(val) => updateScenario(index, 'investmentFee', val)}
          min={0}
          max={5}
          step={0.1}
          suffix="%"
        />
        
        <div className="pt-4 border-t border-border space-y-2">
          <ResultDisplay
            label="Nominal Future Value"
            value={scenarioResults.futureValue}
            prefix={symbol}
            size="lg"
            variant="premium"
          />
          <ResultDisplay
            label="Real Value (After Inflation)"
            value={scenarioResults.realFutureValue}
            prefix={symbol}
            size="default"
            variant="muted"
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
            Calculate future value with inflation & fee adjustments
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
                  prefix={symbol}
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
                  max={50}
                  step={0.5}
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
                  prefix={symbol}
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

                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Adjustment Factors
                  </h4>
                  
                  <SliderField
                    label="Inflation Rate"
                    id="inflationRate"
                    value={currentScenario.inflationRate}
                    onChange={(val) => updateScenario(0, 'inflationRate', val)}
                    min={0}
                    max={15}
                    step={0.1}
                    suffix="%"
                    tooltip="Expected annual inflation rate"
                  />
                  
                  <SliderField
                    label="Investment Fee (Annual)"
                    id="investmentFee"
                    value={currentScenario.investmentFee}
                    onChange={(val) => updateScenario(0, 'investmentFee', val)}
                    min={0}
                    max={5}
                    step={0.05}
                    suffix="%"
                    tooltip="Annual management/admin fees"
                  />
                </div>
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
                      label="Nominal Future Value"
                      value={results.futureValue}
                      prefix={symbol}
                      size="xl"
                      variant="premium"
                      trend="up"
                      trendValue={`+${results.interestPercentage}%`}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-2 border-forest/20">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-forest/10 to-gold/5 p-6">
                    <ResultDisplay
                      label="Real Value (After Inflation)"
                      value={results.realFutureValue}
                      prefix={symbol}
                      size="xl"
                      variant="success"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Today's purchasing power equivalent
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Results */}
            <ResultGrid columns={4}>
              <ResultDisplay
                label="Total Contributed"
                value={results.totalContributed}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Interest Earned"
                value={results.totalInterest}
                prefix={symbol}
                variant="success"
              />
              <ResultDisplay
                label="Total Fees Paid"
                value={results.totalFeesPaid}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Purchasing Power Loss"
                value={results.purchasingPowerLoss}
                prefix={symbol}
                variant="muted"
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="growth" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="growth" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Nominal vs Real
                </TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              </TabsList>
              
              <TabsContent value="growth" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Investment Growth (Nominal vs Inflation-Adjusted)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MultiLineChart
                      data={results.yearlyData}
                      dataKeys={[
                        { key: 'nominal', name: 'Nominal Value', color: 'hsl(43, 74%, 49%)' },
                        { key: 'real', name: 'Real Value (After Inflation)', color: 'hsl(150, 45%, 35%)' },
                        { key: 'principal', name: 'Contributions', color: 'hsl(215, 50%, 35%)' },
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
                    <CardTitle className="text-base font-medium">Value Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BreakdownPieChart
                      data={pieData}
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
