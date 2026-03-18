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
import { Receipt, Calculator, Info, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

// South African Tax Brackets 2026/2027 (Effective 1 March 2026)
const SA_TAX_BRACKETS = [
  { min: 0, max: 245100, rate: 18, base: 0 },
  { min: 245101, max: 383100, rate: 26, base: 44118 },
  { min: 383101, max: 530200, rate: 31, base: 79998 },
  { min: 530201, max: 695800, rate: 36, base: 125599 },
  { min: 695801, max: 887000, rate: 39, base: 185215 },
  { min: 887001, max: 1878600, rate: 41, base: 259783 },
  { min: 1878601, max: Infinity, rate: 45, base: 666339 },
];

// Tax Rebates 2026/2027
const TAX_REBATES = {
  primary: 17820,      // All taxpayers
  secondary: 9765,     // 65 and older
  tertiary: 3249,      // 75 and older
};

// Medical Aid Credits 2026/2027
const MEDICAL_CREDITS = {
  main: 376,           // Main member per month
  firstDependent: 376, // First dependent per month
  additional: 254,     // Additional dependents per month
};

const ageGroupOptions = [
  { value: 'under65', label: 'Under 65' },
  { value: '65to74', label: '65 to 74' },
  { value: '75plus', label: '75 and older' },
];

export const TaxCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [inputs, setInputs] = useState({
    grossIncome: 0,
    ageGroup: 'under65',
    medicalAidMembers: 0,
    medicalAidDependents: 0,
    retirementContributions: 0,
    donationsSection18A: 0,
    travelAllowance: 0,
    otherDeductions: 0,
    capitalGains: 0,
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    const { grossIncome, ageGroup, medicalAidMembers, medicalAidDependents, 
            retirementContributions, donationsSection18A, travelAllowance, 
            otherDeductions, capitalGains } = inputs;

    // Calculate retirement deduction (max 27.5% of income, capped at R430,000)
    const maxRetirementDeduction = Math.min(grossIncome * 0.275, 430000);
    const retirementDeduction = Math.min(retirementContributions, maxRetirementDeduction);

    // Donations deduction (max 10% of taxable income)
    const maxDonations = grossIncome * 0.1;
    const donationsDeduction = Math.min(donationsSection18A, maxDonations);

    // Calculate taxable income
    const totalDeductions = retirementDeduction + donationsDeduction + travelAllowance + otherDeductions;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Calculate capital gains tax (40% inclusion rate, first R50,000 exempt - 2026/27)
    const taxableCapitalGains = Math.max(0, (capitalGains - 50000) * 0.4);
    const totalTaxableIncome = taxableIncome + taxableCapitalGains;

    // Calculate tax using brackets
    let tax = 0;
    for (const bracket of SA_TAX_BRACKETS) {
      if (totalTaxableIncome > bracket.min) {
        if (totalTaxableIncome <= bracket.max) {
          tax = bracket.base + (totalTaxableIncome - bracket.min) * (bracket.rate / 100);
          break;
        }
      }
    }

    // Apply rebates
    let totalRebates = TAX_REBATES.primary;
    if (ageGroup === '65to74') totalRebates += TAX_REBATES.secondary;
    if (ageGroup === '75plus') totalRebates += TAX_REBATES.secondary + TAX_REBATES.tertiary;

    // Medical aid credits
    const medicalCredits = (MEDICAL_CREDITS.main * medicalAidMembers + 
                          MEDICAL_CREDITS.firstDependent * Math.min(1, medicalAidDependents) +
                          MEDICAL_CREDITS.additional * Math.max(0, medicalAidDependents - 1)) * 12;

    // Final tax calculation
    const taxBeforeCredits = Math.max(0, tax - totalRebates);
    const finalTax = Math.max(0, taxBeforeCredits - medicalCredits);
    
    // Effective tax rate
    const effectiveRate = grossIncome > 0 ? (finalTax / grossIncome * 100) : 0;
    const marginalRate = SA_TAX_BRACKETS.find(b => totalTaxableIncome >= b.min && totalTaxableIncome <= b.max)?.rate || 45;

    // Monthly breakdown
    const monthlyGross = grossIncome / 12;
    const monthlyTax = finalTax / 12;
    const monthlyNet = monthlyGross - monthlyTax;

    // Tax breakdown for chart
    const taxBreakdown = [
      { name: 'Net Income', value: grossIncome - finalTax, color: 'hsl(150, 45%, 35%)' },
      { name: 'Income Tax', value: finalTax, color: 'hsl(43, 74%, 49%)' },
    ];

    const deductionsBreakdown = [
      { name: 'Retirement', value: retirementDeduction, color: 'hsl(43, 74%, 49%)' },
      { name: 'Donations', value: donationsDeduction, color: 'hsl(150, 45%, 35%)' },
      { name: 'Travel', value: travelAllowance, color: 'hsl(215, 50%, 35%)' },
      { name: 'Other', value: otherDeductions, color: 'hsl(180, 45%, 40%)' },
    ].filter(d => d.value > 0);

    return {
      taxableIncome,
      totalTaxableIncome,
      totalDeductions,
      taxBeforeCredits: tax,
      totalRebates,
      medicalCredits,
      finalTax,
      effectiveRate: effectiveRate.toFixed(2),
      marginalRate,
      monthlyGross,
      monthlyTax,
      monthlyNet,
      annualNet: grossIncome - finalTax,
      taxBreakdown,
      deductionsBreakdown,
    };
  }, [inputs]);

  const printInputs = [
    { label: 'Gross Annual Income', value: formatCurrency(inputs.grossIncome) },
    { label: 'Age Group', value: ageGroupOptions.find(o => o.value === inputs.ageGroup)?.label },
    { label: 'Retirement Contributions', value: formatCurrency(inputs.retirementContributions) },
    { label: 'Section 18A Donations', value: formatCurrency(inputs.donationsSection18A) },
    { label: 'Medical Aid Members', value: inputs.medicalAidMembers.toString() },
  ];

  const printResults = [
    { label: 'Taxable Income', value: formatCurrency(results.taxableIncome) },
    { label: 'Total Tax Payable', value: formatCurrency(results.finalTax) },
    { label: 'Effective Tax Rate', value: `${results.effectiveRate}%` },
    { label: 'Monthly Net Income', value: formatCurrency(results.monthlyNet) },
    { label: 'Annual Net Income', value: formatCurrency(results.annualNet) },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Tax Calculator
          </h1>
          <p className="text-muted-foreground">
            South African income tax calculation (2026/2027 tax year)
          </p>
        </div>
        <PrintReport
          title="Tax Analysis Report"
          calculatorType="tax"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <Disclaimer />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Income Details"
            description="Your annual income information"
            icon={Receipt}
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
              />
              
              <SelectField
                label="Age Group"
                id="ageGroup"
                value={inputs.ageGroup}
                onChange={(val) => updateInput('ageGroup', val)}
                options={ageGroupOptions}
                tooltip="Determines applicable tax rebates"
              />
              
              <InputField
                label="Capital Gains"
                id="capitalGains"
                value={inputs.capitalGains}
                onChange={(val) => updateInput('capitalGains', val)}
                prefix={symbol}
                min={0}
                step={10000}
                tooltip="First R50,000 is exempt (2026/27), 40% inclusion rate"
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Deductions"
            description="Tax-deductible expenses"
            icon={TrendingDown}
          >
            <div className="space-y-5">
              <InputField
                label="Retirement Contributions"
                id="retirementContributions"
                value={inputs.retirementContributions}
                onChange={(val) => updateInput('retirementContributions', val)}
                prefix={symbol}
                min={0}
                step={5000}
                tooltip="Pension, provident, RA contributions (max 27.5%)"
              />
              
              <InputField
                label="Section 18A Donations"
                id="donationsSection18A"
                value={inputs.donationsSection18A}
                onChange={(val) => updateInput('donationsSection18A', val)}
                prefix={symbol}
                min={0}
                step={1000}
                tooltip="Donations to approved PBOs (max 10%)"
              />
              
              <InputField
                label="Travel Allowance"
                id="travelAllowance"
                value={inputs.travelAllowance}
                onChange={(val) => updateInput('travelAllowance', val)}
                prefix={symbol}
                min={0}
                step={5000}
              />
              
              <InputField
                label="Other Deductions"
                id="otherDeductions"
                value={inputs.otherDeductions}
                onChange={(val) => updateInput('otherDeductions', val)}
                prefix={symbol}
                min={0}
                step={1000}
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Medical Aid"
            description="Medical tax credits"
            icon={Info}
          >
            <div className="space-y-5">
              <SliderField
                label="Main Members"
                id="medicalAidMembers"
                value={inputs.medicalAidMembers}
                onChange={(val) => updateInput('medicalAidMembers', val)}
                min={0}
                max={5}
                step={1}
                suffix=""
              />
              
              <SliderField
                label="Dependents"
                id="medicalAidDependents"
                value={inputs.medicalAidDependents}
                onChange={(val) => updateInput('medicalAidDependents', val)}
                min={0}
                max={10}
                step={1}
                suffix=""
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
                  <ResultDisplay
                    label="Total Tax Payable"
                    value={results.finalTax}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-success/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-success/10 to-gold/5 p-6">
                  <ResultDisplay
                    label="Annual Net Income"
                    value={results.annualNet}
                    prefix={symbol}
                    size="xl"
                    variant="success"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Rates */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Effective Tax Rate"
              value={results.effectiveRate}
              prefix=""
              suffix="%"
              variant="premium"
            />
            <ResultDisplay
              label="Marginal Tax Rate"
              value={results.marginalRate}
              prefix=""
              suffix="%"
              variant="muted"
            />
            <ResultDisplay
              label="Monthly Net"
              value={results.monthlyNet}
              prefix={symbol}
              variant="success"
            />
            <ResultDisplay
              label="Monthly Tax"
              value={results.monthlyTax}
              prefix={symbol}
              variant="muted"
            />
          </ResultGrid>

          {/* Deductions & Credits Summary */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Total Deductions"
              value={results.totalDeductions}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Tax Rebates"
              value={results.totalRebates}
              prefix={symbol}
              variant="success"
            />
            <ResultDisplay
              label="Medical Credits"
              value={results.medicalCredits}
              prefix={symbol}
              variant="success"
            />
            <ResultDisplay
              label="Taxable Income"
              value={results.taxableIncome}
              prefix={symbol}
              variant="muted"
            />
          </ResultGrid>

          {/* Charts */}
          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="breakdown">Income Breakdown</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="brackets">Tax Brackets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="breakdown" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Net Income vs Tax</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.taxBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="deductions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Deductions Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.deductionsBreakdown.length > 0 ? (
                    <BreakdownPieChart
                      data={results.deductionsBreakdown}
                      height={300}
                      prefix={symbol}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No deductions entered
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="brackets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">SA Tax Brackets 2026/2027</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 px-4 text-left font-semibold">Taxable Income</th>
                          <th className="py-3 px-4 text-right font-semibold">Rate</th>
                          <th className="py-3 px-4 text-right font-semibold">Tax on Bracket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SA_TAX_BRACKETS.map((bracket, index) => (
                          <tr 
                            key={index} 
                            className={`border-b border-border/50 ${
                              results.taxableIncome >= bracket.min && results.taxableIncome <= bracket.max
                                ? 'bg-gold/10'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              {formatCurrency(bracket.min)} - {bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">{bracket.rate}%</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(bracket.base)} + {bracket.rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
