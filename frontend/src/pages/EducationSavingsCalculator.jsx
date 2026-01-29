import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GraduationCap, Calendar, Target, TrendingUp, Baby, School, Building2, BookOpen, Shirt, Bus, Apple, Laptop, Plus, Minus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';

// Education stages with SA-specific costs (annual fees in ZAR)
const educationStages = {
  nursery: {
    label: 'Nursery / Pre-School',
    icon: Baby,
    ageRange: '2-5 years',
    years: 3,
    defaultStartAge: 3,
    defaultEndAge: 5,
    costs: {
      government: 15000,
      private: 65000,
      premium: 120000,
    },
    description: 'Early childhood development',
  },
  primary: {
    label: 'Primary School',
    icon: School,
    ageRange: '6-12 years',
    years: 7,
    defaultStartAge: 6,
    defaultEndAge: 12,
    costs: {
      government: 5000,
      private: 85000,
      premium: 150000,
    },
    description: 'Grade R to Grade 6',
  },
  highSchool: {
    label: 'High School',
    icon: Building2,
    ageRange: '13-17 years',
    years: 5,
    defaultStartAge: 13,
    defaultEndAge: 17,
    costs: {
      government: 8000,
      private: 110000,
      premium: 200000,
    },
    description: 'Grade 7 to Matric',
  },
  university: {
    label: 'University / College',
    icon: GraduationCap,
    ageRange: '18-21+ years',
    years: 4,
    defaultStartAge: 18,
    defaultEndAge: 21,
    costs: {
      government: 65000,
      private: 120000,
      premium: 250000,
    },
    description: 'Undergraduate degree',
  },
};

// Miscellaneous cost categories
const miscCostCategories = [
  { id: 'uniform', label: 'School Uniform & Clothing', icon: Shirt, defaultAnnual: 5000, description: 'Uniforms, sports kit, shoes' },
  { id: 'transport', label: 'Transport', icon: Bus, defaultAnnual: 18000, description: 'School bus, fuel, or public transport' },
  { id: 'meals', label: 'Meals & Tuckshop', icon: Apple, defaultAnnual: 8000, description: 'Packed lunches or tuckshop money' },
  { id: 'technology', label: 'Technology & Devices', icon: Laptop, defaultAnnual: 6000, description: 'Laptop, tablet, internet' },
  { id: 'extracurricular', label: 'Extra-Curricular', icon: BookOpen, defaultAnnual: 12000, description: 'Sports, music, tutoring' },
];

const schoolTypeOptions = [
  { value: 'government', label: 'Government School' },
  { value: 'private', label: 'Private School' },
  { value: 'premium', label: 'Premium Private School' },
];

