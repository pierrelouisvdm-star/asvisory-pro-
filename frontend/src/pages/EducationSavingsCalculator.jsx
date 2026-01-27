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
import { GraduationCap, Calendar, Target, TrendingUp, Baby } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const educationTypeOptions = [
  { value: 'private_school', label: 'Private School (K-12)' },
  { value: 'university_local', label: 'University (Local)' },
  { value: 'university_abroad', label: 'University (Abroad)' },
  { value: 'postgrad', label: 'Postgraduate Studies' },
];

const getAnnualCost = (type, currency) => {
  // Approximate annual costs in ZAR
  const costs = {
    private_school: 150000,
    university_local: 100000,
    university_abroad: 500000,
    postgrad: 200000,
  };
  return costs[type] || 100000;
};

const getDuration = (type) => {
  const durations = {
    private_school: 12,
    university_local: 4,
    university_abroad: 4,
    postgrad: 2,
  };
  return durations[type] || 4;
};

export const EducationSavingsCalculator = () => {
  const { symbol, formatCurrency, currency } = useCurrency();
  
  const [inputs, setInputs] = useState({
    childAge: 5,
    educationType: 'university_local',
    startAge: 18,
    currentSavings: 50000,
    monthlyContribution: 2000,
    expectedReturn: 10,
    educationInflation: 8,
    numberOfChildren: 1,
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    const {
      childAge, educationType, startAge, currentSavings,
      monthlyContribution, expectedReturn, educationInflation, numberOfChildren
    } = inputs;

    const yearsToEducation = Math.max(0, startAge - childAge);
    const duration = getDuration(educationType);
    const currentAnnualCost = getAnnualCost(educationType, currency);
    
    // Calculate future cost with education inflation
    const futureAnnualCost = currentAnnualCost * Math.pow(1 + educationInflation / 100, yearsToEducation);
    
    // Total cost for all years of education (with continuing inflation)
    let totalEducationCost = 0;
    for (let year = 0; year < duration; year++) {
      totalEducationCost += futureAnnualCost * Math.pow(1 + educationInflation / 100, year);
    }
    
    // Total for all children
    const totalCostAllChildren = totalEducationCost * numberOfChildren;
    
    // Calculate future value of savings
    const monthlyRate = expectedReturn / 100 / 12;
    const months = yearsToEducation * 12;
    
    // FV of current savings
    const fvCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToEducation);
    
    // FV of monthly contributions
    const fvContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    const totalSavings = fvCurrentSavings + fvContributions;
    
    // Gap analysis
    const fundingRatio = (totalSavings / totalCostAllChildren) * 100;
    const shortfall = Math.max(0, totalCostAllChildren - totalSavings);
    const surplus = Math.max(0, totalSavings - totalCostAllChildren);
    
    // Required monthly contribution to fully fund
    const requiredMonthly = shortfall > 0 
      ? (totalCostAllChildren - fvCurrentSavings) / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : monthlyContribution;
    
    // Projection data
    const projectionData = [];
    let projectedSavings = currentSavings;
    let projectedCost = currentAnnualCost * duration * numberOfChildren;
    
    for (let year = 0; year <= yearsToEducation; year++) {
      projectionData.push({
        year: `Age ${childAge + year}`,
        savings: projectedSavings,
        targetCost: projectedCost,
      });
      projectedSavings = projectedSavings * (1 + expectedReturn / 100) + monthlyContribution * 12;
      projectedCost = projectedCost * (1 + educationInflation / 100);
    }

    // Cost breakdown by year
    const costBreakdown = [];
    let yearCost = futureAnnualCost;
    for (let year = 1; year <= duration; year++) {
      costBreakdown.push({
        name: `Year ${year}`,
        value: yearCost * numberOfChildren,
        color: `hsl(${43 + year * 30}, 74%, ${49 - year * 5}%)`,
      });
      yearCost *= (1 + educationInflation / 100);
    }

    return {
      yearsToEducation,
      duration,
      currentAnnualCost,
      futureAnnualCost,
      totalEducationCost,
      totalCostAllChildren,
      totalSavings,
      fundingRatio: Math.min(fundingRatio, 200),
      shortfall,
      surplus,
      requiredMonthly,
      additionalMonthlyNeeded: Math.max(0, requiredMonthly - monthlyContribution),
      projectionData,
      costBreakdown,
      isOnTrack: fundingRatio >= 100,
    };
  }, [inputs, currency]);

  const printInputs = [
    { label: 'Child\'s Current Age', value: `${inputs.childAge} years` },
    { label: 'Education Type', value: educationTypeOptions.find(o => o.value === inputs.educationType)?.label },
    { label: 'Education Starts At', value: `Age ${inputs.startAge}` },
    { label: 'Current Savings', value: formatCurrency(inputs.currentSavings) },
    { label: 'Monthly Contribution', value: formatCurrency(inputs.monthlyContribution) },
    { label: 'Number of Children', value: inputs.numberOfChildren.toString() },
  ];

  const printResults = [
    { label: 'Total Education Cost', value: formatCurrency(results.totalCostAllChildren) },
    { label: 'Projected Savings', value: formatCurrency(results.totalSavings) },
    { label: 'Funding Ratio', value: `${results.fundingRatio.toFixed(1)}%` },
    { label: 'Shortfall/Surplus', value: results.shortfall > 0 ? `-${formatCurrency(results.shortfall)}` : `+${formatCurrency(results.surplus)}` },
    { label: 'Required Monthly Savings', value: formatCurrency(results.requiredMonthly) },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Education Savings Calculator
          </h1>
          <p className="text-muted-foreground">
            Plan and save for your children's education
          </p>
        </div>
        <PrintReport
          title="Education Savings Plan"
          calculatorType="education"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Child Details"
            description="Education planning details"
            icon={Baby}
          >
            <div className="space-y-5">
              <SliderField
                label="Child's Current Age"
                id="childAge"
                value={inputs.childAge}
                onChange={(val) => updateInput('childAge', val)}
                min={0}
                max={17}
                step={1}
                suffix=" years"
              />
              
              <SliderField
                label="Number of Children"
                id="numberOfChildren"
                value={inputs.numberOfChildren}
                onChange={(val) => updateInput('numberOfChildren', val)}
                min={1}
                max={5}
                step={1}
                suffix=""
              />
              
              <SelectField
                label="Education Type"
                id="educationType"
                value={inputs.educationType}
                onChange={(val) => updateInput('educationType', val)}
                options={educationTypeOptions}
              />
              
              <SliderField
                label="Education Starts At Age"
                id="startAge"
                value={inputs.startAge}
                onChange={(val) => updateInput('startAge', val)}
                min={6}
                max={25}
                step={1}
                suffix=" years"
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Savings Plan"
            description="Your education fund"
            icon={GraduationCap}
          >
            <div className="space-y-5">
              <InputField
                label="Current Education Savings"
                id="currentSavings"
                value={inputs.currentSavings}
                onChange={(val) => updateInput('currentSavings', val)}
                prefix={symbol}
                min={0}
                step={10000}
              />
              
              <InputField
                label="Monthly Contribution"
                id="monthlyContribution"
                value={inputs.monthlyContribution}
                onChange={(val) => updateInput('monthlyContribution', val)}
                prefix={symbol}
                min={0}
                step={500}
              />
              
              <SliderField
                label="Expected Return"
                id="expectedReturn"
                value={inputs.expectedReturn}
                onChange={(val) => updateInput('expectedReturn', val)}
                min={1}
                max={25}
                step={0.5}
                suffix="%"
              />
              
              <SliderField
                label="Education Inflation"
                id="educationInflation"
                value={inputs.educationInflation}
                onChange={(val) => updateInput('educationInflation', val)}
                min={3}
                max={15}
                step={0.5}
                suffix="%"
                tooltip="Education costs typically rise faster than general inflation"
              />
            </div>
          </CalculatorCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                      {results.yearsToEducation} years to go
                    </Badge>
                  </div>
                  <ResultDisplay
                    label="Total Education Cost"
                    value={results.totalCostAllChildren}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {inputs.numberOfChildren > 1 ? `For ${inputs.numberOfChildren} children` : 'For 1 child'} • {results.duration} years
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`overflow-hidden border-2 ${results.isOnTrack ? 'border-success/20' : 'border-gold/20'}`}>
              <CardContent className="p-0">
                <div className={`p-6 ${results.isOnTrack ? 'bg-success/5' : 'bg-gold/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={results.isOnTrack ? 'bg-success/10 text-success border-success/20' : 'bg-gold/10 text-gold border-gold/20'}>
                      {results.isOnTrack ? 'On Track' : 'Gap Exists'}
                    </Badge>
                  </div>
                  <ResultDisplay
                    label="Projected Savings"
                    value={results.totalSavings}
                    prefix={symbol}
                    size="xl"
                    variant={results.isOnTrack ? "success" : "muted"}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {results.fundingRatio.toFixed(1)}% funded
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Funding Progress</span>
                <span className="text-sm font-bold text-gold">{results.fundingRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    results.isOnTrack 
                      ? 'bg-gradient-to-r from-success to-success/80' 
                      : 'bg-gradient-to-r from-gold to-gold-light'
                  }`}
                  style={{ width: `${Math.min(results.fundingRatio, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Current Annual Cost"
              value={results.currentAnnualCost}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Future Annual Cost"
              value={results.futureAnnualCost}
              prefix={symbol}
              variant="premium"
            />
            <ResultDisplay
              label={results.shortfall > 0 ? "Shortfall" : "Surplus"}
              value={results.shortfall > 0 ? results.shortfall : results.surplus}
              prefix={symbol}
              variant={results.shortfall > 0 ? "muted" : "success"}
            />
            <ResultDisplay
              label="Extra Monthly Needed"
              value={results.additionalMonthlyNeeded}
              prefix={symbol}
              variant={results.additionalMonthlyNeeded > 0 ? "premium" : "success"}
            />
          </ResultGrid>

          {/* Required Savings */}
          {results.additionalMonthlyNeeded > 0 && (
            <Card className="border-2 border-gold/20 bg-gold/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">To Fully Fund Education</h4>
                    <p className="text-sm text-muted-foreground">
                      Increase monthly contribution to <span className="font-bold text-gold">{formatCurrency(results.requiredMonthly)}</span> (additional {formatCurrency(results.additionalMonthlyNeeded)}/month)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <Tabs defaultValue="projection" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="projection">Savings Projection</TabsTrigger>
              <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projection" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Savings vs Education Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <GrowthAreaChart
                    data={results.projectionData}
                    dataKeys={[
                      { key: 'savings', name: 'Projected Savings', color: 'hsl(150, 45%, 35%)' },
                      { key: 'targetCost', name: 'Education Cost', color: 'hsl(43, 74%, 49%)' },
                    ]}
                    xAxisKey="year"
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="costs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Education Cost by Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.costBreakdown}
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
