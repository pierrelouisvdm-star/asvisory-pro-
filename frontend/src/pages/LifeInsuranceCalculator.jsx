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
import { Badge } from '@/components/ui/badge';
import { Shield, Calculator, GitCompare, Users, Heart, Baby, Info, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const coverageMultiplierOptions = [
  { value: '5', label: '5x Annual Income' },
  { value: '10', label: '10x Annual Income' },
  { value: '15', label: '15x Annual Income' },
  { value: '20', label: '20x Annual Income' },
  { value: 'custom', label: 'Custom Amount' },
];

const policyTermOptions = [
  { value: '10', label: '10 Years' },
  { value: '15', label: '15 Years' },
  { value: '20', label: '20 Years' },
  { value: '25', label: '25 Years' },
  { value: '30', label: '30 Years' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  annualIncome: 360000, // R30,000 per month
  coverageMultiplier: '10',
  customCoverage: 750000,
  age: 35,
  smoker: false,
  healthRating: 'good', // excellent, good, fair
  policyTerm: '20',
  mortgageBalance: 250000,
  otherDebts: 25000,
  childrenEducationFund: 100000,
  emergencyFund: 50000,
  existingLifeInsurance: 100000,
  dependents: 2,
  yearsUntilRetirement: 30,
  spouseIncome: 50000,
});

export const LifeInsuranceCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateLifeInsurance = useCallback((scenario) => {
    const {
      annualIncome, coverageMultiplier, customCoverage, age, smoker, healthRating,
      policyTerm, mortgageBalance, otherDebts, childrenEducationFund, emergencyFund,
      existingLifeInsurance, dependents, yearsUntilRetirement, spouseIncome
    } = scenario;
    
    // Calculate income replacement need
    const incomeMultiplier = coverageMultiplier === 'custom' ? 1 : parseFloat(coverageMultiplier);
    const incomeReplacementNeed = coverageMultiplier === 'custom' 
      ? customCoverage 
      : annualIncome * incomeMultiplier;
    
    // Calculate DIME Method
    const debtCoverage = mortgageBalance + otherDebts;
    const incomeCoverage = (annualIncome - spouseIncome) * Math.min(yearsUntilRetirement, 20);
    const mortgageCoverage = mortgageBalance;
    const educationCoverage = childrenEducationFund * dependents;
    
    const dimeTotal = debtCoverage + incomeCoverage + educationCoverage + emergencyFund;
    
    // Recommended coverage: 10-15x annual income if dependants exist
    // Use 12.5x as the middle ground (average of 10-15x)
    const recommendedMultiplier = dependents > 0 ? 12.5 : 10;
    const incomeBasedRecommendation = annualIncome * recommendedMultiplier;
    
    // Needs-based calculation
    const totalNeeds = debtCoverage + incomeCoverage + educationCoverage + emergencyFund;
    const coverageGap = Math.max(0, totalNeeds - existingLifeInsurance);
    
    // Use the higher of: user-selected coverage, DIME method, or 10-15x income recommendation
    const recommendedCoverage = Math.max(incomeReplacementNeed, dimeTotal, incomeBasedRecommendation);
    
    // Recommendation text based on dependants
    const recommendationNote = dependents > 0 
      ? `With ${dependents} dependant${dependents > 1 ? 's' : ''}, we recommend 10-15x annual income (${formatCurrency(annualIncome * 10)} - ${formatCurrency(annualIncome * 15)})`
      : 'Consider 10x annual income as a baseline';
    
    // Estimate premium (simplified - actual would need actuarial tables)
    const baseRate = 0.0012; // Base rate per $1000
    const ageMultiplier = 1 + ((age - 25) * 0.03);
    const smokerMultiplier = smoker ? 2.0 : 1.0;
    const healthMultiplier = healthRating === 'excellent' ? 0.85 : healthRating === 'fair' ? 1.3 : 1.0;
    const termMultiplier = 1 + ((parseFloat(policyTerm) - 10) * 0.015);
    
    const monthlyPremium = (recommendedCoverage / 1000) * baseRate * ageMultiplier * smokerMultiplier * healthMultiplier * termMultiplier * 1000 / 12;
    const annualPremium = monthlyPremium * 12;
    const totalPremiums = annualPremium * parseFloat(policyTerm);
    
    // Coverage breakdown data
    const breakdownData = [
      { name: 'Debt Coverage', value: debtCoverage, color: 'hsl(0, 60%, 50%)' },
      { name: 'Income Replacement', value: incomeCoverage, color: 'hsl(43, 74%, 49%)' },
      { name: 'Education Fund', value: educationCoverage, color: 'hsl(150, 45%, 35%)' },
      { name: 'Emergency Fund', value: emergencyFund, color: 'hsl(215, 50%, 35%)' },
    ];

    // Yearly projection
    const yearlyData = [];
    for (let year = 0; year <= parseFloat(policyTerm); year++) {
      yearlyData.push({
        year: `Year ${year}`,
        coverage: recommendedCoverage,
        premiumsPaid: annualPremium * year,
        remainingTerm: parseFloat(policyTerm) - year,
      });
    }

    return {
      recommendedCoverage,
      incomeReplacementNeed,
      incomeBasedRecommendation,
      recommendationNote,
      dimeTotal,
      debtCoverage,
      incomeCoverage,
      educationCoverage,
      coverageGap,
      existingCoverage: existingLifeInsurance,
      monthlyPremium,
      annualPremium,
      totalPremiums,
      breakdownData,
      yearlyData,
      finalValue: recommendedCoverage,
      dependents,
    };
  }, [formatCurrency]);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateLifeInsurance(currentScenario), [currentScenario, calculateLifeInsurance]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateLifeInsurance(scenario)),
    [scenarios, calculateLifeInsurance]
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
    { label: 'Annual Income', value: formatCurrency(currentScenario.annualIncome) },
    { label: 'Age', value: `${currentScenario.age} years` },
    { label: 'Dependents', value: currentScenario.dependents.toString() },
    { label: 'Mortgage Balance', value: formatCurrency(currentScenario.mortgageBalance) },
    { label: 'Other Debts', value: formatCurrency(currentScenario.otherDebts) },
    { label: 'Existing Life Insurance', value: formatCurrency(currentScenario.existingLifeInsurance) },
    { label: 'Policy Term', value: `${currentScenario.policyTerm} years` },
  ];

  const printResults = [
    { label: 'Recommended Coverage', value: formatCurrency(results.recommendedCoverage) },
    { label: 'Coverage Gap', value: formatCurrency(results.coverageGap) },
    { label: 'Estimated Monthly Premium', value: formatCurrency(results.monthlyPremium) },
    { label: 'Estimated Annual Premium', value: formatCurrency(results.annualPremium) },
    { label: 'Total Premiums (Policy Term)', value: formatCurrency(results.totalPremiums) },
  ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <InputField
          label="Annual Income"
          id={`income-${scenario.id}`}
          value={scenario.annualIncome}
          onChange={(val) => updateScenario(index, 'annualIncome', val)}
          prefix={symbol}
          min={0}
          step={5000}
        />
        <SliderField
          label="Age"
          id={`age-${scenario.id}`}
          value={scenario.age}
          onChange={(val) => updateScenario(index, 'age', val)}
          min={18}
          max={70}
          step={1}
          suffix=" years"
        />
        <SliderField
          label="Dependents"
          id={`dependents-${scenario.id}`}
          value={scenario.dependents}
          onChange={(val) => updateScenario(index, 'dependents', val)}
          min={0}
          max={10}
          step={1}
          suffix=""
        />
        <InputField
          label="Mortgage Balance"
          id={`mortgage-${scenario.id}`}
          value={scenario.mortgageBalance}
          onChange={(val) => updateScenario(index, 'mortgageBalance', val)}
          prefix={symbol}
          min={0}
          step={10000}
        />
        
        <div className="pt-4 border-t border-border">
          <ResultDisplay
            label="Recommended Coverage"
            value={scenarioResults.recommendedCoverage}
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
            Life Insurance Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate the right coverage to protect your family's future
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
              title="Life Insurance Needs Analysis"
              calculatorType="life-insurance"
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
              title="Personal Details"
              description="Your income and family situation"
              icon={Users}
            >
              <div className="space-y-5">
                <InputField
                  label="Annual Income"
                  id="annualIncome"
                  value={currentScenario.annualIncome}
                  onChange={(val) => updateScenario(0, 'annualIncome', val)}
                  prefix={symbol}
                  min={0}
                  step={5000}
                />
                
                <InputField
                  label="Spouse/Partner Income"
                  id="spouseIncome"
                  value={currentScenario.spouseIncome}
                  onChange={(val) => updateScenario(0, 'spouseIncome', val)}
                  prefix={symbol}
                  min={0}
                  step={5000}
                />
                
                <SliderField
                  label="Your Age"
                  id="age"
                  value={currentScenario.age}
                  onChange={(val) => updateScenario(0, 'age', val)}
                  min={18}
                  max={70}
                  step={1}
                  suffix=" years"
                />
                
                <SliderField
                  label="Number of Dependents"
                  id="dependents"
                  value={currentScenario.dependents}
                  onChange={(val) => updateScenario(0, 'dependents', val)}
                  min={0}
                  max={10}
                  step={1}
                  suffix=""
                />
                
                <SliderField
                  label="Years Until Retirement"
                  id="yearsUntilRetirement"
                  value={currentScenario.yearsUntilRetirement}
                  onChange={(val) => updateScenario(0, 'yearsUntilRetirement', val)}
                  min={1}
                  max={45}
                  step={1}
                  suffix=" years"
                />
                
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Smoker</label>
                  <div className="flex gap-2">
                    <Button
                      variant={!currentScenario.smoker ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => updateScenario(0, 'smoker', false)}
                    >
                      No
                    </Button>
                    <Button
                      variant={currentScenario.smoker ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => updateScenario(0, 'smoker', true)}
                    >
                      Yes
                    </Button>
                  </div>
                </div>
                
                <SelectField
                  label="Health Rating"
                  id="healthRating"
                  value={currentScenario.healthRating}
                  onChange={(val) => updateScenario(0, 'healthRating', val)}
                  options={[
                    { value: 'excellent', label: 'Excellent' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                  ]}
                />
              </div>
            </CalculatorCard>
            
            <CalculatorCard
              title="Financial Obligations"
              description="Debts and future expenses"
              icon={Heart}
            >
              <div className="space-y-5">
                <InputField
                  label="Mortgage Balance"
                  id="mortgageBalance"
                  value={currentScenario.mortgageBalance}
                  onChange={(val) => updateScenario(0, 'mortgageBalance', val)}
                  prefix={symbol}
                  min={0}
                  step={10000}
                />
                
                <InputField
                  label="Other Debts"
                  id="otherDebts"
                  value={currentScenario.otherDebts}
                  onChange={(val) => updateScenario(0, 'otherDebts', val)}
                  prefix={symbol}
                  min={0}
                  step={5000}
                />
                
                <InputField
                  label="Education Fund per Child"
                  id="childrenEducationFund"
                  value={currentScenario.childrenEducationFund}
                  onChange={(val) => updateScenario(0, 'childrenEducationFund', val)}
                  prefix={symbol}
                  min={0}
                  step={10000}
                  tooltip="Amount needed for each child's education"
                />
                
                <InputField
                  label="Emergency Fund"
                  id="emergencyFund"
                  value={currentScenario.emergencyFund}
                  onChange={(val) => updateScenario(0, 'emergencyFund', val)}
                  prefix={symbol}
                  min={0}
                  step={5000}
                />
                
                <InputField
                  label="Existing Life Insurance"
                  id="existingLifeInsurance"
                  value={currentScenario.existingLifeInsurance}
                  onChange={(val) => updateScenario(0, 'existingLifeInsurance', val)}
                  prefix={symbol}
                  min={0}
                  step={25000}
                />
                
                <SelectField
                  label="Policy Term"
                  id="policyTerm"
                  value={currentScenario.policyTerm}
                  onChange={(val) => updateScenario(0, 'policyTerm', val)}
                  options={policyTermOptions}
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
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                      <Shield className="h-3 w-3 mr-1" />
                      Recommended Coverage
                    </Badge>
                  </div>
                  <ResultDisplay
                    label="Total Coverage Needed"
                    value={results.recommendedCoverage}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                  {results.dependents > 0 && (
                    <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Info className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-emerald-400">
                        {results.recommendationNote}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coverage Gap Alert */}
            {results.coverageGap > 0 && (
              <Card className="border-2 border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Coverage Gap Detected</h4>
                      <p className="text-sm text-muted-foreground">
                        You have {formatCurrency(results.existingCoverage)} in existing coverage. 
                        You need an additional {formatCurrency(results.coverageGap)} to fully protect your family.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Secondary Results */}
            <ResultGrid columns={3}>
              <ResultDisplay
                label="Monthly Premium (Est.)"
                value={results.monthlyPremium}
                prefix={symbol}
                variant="premium"
              />
              <ResultDisplay
                label="Annual Premium (Est.)"
                value={results.annualPremium}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Total Premiums"
                value={results.totalPremiums}
                prefix={symbol}
                variant="muted"
              />
            </ResultGrid>

            {/* Coverage Breakdown */}
            <ResultGrid columns={4}>
              <ResultDisplay
                label="Debt Coverage"
                value={results.debtCoverage}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Income Replacement"
                value={results.incomeCoverage}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Education Fund"
                value={results.educationCoverage}
                prefix={symbol}
                variant="muted"
              />
              <ResultDisplay
                label="Coverage Gap"
                value={results.coverageGap}
                prefix={symbol}
                variant={results.coverageGap > 0 ? "premium" : "success"}
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="breakdown">Coverage Breakdown</TabsTrigger>
                <TabsTrigger value="dime">DIME Method</TabsTrigger>
              </TabsList>
              
              <TabsContent value="breakdown" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Coverage Needs Breakdown</CardTitle>
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
              
              <TabsContent value="dime" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Info className="h-4 w-4 text-gold" />
                      DIME Method Explanation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-sm font-semibold text-foreground">D - Debt</p>
                        <p className="text-2xl font-bold text-gold">{formatCurrency(results.debtCoverage)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Mortgage + Other Debts</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-sm font-semibold text-foreground">I - Income</p>
                        <p className="text-2xl font-bold text-gold">{formatCurrency(results.incomeCoverage)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Income replacement (up to 20 years)</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-sm font-semibold text-foreground">M - Mortgage</p>
                        <p className="text-2xl font-bold text-gold">{formatCurrency(currentScenario.mortgageBalance)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Pay off mortgage</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-sm font-semibold text-foreground">E - Education</p>
                        <p className="text-2xl font-bold text-gold">{formatCurrency(results.educationCoverage)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Children's education fund</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gold/10 border border-gold/20">
                      <p className="text-sm font-semibold text-foreground">Total DIME Calculation</p>
                      <p className="text-3xl font-bold text-gold">{formatCurrency(results.dimeTotal)}</p>
                    </div>
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