export const EducationSavingsCalculator = () => {
  const { symbol, formatCurrency, currency } = useCurrency();
  
  // Basic inputs
  const [inputs, setInputs] = useState({
    childAge: 3,
    numberOfChildren: 1,
    currentSavings: 50000,
    monthlyContribution: 3000,
    expectedReturn: 10,
    educationInflation: 8,
  });

  // Education stages configuration
  const [stages, setStages] = useState({
    nursery: { enabled: true, schoolType: 'private', customCost: null },
    primary: { enabled: true, schoolType: 'private', customCost: null },
    highSchool: { enabled: true, schoolType: 'private', customCost: null },
    university: { enabled: true, schoolType: 'government', customCost: null },
  });

  // Miscellaneous costs
  const [miscCosts, setMiscCosts] = useState({
    uniform: { enabled: true, annual: 5000 },
    transport: { enabled: true, annual: 18000 },
    meals: { enabled: true, annual: 8000 },
    technology: { enabled: true, annual: 6000 },
    extracurricular: { enabled: true, annual: 12000 },
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const toggleStage = (stageId) => {
    setStages(prev => ({
      ...prev,
      [stageId]: { ...prev[stageId], enabled: !prev[stageId].enabled }
    }));
  };

  const updateStageSchoolType = (stageId, schoolType) => {
    setStages(prev => ({
      ...prev,
      [stageId]: { ...prev[stageId], schoolType, customCost: null }
    }));
  };

  const toggleMiscCost = (costId) => {
    setMiscCosts(prev => ({
      ...prev,
      [costId]: { ...prev[costId], enabled: !prev[costId].enabled }
    }));
  };

  const updateMiscCostAmount = (costId, annual) => {
    setMiscCosts(prev => ({
      ...prev,
      [costId]: { ...prev[costId], annual: Math.max(0, annual) }
    }));
  };

  const results = useMemo(() => {
    const { childAge, numberOfChildren, currentSavings, monthlyContribution, expectedReturn, educationInflation } = inputs;

    // Calculate costs for each enabled stage
    const stageResults = [];
    let totalEducationCost = 0;
    let totalMiscCost = 0;

    Object.entries(stages).forEach(([stageId, stageConfig]) => {
      if (!stageConfig.enabled) return;

      const stage = educationStages[stageId];
      const annualFee = stageConfig.customCost || stage.costs[stageConfig.schoolType];
      const yearsUntilStart = Math.max(0, stage.defaultStartAge - childAge);
      
      // Calculate inflated cost for each year of this stage
      let stageTotalCost = 0;
      for (let year = 0; year < stage.years; year++) {
        const yearsFromNow = yearsUntilStart + year;
        const inflatedCost = annualFee * Math.pow(1 + educationInflation / 100, yearsFromNow);
        stageTotalCost += inflatedCost;
      }

      // Add miscellaneous costs for school years (not university)
      let stageMiscCost = 0;
      if (stageId !== 'university') {
        Object.entries(miscCosts).forEach(([costId, costConfig]) => {
          if (costConfig.enabled) {
            for (let year = 0; year < stage.years; year++) {
              const yearsFromNow = yearsUntilStart + year;
              const inflatedMisc = costConfig.annual * Math.pow(1 + educationInflation / 100, yearsFromNow);
              stageMiscCost += inflatedMisc;
            }
          }
        });
      }

      stageResults.push({
        id: stageId,
        label: stage.label,
        icon: stage.icon,
        years: stage.years,
        startAge: stage.defaultStartAge,
        endAge: stage.defaultEndAge,
        annualFee,
        schoolType: stageConfig.schoolType,
        totalFeeCost: stageTotalCost * numberOfChildren,
        totalMiscCost: stageMiscCost * numberOfChildren,
        totalCost: (stageTotalCost + stageMiscCost) * numberOfChildren,
        yearsUntilStart,
      });

      totalEducationCost += stageTotalCost * numberOfChildren;
      totalMiscCost += stageMiscCost * numberOfChildren;
    });

    const grandTotal = totalEducationCost + totalMiscCost;

    // Calculate projected savings
    const lastStage = stageResults[stageResults.length - 1];
    const yearsToFinalEducation = lastStage ? lastStage.yearsUntilStart + lastStage.years : 15;
    
    const monthlyRate = expectedReturn / 100 / 12;
    const months = yearsToFinalEducation * 12;
    
    // FV of current savings
    const fvCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToFinalEducation);
    
    // FV of monthly contributions
    const fvContributions = months > 0 
      ? monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : 0;
    
    const totalSavings = fvCurrentSavings + fvContributions;

    // Gap analysis
    const fundingRatio = grandTotal > 0 ? (totalSavings / grandTotal) * 100 : 100;
    const shortfall = Math.max(0, grandTotal - totalSavings);
    const surplus = Math.max(0, totalSavings - grandTotal);

    // Required monthly contribution
    const requiredMonthly = shortfall > 0 && months > 0
      ? (grandTotal - fvCurrentSavings) / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : monthlyContribution;

    // Projection data for chart
    const projectionData = [];
    let projectedSavings = currentSavings;
    let cumulativeCost = 0;

    for (let year = 0; year <= yearsToFinalEducation; year++) {
      const currentAge = childAge + year;
      
      // Add costs for any stages that apply to this year
      stageResults.forEach(stage => {
        if (currentAge >= stage.startAge && currentAge <= stage.endAge) {
          const yearInStage = currentAge - stage.startAge;
          const stageCostThisYear = (stage.totalCost / stage.years);
          cumulativeCost += stageCostThisYear / numberOfChildren; // Per child for cleaner chart
        }
      });

      projectionData.push({
        year: `Age ${currentAge}`,
        savings: projectedSavings,
        cumulativeCost: cumulativeCost * numberOfChildren,
      });

      projectedSavings = projectedSavings * (1 + expectedReturn / 100) + monthlyContribution * 12;
    }

    // Cost breakdown for pie chart
    const costBreakdown = stageResults.map((stage, idx) => ({
      name: stage.label,
      value: stage.totalCost,
      color: `hsl(${160 + idx * 45}, 60%, ${45 - idx * 5}%)`,
    }));

    if (totalMiscCost > 0) {
      costBreakdown.push({
        name: 'Miscellaneous Costs',
        value: totalMiscCost,
        color: 'hsl(43, 74%, 49%)',
      });
    }

    return {
      stageResults,
      totalEducationCost,
      totalMiscCost,
      grandTotal,
      totalSavings,
      fundingRatio: Math.min(fundingRatio, 200),
      shortfall,
      surplus,
      requiredMonthly,
      additionalMonthlyNeeded: Math.max(0, requiredMonthly - monthlyContribution),
      projectionData,
      costBreakdown,
      isOnTrack: fundingRatio >= 100,
      yearsToFinalEducation,
    };
  }, [inputs, stages, miscCosts]);

  // Calculate current annual misc costs
  const currentAnnualMisc = Object.values(miscCosts)
    .filter(c => c.enabled)
    .reduce((sum, c) => sum + c.annual, 0);

  const printInputs = [
    { label: 'Child\'s Current Age', value: `${inputs.childAge} years` },
    { label: 'Number of Children', value: inputs.numberOfChildren.toString() },
    { label: 'Current Savings', value: formatCurrency(inputs.currentSavings) },
    { label: 'Monthly Contribution', value: formatCurrency(inputs.monthlyContribution) },
    { label: 'Expected Return', value: `${inputs.expectedReturn}%` },
    { label: 'Education Inflation', value: `${inputs.educationInflation}%` },
  ];

  const printResults = [
    { label: 'Total Education Cost', value: formatCurrency(results.grandTotal) },
    { label: 'Projected Savings', value: formatCurrency(results.totalSavings) },
    { label: 'Funding Ratio', value: `${results.fundingRatio.toFixed(1)}%` },
    { label: 'Shortfall/Surplus', value: results.shortfall > 0 ? `-${formatCurrency(results.shortfall)}` : `+${formatCurrency(results.surplus)}` },
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
            Comprehensive planning from nursery to university
          </p>
        </div>
        <PrintReport
          title="Education Savings Plan"
          calculatorType="education"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <Tabs defaultValue="stages" className="space-y-6">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="stages" className="gap-2">
            <School className="h-4 w-4" />
            Education Stages
          </TabsTrigger>
          <TabsTrigger value="misc" className="gap-2">
            <Shirt className="h-4 w-4" />
            Additional Costs
          </TabsTrigger>
          <TabsTrigger value="savings" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Savings Plan
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <Target className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Education Stages Tab */}
        <TabsContent value="stages" className="space-y-6">
          <div className="grid gap-4">
            {/* Child Details Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Baby className="h-5 w-5 text-emerald-500" />
                  Child Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Education Stages */}
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(educationStages).map(([stageId, stage]) => {
                const stageConfig = stages[stageId];
                const Icon = stage.icon;
                const isEnabled = stageConfig.enabled;
                const currentCost = stage.costs[stageConfig.schoolType];

                return (
                  <Card 
                    key={stageId}
                    className={cn(
                      "transition-all duration-200",
                      isEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "opacity-60"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isEnabled ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{stage.label}</CardTitle>
                            <CardDescription className="text-xs">
                              {stage.ageRange} • {stage.years} years
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleStage(stageId)}
                        />
                      </div>
                    </CardHeader>
                    {isEnabled && (
                      <CardContent className="pt-0 space-y-4">
                        <SelectField
                          label="School Type"
                          id={`${stageId}-type`}
                          value={stageConfig.schoolType}
                          onChange={(val) => updateStageSchoolType(stageId, val)}
                          options={schoolTypeOptions}
                        />
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Annual Fee</span>
                          <span className="font-semibold text-emerald-500">
                            {formatCurrency(currentCost)}
                          </span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Miscellaneous Costs Tab */}
        <TabsContent value="misc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shirt className="h-5 w-5 text-emerald-500" />
                Additional Annual Costs
              </CardTitle>
              <CardDescription>
                These costs apply to school years (nursery through high school)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {miscCostCategories.map((category) => {
                const costConfig = miscCosts[category.id];
                const Icon = category.icon;

                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-all",
                      costConfig.enabled 
                        ? "border-emerald-500/30 bg-emerald-500/5" 
                        : "border-border bg-muted/30 opacity-60"
                    )}
                  >
                    <Switch
                      checked={costConfig.enabled}
                      onCheckedChange={() => toggleMiscCost(category.id)}
                    />
                    <div className={cn(
                      "p-2 rounded-lg",
                      costConfig.enabled ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{category.label}</p>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                    {costConfig.enabled && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateMiscCostAmount(category.id, costConfig.annual - 1000)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-24 text-center">
                          <span className="font-semibold">{formatCurrency(costConfig.annual)}</span>
                          <span className="text-xs text-muted-foreground block">/year</span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateMiscCostAmount(category.id, costConfig.annual + 1000)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg mt-4">
                <span className="font-medium">Total Additional Costs (Annual)</span>
                <span className="text-xl font-bold text-emerald-500">
                  {formatCurrency(currentAnnualMisc)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Savings Plan Tab */}
        <TabsContent value="savings" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <CalculatorCard
              title="Current Savings"
              description="Your education fund status"
              icon={Target}
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
              </div>
            </CalculatorCard>

            <CalculatorCard
              title="Growth Assumptions"
              description="Investment and inflation rates"
              icon={TrendingUp}
            >
              <div className="space-y-5">
                <SliderField
                  label="Expected Investment Return"
                  id="expectedReturn"
                  value={inputs.expectedReturn}
                  onChange={(val) => updateInput('expectedReturn', val)}
                  min={4}
                  max={15}
                  step={0.5}
                  suffix="%"
                />
                
                <SliderField
                  label="Education Inflation Rate"
                  id="educationInflation"
                  value={inputs.educationInflation}
                  onChange={(val) => updateInput('educationInflation', val)}
                  min={4}
                  max={12}
                  step={0.5}
                  suffix="%"
                  tooltip="Education costs typically rise 8-10% annually in SA"
                />
              </div>
            </CalculatorCard>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-emerald-500/20">
              <CardContent className="pt-6">
                <ResultDisplay
                  label="Total Education Cost"
                  value={results.grandTotal}
                  prefix={symbol}
                  size="lg"
                  variant="premium"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {inputs.numberOfChildren > 1 ? `For ${inputs.numberOfChildren} children` : '1 child'} • {results.yearsToFinalEducation} years
                </p>
              </CardContent>
            </Card>
            
            <Card className={cn(
              "border-2",
              results.isOnTrack ? "border-green-500/20" : "border-amber-500/20"
            )}>
              <CardContent className="pt-6">
                <ResultDisplay
                  label="Projected Savings"
                  value={results.totalSavings}
                  prefix={symbol}
                  size="lg"
                  variant={results.isOnTrack ? "success" : "muted"}
                />
                <Badge className={cn(
                  "mt-2",
                  results.isOnTrack 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}>
                  {results.fundingRatio.toFixed(0)}% Funded
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ResultDisplay
                  label={results.shortfall > 0 ? "Shortfall" : "Surplus"}
                  value={results.shortfall > 0 ? results.shortfall : results.surplus}
                  prefix={results.shortfall > 0 ? `-${symbol}` : `+${symbol}`}
                  size="lg"
                  variant={results.shortfall > 0 ? "muted" : "success"}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ResultDisplay
                  label="Required Monthly"
                  value={results.requiredMonthly}
                  prefix={symbol}
                  size="lg"
                  variant="premium"
                />
                {results.additionalMonthlyNeeded > 0 && (
                  <p className="text-xs text-amber-500 mt-2">
                    +{formatCurrency(results.additionalMonthlyNeeded)} more needed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Overall Funding Progress</span>
                <div className="flex items-center gap-2">
                  {results.isOnTrack ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className={cn(
                    "text-lg font-bold",
                    results.isOnTrack ? "text-green-500" : "text-amber-500"
                  )}>
                    {results.fundingRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    results.isOnTrack 
                      ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                      : "bg-gradient-to-r from-amber-500 to-yellow-400"
                  )}
                  style={{ width: `${Math.min(results.fundingRatio, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown by Stage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Breakdown by Education Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.stageResults.map((stage) => {
                  const Icon = stage.icon;
                  const percentage = (stage.totalCost / results.grandTotal) * 100;
                  
                  return (
                    <div key={stage.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-sm">{stage.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {schoolTypeOptions.find(o => o.value === stage.schoolType)?.label}
                          </Badge>
                        </div>
                        <span className="font-semibold">{formatCurrency(stage.totalCost)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Ages {stage.startAge}-{stage.endAge}</span>
                        <span>•</span>
                        <span>Fees: {formatCurrency(stage.totalFeeCost)}</span>
                        {stage.totalMiscCost > 0 && (
                          <>
                            <span>•</span>
                            <span>Extras: {formatCurrency(stage.totalMiscCost)}</span>
                          </>
                        )}
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Savings vs Cost Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthAreaChart
                  data={results.projectionData}
                  dataKeys={[
                    { key: 'savings', name: 'Projected Savings', color: 'hsl(150, 45%, 35%)' },
                    { key: 'cumulativeCost', name: 'Cumulative Cost', color: 'hsl(43, 74%, 49%)' },
                  ]}
                  xAxisKey="year"
                  height={300}
                  prefix={symbol}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownPieChart
                  data={results.costBreakdown}
                  height={300}
                  prefix={symbol}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recommendation */}
          {results.additionalMonthlyNeeded > 0 && (
            <Card className="border-2 border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-amber-500/20">
                    <Target className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">To Fully Fund Education</h4>
                    <p className="text-muted-foreground">
                      Increase your monthly contribution from{' '}
                      <span className="font-semibold text-foreground">{formatCurrency(inputs.monthlyContribution)}</span>
                      {' '}to{' '}
                      <span className="font-bold text-amber-500">{formatCurrency(results.requiredMonthly)}</span>
                      {' '}(an additional {formatCurrency(results.additionalMonthlyNeeded)}/month)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationSavingsCalculator;
