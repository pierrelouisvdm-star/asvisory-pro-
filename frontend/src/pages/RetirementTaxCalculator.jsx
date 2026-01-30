import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { BreakdownPieChart, MultiLineChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, Wallet, PiggyBank, TrendingUp, Info, 
  CheckCircle, Calculator, Percent, Building2
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

// SA Tax Year 2024/25 Constants
const TAX_YEAR = '2024/25';
const RA_CONTRIBUTION_LIMIT_PERCENTAGE = 27.5;
const RA_CONTRIBUTION_LIMIT_MAX = 350000;
const PRIMARY_REBATE = 17235;
const SECONDARY_REBATE = 9444; // 65+
const TERTIARY_REBATE = 3145; // 75+
const MEDICAL_TAX_CREDIT_MAIN = 364; // per month
const MEDICAL_TAX_CREDIT_FIRST_DEP = 364;
const MEDICAL_TAX_CREDIT_ADDITIONAL_DEP = 246;

const ageGroupOptions = [
  { value: 'under65', label: 'Under 65' },
  { value: '65to74', label: '65 - 74' },
  { value: '75plus', label: '75 and older' },
];

export const RetirementTaxCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [inputs, setInputs] = useState({
    grossIncome: 600000,
    ageGroup: 'under65',
    currentRAContribution: 5000, // monthly
    employerPensionContribution: 0, // monthly
    medicalAidMembers: 2,
    medicalAidDependents: 0,
    otherDeductions: 0,
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Calculate SA Tax
  const calculateTax = (taxableIncome, ageGroup) => {
    let tax = 0;
    
    // 2024/25 Tax Brackets
    if (taxableIncome <= 237100) {
      tax = taxableIncome * 0.18;
    } else if (taxableIncome <= 370500) {
      tax = 42678 + (taxableIncome - 237100) * 0.26;
    } else if (taxableIncome <= 512800) {
      tax = 77362 + (taxableIncome - 370500) * 0.31;
    } else if (taxableIncome <= 673000) {
      tax = 121475 + (taxableIncome - 512800) * 0.36;
    } else if (taxableIncome <= 857900) {
      tax = 179147 + (taxableIncome - 673000) * 0.39;
    } else if (taxableIncome <= 1817000) {
      tax = 251258 + (taxableIncome - 857900) * 0.41;
    } else {
      tax = 644489 + (taxableIncome - 1817000) * 0.45;
    }
    
    // Apply rebates
    let totalRebate = PRIMARY_REBATE;
    if (ageGroup === '65to74') {
      totalRebate += SECONDARY_REBATE;
    } else if (ageGroup === '75plus') {
      totalRebate += SECONDARY_REBATE + TERTIARY_REBATE;
    }
    
    return Math.max(0, tax - totalRebate);
  };

  const results = useMemo(() => {
    const {
      grossIncome, ageGroup, currentRAContribution, employerPensionContribution,
      medicalAidMembers, medicalAidDependents, otherDeductions
    } = inputs;
    
    // Annual values
    const annualRAContribution = currentRAContribution * 12;
    const annualEmployerPension = employerPensionContribution * 12;
    
    // Calculate max allowable RA deduction
    const retirementContributionLimit = Math.min(
      grossIncome * (RA_CONTRIBUTION_LIMIT_PERCENTAGE / 100),
      RA_CONTRIBUTION_LIMIT_MAX
    );
    
    // Current total retirement contributions
    const totalRetirementContributions = annualRAContribution + annualEmployerPension;
    
    // Allowable deduction (capped)
    const allowableDeduction = Math.min(totalRetirementContributions, retirementContributionLimit);
    
    // Additional contribution room
    const additionalContributionRoom = Math.max(0, retirementContributionLimit - totalRetirementContributions);
    const additionalMonthlyRoom = additionalContributionRoom / 12;
    
    // Medical tax credits
    const medicalCredits = (
      (medicalAidMembers >= 1 ? MEDICAL_TAX_CREDIT_MAIN : 0) +
      (medicalAidMembers >= 2 ? MEDICAL_TAX_CREDIT_FIRST_DEP : 0) +
      (medicalAidDependents * MEDICAL_TAX_CREDIT_ADDITIONAL_DEP)
    ) * 12;
    
    // Calculate tax WITHOUT retirement contributions
    const taxableIncomeNoRA = grossIncome - otherDeductions;
    const taxWithoutRA = calculateTax(taxableIncomeNoRA, ageGroup) - medicalCredits;
    
    // Calculate tax WITH current retirement contributions
    const taxableIncomeWithRA = grossIncome - allowableDeduction - otherDeductions;
    const taxWithRA = calculateTax(taxableIncomeWithRA, ageGroup) - medicalCredits;
    
    // Tax saving from current contributions
    const currentTaxSaving = Math.max(0, taxWithoutRA - taxWithRA);
    const monthlyTaxSaving = currentTaxSaving / 12;
    
    // Calculate tax WITH maximum retirement contributions
    const maxContribution = retirementContributionLimit;
    const taxableIncomeMaxRA = grossIncome - maxContribution - otherDeductions;
    const taxWithMaxRA = calculateTax(taxableIncomeMaxRA, ageGroup) - medicalCredits;
    
    // Potential additional tax saving
    const maxTaxSaving = Math.max(0, taxWithoutRA - taxWithMaxRA);
    const potentialAdditionalSaving = maxTaxSaving - currentTaxSaving;
    
    // Effective tax rates
    const effectiveTaxRateNoRA = (Math.max(0, taxWithoutRA) / grossIncome) * 100;
    const effectiveTaxRateWithRA = (Math.max(0, taxWithRA) / grossIncome) * 100;
    const effectiveTaxRateMaxRA = (Math.max(0, taxWithMaxRA) / grossIncome) * 100;
    
    // Marginal tax rate (for information)
    let marginalRate = 18;
    if (taxableIncomeWithRA > 1817000) marginalRate = 45;
    else if (taxableIncomeWithRA > 857900) marginalRate = 41;
    else if (taxableIncomeWithRA > 673000) marginalRate = 39;
    else if (taxableIncomeWithRA > 512800) marginalRate = 36;
    else if (taxableIncomeWithRA > 370500) marginalRate = 31;
    else if (taxableIncomeWithRA > 237100) marginalRate = 26;
    
    // Net cost of RA contribution (contribution minus tax saving)
    const netCostOfContribution = annualRAContribution - currentTaxSaving;
    const netMonthlyCost = netCostOfContribution / 12;
    
    // Generate comparison data for chart
    const comparisonData = [
      { scenario: 'No RA', tax: Math.max(0, taxWithoutRA), savings: 0 },
      { scenario: 'Current RA', tax: Math.max(0, taxWithRA), savings: currentTaxSaving },
      { scenario: 'Max RA', tax: Math.max(0, taxWithMaxRA), savings: maxTaxSaving },
    ];
    
    // Tax breakdown pie chart
    const taxBreakdown = [
      { name: 'Take-Home (Net)', value: grossIncome - Math.max(0, taxWithRA) - annualRAContribution, color: 'hsl(150, 45%, 35%)' },
      { name: 'Tax Paid', value: Math.max(0, taxWithRA), color: 'hsl(0, 60%, 50%)' },
      { name: 'RA Contribution', value: annualRAContribution, color: 'hsl(43, 74%, 49%)' },
    ];
    
    // Projection over years (showing compound benefit)
    const projectionData = [];
    const investmentReturn = 0.08; // 8% assumed return
    let cumulativeSavings = 0;
    let investedSavings = 0;
    
    for (let year = 0; year <= 20; year++) {
      cumulativeSavings += currentTaxSaving;
      investedSavings = investedSavings * (1 + investmentReturn) + currentTaxSaving;
      
      projectionData.push({
        year: `Year ${year}`,
        cumulative: cumulativeSavings,
        invested: investedSavings,
      });
    }

    return {
      // Current situation
      annualRAContribution,
      allowableDeduction,
      retirementContributionLimit,
      additionalContributionRoom,
      additionalMonthlyRoom,
      
      // Tax calculations
      taxWithoutRA: Math.max(0, taxWithoutRA),
      taxWithRA: Math.max(0, taxWithRA),
      taxWithMaxRA: Math.max(0, taxWithMaxRA),
      currentTaxSaving,
      monthlyTaxSaving,
      potentialAdditionalSaving,
      maxTaxSaving,
      
      // Rates
      effectiveTaxRateNoRA,
      effectiveTaxRateWithRA,
      effectiveTaxRateMaxRA,
      marginalRate,
      
      // Net cost
      netCostOfContribution,
      netMonthlyCost,
      
      // Chart data
      comparisonData,
      taxBreakdown,
      projectionData,
      
      // Medical credits
      medicalCredits,
      
      // Recommendations
      hasRoom: additionalContributionRoom > 0,
      utilizationPercentage: (totalRetirementContributions / retirementContributionLimit) * 100,
    };
  }, [inputs]);

  const printInputs = [
    { label: 'Gross Annual Income', value: formatCurrency(inputs.grossIncome) },
    { label: 'Age Group', value: ageGroupOptions.find(o => o.value === inputs.ageGroup)?.label },
    { label: 'Monthly RA Contribution', value: formatCurrency(inputs.currentRAContribution) },
    { label: 'Employer Pension Contribution', value: formatCurrency(inputs.employerPensionContribution) },
    { label: 'Medical Aid Members', value: inputs.medicalAidMembers },
  ];

  const printResults = [
    { label: 'Annual Tax Saving', value: formatCurrency(results.currentTaxSaving) },
    { label: 'Monthly Tax Saving', value: formatCurrency(results.monthlyTaxSaving) },
    { label: 'Tax Without RA', value: formatCurrency(results.taxWithoutRA) },
    { label: 'Tax With RA', value: formatCurrency(results.taxWithRA) },
    { label: 'Additional Contribution Room', value: formatCurrency(results.additionalContributionRoom) },
    { label: 'Potential Extra Saving', value: formatCurrency(results.potentialAdditionalSaving) },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="retirement-tax-calculator">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Retirement Tax Savings Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate your tax savings from retirement annuity contributions (SA Tax {TAX_YEAR})
          </p>
        </div>
        <PrintReport
          title="Retirement Tax Savings Analysis"
          calculatorType="retirement-tax"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-emerald-400 mb-1">SA Retirement Contribution Tax Benefits</p>
              <p className="text-slate-400">
                You can deduct up to <strong>27.5%</strong> of your taxable income (max R{RA_CONTRIBUTION_LIMIT_MAX.toLocaleString()}/year) 
                for retirement fund contributions. This includes RA contributions and employer pension fund contributions.
                The tax saving effectively reduces the real cost of your retirement investment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Income Details"
            description="Your annual earnings"
            icon={Wallet}
          >
            <div className="space-y-5">
              <InputField
                label="Gross Annual Income"
                id="grossIncome"
                value={inputs.grossIncome}
                onChange={(val) => updateInput('grossIncome', val)}
                prefix={symbol}
                min={0}
                step={10000}
                tooltip="Total income before deductions"
              />
              
              <SelectField
                label="Age Group"
                id="ageGroup"
                value={inputs.ageGroup}
                onChange={(val) => updateInput('ageGroup', val)}
                options={ageGroupOptions}
                tooltip="Affects tax rebates - seniors get additional rebates"
              />
            </div>
          </CalculatorCard>
          
          <CalculatorCard
            title="Retirement Contributions"
            description="Monthly amounts"
            icon={PiggyBank}
          >
            <div className="space-y-5">
              <InputField
                label="Your RA Contribution (Monthly)"
                id="currentRAContribution"
                value={inputs.currentRAContribution}
                onChange={(val) => updateInput('currentRAContribution', val)}
                prefix={symbol}
                min={0}
                step={500}
                tooltip="Your personal retirement annuity contributions"
              />
              
              <InputField
                label="Employer Pension (Monthly)"
                id="employerPensionContribution"
                value={inputs.employerPensionContribution}
                onChange={(val) => updateInput('employerPensionContribution', val)}
                prefix={symbol}
                min={0}
                step={500}
                tooltip="Employer's contribution to pension fund"
              />
              
              <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-700">
                <p className="text-xs text-slate-400 mb-1">Contribution Limit Used</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">
                    {results.utilizationPercentage.toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    of {formatCurrency(results.retirementContributionLimit)}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, results.utilizationPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Medical Aid"
            description="For tax credits"
            icon={Building2}
          >
            <div className="space-y-5">
              <SliderField
                label="Main Members"
                id="medicalAidMembers"
                value={inputs.medicalAidMembers}
                onChange={(val) => updateInput('medicalAidMembers', val)}
                min={0}
                max={2}
                step={1}
                tooltip="You and spouse (max 2)"
              />
              
              <SliderField
                label="Additional Dependents"
                id="medicalAidDependents"
                value={inputs.medicalAidDependents}
                onChange={(val) => updateInput('medicalAidDependents', val)}
                min={0}
                max={6}
                step={1}
                tooltip="Children and other dependents"
              />
              
              <div className="text-xs text-slate-400">
                Medical tax credits: {formatCurrency(results.medicalCredits)}/year
              </div>
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
                    label="Annual Tax Saving"
                    value={results.currentTaxSaving}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {formatCurrency(results.monthlyTaxSaving)}/month effective saving
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-amber-500/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/5 p-6">
                  {results.hasRoom ? (
                    <>
                      <Badge className="mb-2 bg-amber-500/10 text-amber-400 border-amber-500/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Room to Optimize
                      </Badge>
                      <ResultDisplay
                        label="Additional Room"
                        value={results.additionalMonthlyRoom}
                        prefix={symbol}
                        suffix="/month"
                        size="xl"
                        variant="muted"
                      />
                      <p className="text-xs text-amber-400 mt-2">
                        Could save extra {formatCurrency(results.potentialAdditionalSaving)}/year
                      </p>
                    </>
                  ) : (
                    <>
                      <Badge className="mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Maximized
                      </Badge>
                      <ResultDisplay
                        label="Contribution Status"
                        value="Limit Reached"
                        prefix=""
                        size="lg"
                        variant="success"
                      />
                      <p className="text-xs text-emerald-400 mt-2">
                        You're getting the maximum tax benefit!
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Results */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Tax Without RA"
              value={results.taxWithoutRA}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Tax With RA"
              value={results.taxWithRA}
              prefix={symbol}
              variant="success"
            />
            <ResultDisplay
              label="Marginal Rate"
              value={results.marginalRate}
              prefix=""
              suffix="%"
              variant="muted"
            />
            <ResultDisplay
              label="Effective Rate"
              value={results.effectiveTaxRateWithRA.toFixed(1)}
              prefix=""
              suffix="%"
              variant="muted"
            />
          </ResultGrid>

          {/* Net Cost Analysis */}
          <Card className="border-navy-700 bg-navy-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                True Cost of Your RA Contribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Gross Contribution</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(inputs.currentRAContribution)}</p>
                  <p className="text-xs text-slate-500">/month</p>
                </div>
                <div className="p-3 rounded-lg bg-navy-800/50">
                  <p className="text-xs text-slate-400 mb-1">Tax Saving</p>
                  <p className="text-lg font-semibold text-emerald-400">-{formatCurrency(results.monthlyTaxSaving)}</p>
                  <p className="text-xs text-slate-500">/month</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 mb-1">Net Cost</p>
                  <p className="text-lg font-semibold text-emerald-400">{formatCurrency(results.netMonthlyCost)}</p>
                  <p className="text-xs text-emerald-500">/month actual cost</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">
                For every R1 you contribute, SARS effectively contributes R{((results.currentTaxSaving / results.annualRAContribution) || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="comparison">Tax Comparison</TabsTrigger>
              <TabsTrigger value="breakdown">Income Breakdown</TabsTrigger>
              <TabsTrigger value="projection">20-Year Projection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comparison" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Tax Scenarios Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.comparisonData.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-slate-400">{item.scenario}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-8 bg-red-500/30 rounded"
                              style={{ width: `${(item.tax / results.taxWithoutRA) * 100}%` }}
                            />
                            <span className="text-sm font-medium">{formatCurrency(item.tax)}</span>
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <span className="text-sm text-emerald-400">
                            {item.savings > 0 ? `Save ${formatCurrency(item.savings)}` : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="breakdown" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Annual Income Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.taxBreakdown}
                    height={320}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projection" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Cumulative Tax Savings Over 20 Years</CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiLineChart
                    data={results.projectionData}
                    dataKeys={[
                      { key: 'cumulative', name: 'Cumulative Savings', color: 'hsl(150, 45%, 35%)' },
                      { key: 'invested', name: 'If Invested @ 8%', color: 'hsl(43, 74%, 49%)' },
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
    </div>
  );
};

export default RetirementTaxCalculator;
