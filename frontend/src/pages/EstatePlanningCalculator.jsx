import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Users, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

// SA Estate Duty rates (unchanged for 2026/27)
const ESTATE_DUTY_THRESHOLD = 3500000; // First R3.5M exempt
const ESTATE_DUTY_RATE_1 = 0.20; // 20% on first R30M above threshold
const ESTATE_DUTY_RATE_2 = 0.25; // 25% on amounts above R30M

// CGT on death exclusions (2026/27)
const CGT_DEATH_EXCLUSION = 440000; // R440,000 exclusion on death (was R300,000)
const CGT_PRIMARY_RESIDENCE_EXCLUSION = 3000000; // R3m (was R2m)
const CGT_INCLUSION_RATE = 0.40; // 40% for individuals

export const EstatePlanningCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [inputs, setInputs] = useState({
    // Assets
    primaryResidence: 0,
    otherProperties: 0,
    investments: 0,
    retirement: 0,
    businessInterests: 0,
    vehicles: 0,
    personalEffects: 0,
    cashAndBanking: 0,
    lifeInsurance: 0,
    otherAssets: 0,
    
    // Liabilities
    homeLoan: 0,
    otherLoans: 0,
    
    // Beneficiaries
    spouseInheritance: 50,
    childrenInheritance: 40,
    charityInheritance: 10,
    
    // Planning
    hasWill: false,
    hasLivingWill: false,
    hasTrust: false,
    spouseRollover: false,
  });

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    const {
      primaryResidence, otherProperties, investments, retirement,
      businessInterests, vehicles, personalEffects, cashAndBanking,
      lifeInsurance, otherAssets, homeLoan, otherLoans,
      spouseInheritance, childrenInheritance, charityInheritance,
      spouseRollover
    } = inputs;

    // Calculate gross estate
    const grossEstate = primaryResidence + otherProperties + investments + 
                       retirement + businessInterests + vehicles + 
                       personalEffects + cashAndBanking + lifeInsurance + otherAssets;
    
    // Calculate liabilities
    const totalLiabilities = homeLoan + otherLoans;
    
    // Net estate before deductions
    const netEstate = grossEstate - totalLiabilities;
    
    // Spouse rollover (Section 4(q) deduction)
    const spouseDeduction = spouseRollover ? (netEstate * spouseInheritance / 100) : 0;
    
    // Dutiable estate
    const dutiableEstate = Math.max(0, netEstate - spouseDeduction - ESTATE_DUTY_THRESHOLD);
    
    // Calculate estate duty
    let estateDuty = 0;
    if (dutiableEstate > 0) {
      const firstTier = Math.min(dutiableEstate, 30000000);
      const secondTier = Math.max(0, dutiableEstate - 30000000);
      estateDuty = (firstTier * ESTATE_DUTY_RATE_1) + (secondTier * ESTATE_DUTY_RATE_2);
    }
    
    // Executor fees (typically 3.5% + VAT on gross estate, max)
    const executorFees = grossEstate * 0.035 * 1.15;
    
    // Other costs estimate (conveyancing, valuations, etc.)
    const otherCosts = grossEstate * 0.01;
    
    // Total estate costs
    const totalCosts = estateDuty + executorFees + otherCosts;
    
    // Amount available for distribution
    const distributableEstate = netEstate - totalCosts;
    
    // Beneficiary distributions
    const spouseAmount = distributableEstate * spouseInheritance / 100;
    const childrenAmount = distributableEstate * childrenInheritance / 100;
    const charityAmount = distributableEstate * charityInheritance / 100;
    
    // Liquidity analysis
    const liquidAssets = cashAndBanking + investments * 0.9 + lifeInsurance;
    const liquidityShortfall = Math.max(0, totalCosts - liquidAssets);
    const hasLiquidityIssue = liquidityShortfall > 0;

    // Asset breakdown for chart
    const assetBreakdown = [
      { name: 'Primary Residence', value: primaryResidence, color: 'hsl(43, 74%, 49%)' },
      { name: 'Other Properties', value: otherProperties, color: 'hsl(150, 45%, 35%)' },
      { name: 'Investments', value: investments, color: 'hsl(215, 50%, 35%)' },
      { name: 'Retirement', value: retirement, color: 'hsl(180, 45%, 40%)' },
      { name: 'Life Insurance', value: lifeInsurance, color: 'hsl(280, 45%, 45%)' },
      { name: 'Other', value: businessInterests + vehicles + personalEffects + cashAndBanking + otherAssets, color: 'hsl(30, 60%, 50%)' },
    ].filter(a => a.value > 0);

    const distributionBreakdown = [
      { name: 'Spouse', value: spouseAmount, color: 'hsl(43, 74%, 49%)' },
      { name: 'Children', value: childrenAmount, color: 'hsl(150, 45%, 35%)' },
      { name: 'Charity', value: charityAmount, color: 'hsl(215, 50%, 35%)' },
    ].filter(d => d.value > 0);

    const costBreakdown = [
      { name: 'Estate Duty', value: estateDuty, color: 'hsl(0, 60%, 50%)' },
      { name: 'Executor Fees', value: executorFees, color: 'hsl(43, 74%, 49%)' },
      { name: 'Other Costs', value: otherCosts, color: 'hsl(215, 50%, 35%)' },
    ];

    return {
      grossEstate,
      totalLiabilities,
      netEstate,
      spouseDeduction,
      dutiableEstate,
      estateDuty,
      executorFees,
      otherCosts,
      totalCosts,
      distributableEstate,
      spouseAmount,
      childrenAmount,
      charityAmount,
      liquidAssets,
      liquidityShortfall,
      hasLiquidityIssue,
      assetBreakdown,
      distributionBreakdown,
      costBreakdown,
      effectiveDutyRate: netEstate > 0 ? (estateDuty / netEstate * 100).toFixed(2) : 0,
    };
  }, [inputs]);

  const printInputs = [
    { label: 'Gross Estate Value', value: formatCurrency(results.grossEstate) },
    { label: 'Total Liabilities', value: formatCurrency(results.totalLiabilities) },
    { label: 'Net Estate', value: formatCurrency(results.netEstate) },
    { label: 'Spouse Inheritance', value: `${inputs.spouseInheritance}%` },
    { label: 'Children Inheritance', value: `${inputs.childrenInheritance}%` },
  ];

  const printResults = [
    { label: 'Estate Duty Payable', value: formatCurrency(results.estateDuty) },
    { label: 'Executor Fees', value: formatCurrency(results.executorFees) },
    { label: 'Total Estate Costs', value: formatCurrency(results.totalCosts) },
    { label: 'Distributable Estate', value: formatCurrency(results.distributableEstate) },
    { label: 'Liquidity Status', value: results.hasLiquidityIssue ? `Shortfall: ${formatCurrency(results.liquidityShortfall)}` : 'Adequate' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Estate Planning Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate estate duty, costs, and beneficiary distributions
          </p>
        </div>
        <PrintReport
          title="Estate Planning Analysis"
          calculatorType="estate"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <Disclaimer />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Cards */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorCard
            title="Assets"
            description="Estate asset values"
            icon={Building}
          >
            <div className="space-y-4">
              <InputField
                label="Primary Residence"
                id="primaryResidence"
                value={inputs.primaryResidence}
                onChange={(val) => updateInput('primaryResidence', val)}
                prefix={symbol}
                min={0}
                step={100000}
              />
              <InputField
                label="Other Properties"
                id="otherProperties"
                value={inputs.otherProperties}
                onChange={(val) => updateInput('otherProperties', val)}
                prefix={symbol}
                min={0}
                step={100000}
              />
              <InputField
                label="Investments"
                id="investments"
                value={inputs.investments}
                onChange={(val) => updateInput('investments', val)}
                prefix={symbol}
                min={0}
                step={50000}
              />
              <InputField
                label="Retirement Funds"
                id="retirement"
                value={inputs.retirement}
                onChange={(val) => updateInput('retirement', val)}
                prefix={symbol}
                min={0}
                step={50000}
              />
              <InputField
                label="Life Insurance"
                id="lifeInsurance"
                value={inputs.lifeInsurance}
                onChange={(val) => updateInput('lifeInsurance', val)}
                prefix={symbol}
                min={0}
                step={100000}
              />
              <InputField
                label="Cash & Banking"
                id="cashAndBanking"
                value={inputs.cashAndBanking}
                onChange={(val) => updateInput('cashAndBanking', val)}
                prefix={symbol}
                min={0}
                step={50000}
              />
              <InputField
                label="Business Interests"
                id="businessInterests"
                value={inputs.businessInterests}
                onChange={(val) => updateInput('businessInterests', val)}
                prefix={symbol}
                min={0}
                step={50000}
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Liabilities"
            description="Outstanding debts"
            icon={ScrollText}
          >
            <div className="space-y-4">
              <InputField
                label="Home Loan"
                id="homeLoan"
                value={inputs.homeLoan}
                onChange={(val) => updateInput('homeLoan', val)}
                prefix={symbol}
                min={0}
                step={50000}
              />
              <InputField
                label="Other Loans"
                id="otherLoans"
                value={inputs.otherLoans}
                onChange={(val) => updateInput('otherLoans', val)}
                prefix={symbol}
                min={0}
                step={10000}
              />
            </div>
          </CalculatorCard>

          <CalculatorCard
            title="Beneficiaries"
            description="Inheritance distribution"
            icon={Users}
          >
            <div className="space-y-4">
              <SliderField
                label="Spouse"
                id="spouseInheritance"
                value={inputs.spouseInheritance}
                onChange={(val) => updateInput('spouseInheritance', val)}
                min={0}
                max={100}
                step={5}
                suffix="%"
              />
              <SliderField
                label="Children"
                id="childrenInheritance"
                value={inputs.childrenInheritance}
                onChange={(val) => updateInput('childrenInheritance', val)}
                min={0}
                max={100}
                step={5}
                suffix="%"
              />
              <SliderField
                label="Charity"
                id="charityInheritance"
                value={inputs.charityInheritance}
                onChange={(val) => updateInput('charityInheritance', val)}
                min={0}
                max={100}
                step={5}
                suffix="%"
              />
              
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Spouse Rollover</label>
                  <Button
                    variant={inputs.spouseRollover ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => updateInput('spouseRollover', !inputs.spouseRollover)}
                  >
                    {inputs.spouseRollover ? 'Yes' : 'No'}
                  </Button>
                </div>
              </div>
            </div>
          </CalculatorCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Liquidity Warning */}
          {results.hasLiquidityIssue && (
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Liquidity Shortfall</h4>
                    <p className="text-sm text-muted-foreground">
                      The estate may not have enough liquid assets to cover costs.
                      Shortfall: {formatCurrency(results.liquidityShortfall)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <ResultDisplay
                    label="Net Estate Value"
                    value={results.netEstate}
                    prefix={symbol}
                    size="xl"
                    variant="premium"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-forest/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-forest/10 to-gold/5 p-6">
                  <ResultDisplay
                    label="Distributable to Heirs"
                    value={results.distributableEstate}
                    prefix={symbol}
                    size="xl"
                    variant="success"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Summary */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Estate Duty"
              value={results.estateDuty}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Executor Fees"
              value={results.executorFees}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Total Costs"
              value={results.totalCosts}
              prefix={symbol}
              variant="premium"
            />
            <ResultDisplay
              label="Effective Duty Rate"
              value={results.effectiveDutyRate}
              prefix=""
              suffix="%"
              variant="muted"
            />
          </ResultGrid>

          {/* Beneficiary Amounts */}
          <ResultGrid columns={3}>
            <ResultDisplay
              label="Spouse Receives"
              value={results.spouseAmount}
              prefix={symbol}
              variant="success"
            />
            <ResultDisplay
              label="Children Receive"
              value={results.childrenAmount}
              prefix={symbol}
              variant="success"
            />
            <ResultDisplay
              label="Charity Receives"
              value={results.charityAmount}
              prefix={symbol}
              variant="success"
            />
          </ResultGrid>

          {/* Charts */}
          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="assets">Asset Breakdown</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="costs">Estate Costs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Estate Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.assetBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="distribution" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Beneficiary Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.distributionBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="costs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Estate Costs Breakdown</CardTitle>
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
