import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Wallet, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const jobSecurityOptions = [
  { value: 'very_stable', label: 'Very Stable (Government/Tenured)' },
  { value: 'stable', label: 'Stable (Corporate Employee)' },
  { value: 'moderate', label: 'Moderate (Private Sector)' },
  { value: 'variable', label: 'Variable (Freelance/Commission)' },
  { value: 'unstable', label: 'Unstable (Contract/Seasonal)' },
];

const getRecommendedMonths = (jobSecurity, dependents, hasSpouseIncome) => {
  const baseMonths = {
    very_stable: 3,
    stable: 4,
    moderate: 6,
    variable: 9,
    unstable: 12,
  };
  
  let months = baseMonths[jobSecurity] || 6;
  
  // Add months for dependents
  months += Math.min(dependents, 4);
  
  // Reduce if spouse has income
  if (hasSpouseIncome) {
    months = Math.max(3, months - 2);
  }
  
  return months;
};

export const EmergencyFundCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [inputs, setInputs] = useState({
    monthlyIncome: 50000,
    monthlyExpenses: 35000,
    currentSavings: 50000,
    jobSecurity: 'moderate',
    dependents: 2,
    hasSpouseIncome: true,
    spouseIncome: 30000,
    hasHealthInsurance: true,
    hasDisabilityInsurance: false,
    monthlySavingsCapacity: 5000,
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    const {
      monthlyIncome, monthlyExpenses, currentSavings, jobSecurity,
      dependents, hasSpouseIncome, spouseIncome, hasHealthInsurance,
      hasDisabilityInsurance, monthlySavingsCapacity
    } = inputs;

    // Calculate recommended months of expenses
    const recommendedMonths = getRecommendedMonths(jobSecurity, dependents, hasSpouseIncome);
    
    // Essential expenses (typically 70-80% of total expenses)
    const essentialExpenses = monthlyExpenses * 0.75;
    
    // Target amounts
    const minimumFund = essentialExpenses * 3; // Bare minimum
    const targetFund = monthlyExpenses * recommendedMonths;
    const idealFund = monthlyExpenses * (recommendedMonths + 3); // Extra buffer
    
    // Current status
    const fundingRatio = (currentSavings / targetFund) * 100;
    const shortfall = Math.max(0, targetFund - currentSavings);
    const surplus = Math.max(0, currentSavings - targetFund);
    const monthsCovered = currentSavings / monthlyExpenses;
    
    // Time to reach goal
    const monthsToTarget = shortfall > 0 && monthlySavingsCapacity > 0
      ? Math.ceil(shortfall / monthlySavingsCapacity)
      : 0;
    
    // Risk assessment
    let riskLevel = 'low';
    if (fundingRatio < 50) riskLevel = 'high';
    else if (fundingRatio < 100) riskLevel = 'medium';
    
    // Insurance adjustments
    let adjustedTarget = targetFund;
    if (!hasHealthInsurance) adjustedTarget += monthlyExpenses * 2;
    if (!hasDisabilityInsurance) adjustedTarget += monthlyExpenses * 3;

    // Savings projection
    const projectionData = [];
    let projectedSavings = currentSavings;
    for (let month = 0; month <= Math.max(monthsToTarget, 24); month++) {
      projectionData.push({
        month: `Month ${month}`,
        savings: projectedSavings,
        target: targetFund,
        minimum: minimumFund,
      });
      projectedSavings += monthlySavingsCapacity;
    }

    // Fund allocation suggestion
    const allocationData = [
      { name: 'High-Yield Savings', value: targetFund * 0.5, color: 'hsl(150, 45%, 35%)' },
      { name: 'Money Market', value: targetFund * 0.3, color: 'hsl(43, 74%, 49%)' },
      { name: 'Short-term Deposits', value: targetFund * 0.2, color: 'hsl(215, 50%, 35%)' },
    ];

    return {
      recommendedMonths,
      minimumFund,
      targetFund,
      idealFund,
      adjustedTarget,
      currentSavings,
      fundingRatio: Math.min(fundingRatio, 200),
      shortfall,
      surplus,
      monthsCovered: monthsCovered.toFixed(1),
      monthsToTarget,
      riskLevel,
      essentialExpenses,
      projectionData,
      allocationData,
      isOnTrack: fundingRatio >= 100,
    };
  }, [inputs]);

  const printInputs = [
    { label: 'Monthly Income', value: formatCurrency(inputs.monthlyIncome) },
    { label: 'Monthly Expenses', value: formatCurrency(inputs.monthlyExpenses) },
    { label: 'Current Savings', value: formatCurrency(inputs.currentSavings) },
    { label: 'Job Security', value: jobSecurityOptions.find(o => o.value === inputs.jobSecurity)?.label },
    { label: 'Dependents', value: inputs.dependents.toString() },
  ];

  const printResults = [
    { label: 'Target Emergency Fund', value: formatCurrency(results.targetFund) },
    { label: 'Current Funding Ratio', value: `${results.fundingRatio.toFixed(1)}%` },
    { label: 'Months of Expenses Covered', value: results.monthsCovered },
    { label: 'Shortfall/Surplus', value: results.shortfall > 0 ? `-${formatCurrency(results.shortfall)}` : `+${formatCurrency(results.surplus)}` },
    { label: 'Months to Reach Target', value: results.monthsToTarget > 0 ? `${results.monthsToTarget} months` : 'Goal reached!' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Emergency Fund Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate how much you need for financial security
          </p>
        </div>
        <PrintReport
          title="Emergency Fund Analysis"
          calculatorType="emergency-fund"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Income & Expenses"
            description="Your monthly cash flow"
            icon={Wallet}
          >
            <div className="space-y-5">
              <InputField
                label="Monthly Income"
                id="monthlyIncome"
                value={inputs.monthlyIncome}
                onChange={(val) => updateInput('monthlyIncome', val)}
                prefix={symbol}
                min={0}
                step={5000}
              />
              
              <InputField
                label="Monthly Expenses"
                id="monthlyExpenses"
                value={inputs.monthlyExpenses}
                onChange={(val) => updateInput('monthlyExpenses', val)}
                prefix={symbol}
                min={0}
                step={5000}
              />
              
              <InputField
                label="Current Emergency Savings"
                id="currentSavings"
                value={inputs.currentSavings}
                onChange={(val) => updateInput('currentSavings', val)}
                prefix={symbol}
                min={0}
                step={10000}
              />
              
              <InputField
                label="Monthly Savings Capacity"
                id="monthlySavingsCapacity"
                value={inputs.monthlySavingsCapacity}
                onChange={(val) => updateInput('monthlySavingsCapacity', val)}
                prefix={symbol}
                min={0}
                step={1000}
                tooltip="How much you can save monthly towards emergency fund"
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Risk Factors"
            description="Factors affecting your needs"
            icon={ShieldAlert}
          >
            <div className="space-y-5">
              <SelectField
                label="Job Security"
                id="jobSecurity"
                value={inputs.jobSecurity}
                onChange={(val) => updateInput('jobSecurity', val)}
                options={jobSecurityOptions}
              />
              
              <SliderField
                label="Number of Dependents"
                id="dependents"
                value={inputs.dependents}
                onChange={(val) => updateInput('dependents', val)}
                min={0}
                max={10}
                step={1}
                suffix=""
              />
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Spouse/Partner Income</label>
                  <Button
                    variant={inputs.hasSpouseIncome ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => updateInput('hasSpouseIncome', !inputs.hasSpouseIncome)}
                  >
                    {inputs.hasSpouseIncome ? 'Yes' : 'No'}
                  </Button>
                </div>
                
                {inputs.hasSpouseIncome && (
                  <InputField
                    label="Spouse Monthly Income"
                    id="spouseIncome"
                    value={inputs.spouseIncome}
                    onChange={(val) => updateInput('spouseIncome', val)}
                    prefix={symbol}
                    min={0}
                    step={5000}
                  />
                )}
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Health Insurance</label>
                  <Button
                    variant={inputs.hasHealthInsurance ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => updateInput('hasHealthInsurance', !inputs.hasHealthInsurance)}
                  >
                    {inputs.hasHealthInsurance ? 'Yes' : 'No'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Disability Insurance</label>
                  <Button
                    variant={inputs.hasDisabilityInsurance ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => updateInput('hasDisabilityInsurance', !inputs.hasDisabilityInsurance)}
                  >
                    {inputs.hasDisabilityInsurance ? 'Yes' : 'No'}
                  </Button>
                </div>
              </div>
            </div>
          </CalculatorCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <Card className={`overflow-hidden border-2 ${results.isOnTrack ? 'border-success/20' : 'border-gold/20'}`}>
            <CardContent className="p-0">
              <div className={`p-6 ${results.isOnTrack ? 'bg-success/5' : 'bg-gold/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {results.isOnTrack ? (
                    <Badge className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fully Funded
                    </Badge>
                  ) : (
                    <Badge className="bg-gold/10 text-gold border-gold/20">
                      <Target className="h-3 w-3 mr-1" />
                      Building Fund
                    </Badge>
                  )}
                  <Badge variant="outline" className={
                    results.riskLevel === 'high' ? 'border-destructive text-destructive' :
                    results.riskLevel === 'medium' ? 'border-gold text-gold' :
                    'border-success text-success'
                  }>
                    {results.riskLevel.charAt(0).toUpperCase() + results.riskLevel.slice(1)} Risk
                  </Badge>
                </div>
                <ResultDisplay
                  label="Target Emergency Fund"
                  value={results.targetFund}
                  prefix={symbol}
                  size="xl"
                  variant={results.isOnTrack ? "success" : "premium"}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {results.recommendedMonths} months of expenses recommended
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Funding Progress</span>
                <span className="text-sm font-bold text-gold">{results.fundingRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                  style={{ width: `${Math.min(results.fundingRatio, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Current: {formatCurrency(results.currentSavings)}</span>
                <span>Target: {formatCurrency(results.targetFund)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Results */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Months Covered"
              value={results.monthsCovered}
              prefix=""
              suffix=" mo"
              variant="premium"
            />
            <ResultDisplay
              label={results.shortfall > 0 ? "Shortfall" : "Surplus"}
              value={results.shortfall > 0 ? results.shortfall : results.surplus}
              prefix={symbol}
              variant={results.shortfall > 0 ? "muted" : "success"}
            />
            <ResultDisplay
              label="Months to Target"
              value={results.monthsToTarget || '✓'}
              prefix=""
              suffix={results.monthsToTarget ? " mo" : ""}
              variant={results.monthsToTarget > 0 ? "muted" : "success"}
            />
            <ResultDisplay
              label="Essential Expenses"
              value={results.essentialExpenses}
              prefix={symbol}
              variant="muted"
            />
          </ResultGrid>

          {/* Fund Tiers */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className={results.currentSavings >= results.minimumFund ? 'border-success/30 bg-success/5' : ''}>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Minimum (3 mo)</p>
                <p className="text-xl font-bold">{formatCurrency(results.minimumFund)}</p>
                {results.currentSavings >= results.minimumFund && (
                  <CheckCircle className="h-5 w-5 text-success mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
            <Card className={results.currentSavings >= results.targetFund ? 'border-gold/30 bg-gold/5' : ''}>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Target ({results.recommendedMonths} mo)</p>
                <p className="text-xl font-bold text-gold">{formatCurrency(results.targetFund)}</p>
                {results.currentSavings >= results.targetFund && (
                  <CheckCircle className="h-5 w-5 text-gold mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
            <Card className={results.currentSavings >= results.idealFund ? 'border-forest/30 bg-forest/5' : ''}>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Ideal (+3 mo buffer)</p>
                <p className="text-xl font-bold">{formatCurrency(results.idealFund)}</p>
                {results.currentSavings >= results.idealFund && (
                  <CheckCircle className="h-5 w-5 text-forest mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="projection" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="projection">Savings Projection</TabsTrigger>
              <TabsTrigger value="allocation">Fund Allocation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projection" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Path to Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <GrowthAreaChart
                    data={results.projectionData}
                    dataKeys={[
                      { key: 'savings', name: 'Projected Savings', color: 'hsl(43, 74%, 49%)' },
                      { key: 'target', name: 'Target', color: 'hsl(150, 45%, 35%)' },
                    ]}
                    xAxisKey="month"
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="allocation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Suggested Fund Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.allocationData}
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
