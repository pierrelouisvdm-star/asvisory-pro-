import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, DollarSign, Building2, TrendingUp, PieChart, 
  FileText, Info, CheckCircle2, MapPin, ChevronDown, ChevronUp, TrendingDown, Sparkles
} from 'lucide-react';
import { 
  US_FEDERAL_TAX_BRACKETS_2024, 
  US_STANDARD_DEDUCTIONS_2024,
  US_STATE_TAX_DATA,
  calculateFederalTax,
  calculateStateTax,
  getStateList
} from '@/data/usTaxData';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const TaxCalculatorUS = () => {
  const [income, setIncome] = useState(75000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [selectedState, setSelectedState] = useState('CA');
  const [show2025Changes, setShow2025Changes] = useState(false);
  const [useStandardDeduction, setUseStandardDeduction] = useState(true);
  const [itemizedDeductions, setItemizedDeductions] = useState(0);
  const [retirement401k, setRetirement401k] = useState(0);
  const [hsaContribution, setHsaContribution] = useState(0);

  const stateList = useMemo(() => getStateList(), []);

  const calculations = useMemo(() => {
    // Pre-tax deductions
    const preTaxDeductions = retirement401k + hsaContribution;
    const adjustedGrossIncome = Math.max(0, income - preTaxDeductions);
    
    // Calculate deduction to use
    const standardDed = US_STANDARD_DEDUCTIONS_2024[filingStatus];
    const deductionUsed = useStandardDeduction ? standardDed : itemizedDeductions;
    
    // Taxable income
    const taxableIncome = Math.max(0, adjustedGrossIncome - deductionUsed);
    
    // Federal tax calculation
    const brackets = US_FEDERAL_TAX_BRACKETS_2024[filingStatus];
    let federalTax = 0;
    let remainingIncome = taxableIncome;
    const bracketBreakdown = [];
    
    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      const taxInBracket = taxableInBracket * bracket.rate;
      federalTax += taxInBracket;
      
      if (taxableInBracket > 0) {
        bracketBreakdown.push({
          rate: bracket.rate * 100,
          amount: taxableInBracket,
          tax: taxInBracket,
        });
      }
      
      remainingIncome -= taxableInBracket;
    }
    
    // State tax calculation
    const stateResult = calculateStateTax(taxableIncome, selectedState, filingStatus);
    
    // FICA taxes (Social Security + Medicare)
    const socialSecurityTax = Math.min(income, 176100) * 0.062;
    const medicareTax = income * 0.0145;
    const additionalMedicare = income > 200000 ? (income - 200000) * 0.009 : 0;
    const ficaTax = socialSecurityTax + medicareTax + additionalMedicare;
    
    // Total tax
    const totalTax = federalTax + stateResult.stateTax + ficaTax;
    
    // Take-home pay
    const annualTakeHome = income - totalTax;
    const monthlyTakeHome = annualTakeHome / 12;
    const biweeklyTakeHome = annualTakeHome / 26;
    
    return {
      grossIncome: income,
      preTaxDeductions,
      adjustedGrossIncome,
      deductionUsed,
      taxableIncome,
      federalTax,
      stateTax: stateResult.stateTax,
      stateName: stateResult.stateName,
      socialSecurityTax,
      medicareTax,
      additionalMedicare,
      ficaTax,
      totalTax,
      annualTakeHome,
      monthlyTakeHome,
      biweeklyTakeHome,
      effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
      federalEffectiveRate: income > 0 ? (federalTax / income) * 100 : 0,
      bracketBreakdown,
      marginalRate: bracketBreakdown.length > 0 ? bracketBreakdown[bracketBreakdown.length - 1].rate : 0,
    };
  }, [income, filingStatus, selectedState, useStandardDeduction, itemizedDeductions, retirement401k, hsaContribution]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value) => `${value.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              US Tax Calculator
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calculate your federal and state income taxes for the 2025 tax year. 
            Includes all 50 states, FICA taxes, and retirement contribution deductions.
          </p>
          <Badge className="mt-3 bg-blue-500/10 text-blue-500 border-blue-500/20">
            2025 Tax Year
          </Badge>

          {/* What Changed in 2025 */}
          <div className="mt-4 max-w-2xl mx-auto">
            <button
              onClick={() => setShow2025Changes(s => !s)}
              className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors mx-auto"
              data-testid="what-changed-toggle"
            >
              <Sparkles className="h-3.5 w-3.5" />
              What changed for 2025?
              {show2025Changes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {show2025Changes && (
              <div className="mt-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-left animate-fade-in" data-testid="what-changed-panel">
                <p className="text-xs font-semibold text-amber-500 mb-3 uppercase tracking-wide">Key 2025 Changes vs 2024 (Rev. Proc. 2024-40)</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Standard Deduction (Single)', change: '+$1,150', detail: '$15,750 (was $14,600)', positive: true },
                    { label: 'Standard Deduction (MFJ)', change: '+$2,300', detail: '$31,500 (was $29,200)', positive: true },
                    { label: 'SS Wage Base', change: '+$7,500', detail: '$176,100 (was $168,600)', positive: false },
                    { label: '401(k) Employee Limit', change: '+$500', detail: '$23,500 (was $23,000)', positive: true },
                    { label: 'HSA Individual Limit', change: '+$150', detail: '$4,300 (was $4,150)', positive: true },
                    { label: 'HSA Family Limit', change: '+$250', detail: '$8,550 (was $8,300)', positive: true },
                    { label: '22% Bracket Top (Single)', change: 'Widened', detail: 'Now $103,350 (was $100,525)', positive: true },
                    { label: 'IRMAA Part B Base', change: '+$10.30', detail: '$185/mo (was $174.70)', positive: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
                      <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${item.positive ? 'text-emerald-500' : 'text-red-400'}`}>{item.change}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Wider brackets + higher standard deduction = most Americans will owe slightly <span className="text-emerald-500 font-medium">less tax in 2025</span> on the same income.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Income & Filing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="income">Annual Gross Income</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="income"
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="filingStatus">Filing Status</Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="marriedJoint">Married Filing Jointly</SelectItem>
                      <SelectItem value="marriedSeparate">Married Filing Separately</SelectItem>
                      <SelectItem value="headOfHousehold">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {stateList.map((state) => (
                        <SelectItem key={state.abbr} value={state.abbr}>
                          {state.name} ({state.abbr})
                          {!state.hasStateTax && ' - No Tax'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant={useStandardDeduction ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseStandardDeduction(true)}
                    className="flex-1"
                  >
                    Standard
                  </Button>
                  <Button
                    variant={!useStandardDeduction ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseStandardDeduction(false)}
                    className="flex-1"
                  >
                    Itemized
                  </Button>
                </div>
                
                {useStandardDeduction ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Standard Deduction</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(US_STANDARD_DEDUCTIONS_2024[filingStatus])}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="itemized">Itemized Deductions</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="itemized"
                        type="number"
                        value={itemizedDeductions}
                        onChange={(e) => setItemizedDeductions(Number(e.target.value))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="401k">401(k) Contribution</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="401k"
                      type="number"
                      value={retirement401k}
                      onChange={(e) => setRetirement401k(Math.min(Number(e.target.value), 23500))}
                      className="pl-8"
                      max={23500}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Max: $23,500 (2025)</p>
                </div>

                <div>
                  <Label htmlFor="hsa">HSA Contribution</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="hsa"
                      type="number"
                      value={hsaContribution}
                      onChange={(e) => setHsaContribution(Math.min(Number(e.target.value), 4300))}
                      className="pl-8"
                      max={4300}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Max: $4,300 individual (2025)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Annual Take-Home</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(calculations.annualTakeHome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(calculations.monthlyTakeHome)}/month
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Tax</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(calculations.totalTax)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercent(calculations.effectiveRate)} effective rate
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Marginal Rate</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatPercent(calculations.marginalRate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Federal bracket
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Tax Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList className="mb-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="federal">Federal</TabsTrigger>
                    <TabsTrigger value="state">State</TabsTrigger>
                    <TabsTrigger value="fica">FICA</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Gross Income</span>
                        <span className="font-medium">{formatCurrency(calculations.grossIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Pre-Tax Deductions (401k, HSA)</span>
                        <span className="font-medium text-green-500">-{formatCurrency(calculations.preTaxDeductions)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Adjusted Gross Income (AGI)</span>
                        <span className="font-medium">{formatCurrency(calculations.adjustedGrossIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">{useStandardDeduction ? 'Standard' : 'Itemized'} Deduction</span>
                        <span className="font-medium text-green-500">-{formatCurrency(calculations.deductionUsed)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground font-medium">Taxable Income</span>
                        <span className="font-bold">{formatCurrency(calculations.taxableIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Federal Income Tax</span>
                        <span className="font-medium text-red-500">-{formatCurrency(calculations.federalTax)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">{calculations.stateName} State Tax</span>
                        <span className="font-medium text-red-500">-{formatCurrency(calculations.stateTax)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">FICA (Social Security + Medicare)</span>
                        <span className="font-medium text-red-500">-{formatCurrency(calculations.ficaTax)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-green-500/10 rounded-lg px-3">
                        <span className="font-bold text-foreground">Annual Take-Home Pay</span>
                        <span className="font-bold text-green-500 text-xl">{formatCurrency(calculations.annualTakeHome)}</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="federal" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Federal tax is calculated progressively across tax brackets.
                    </p>
                    <div className="space-y-2">
                      {calculations.bracketBreakdown.map((bracket, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <Badge variant="outline" className="min-w-[60px] justify-center">
                            {bracket.rate}%
                          </Badge>
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(bracket.amount / calculations.taxableIncome) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="text-sm font-medium">{formatCurrency(bracket.tax)}</p>
                            <p className="text-xs text-muted-foreground">on {formatCurrency(bracket.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg mt-4">
                      <span className="font-medium">Total Federal Tax</span>
                      <span className="font-bold text-blue-500">{formatCurrency(calculations.federalTax)}</span>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="state" className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">{calculations.stateName}</p>
                        <p className="text-sm text-muted-foreground">
                          {US_STATE_TAX_DATA[selectedState]?.hasStateTax 
                            ? `${US_STATE_TAX_DATA[selectedState]?.type === 'flat' ? 'Flat' : 'Progressive'} income tax`
                            : 'No state income tax'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {US_STATE_TAX_DATA[selectedState]?.hasStateTax ? (
                      <>
                        {US_STATE_TAX_DATA[selectedState]?.type === 'flat' ? (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Flat Tax Rate</p>
                            <p className="text-2xl font-bold">{(US_STATE_TAX_DATA[selectedState].rate * 100).toFixed(2)}%</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {US_STATE_TAX_DATA[selectedState]?.brackets.map((bracket, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                <span className="text-sm">
                                  {formatCurrency(bracket.min)} - {bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)}
                                </span>
                                <Badge variant="outline">{(bracket.rate * 100).toFixed(2)}%</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg mt-4">
                          <span className="font-medium">State Tax</span>
                          <span className="font-bold text-purple-500">{formatCurrency(calculations.stateTax)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 bg-green-500/10 rounded-lg text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-lg font-medium text-green-500">No State Income Tax!</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {calculations.stateName} is one of 9 states with no state income tax.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="fica" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      FICA taxes fund Social Security and Medicare programs.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Social Security</p>
                            <p className="text-sm text-muted-foreground">6.2% on income up to $176,100 (2025)</p>
                          </div>
                          <span className="font-bold">{formatCurrency(calculations.socialSecurityTax)}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Medicare</p>
                            <p className="text-sm text-muted-foreground">1.45% on all income</p>
                          </div>
                          <span className="font-bold">{formatCurrency(calculations.medicareTax)}</span>
                        </div>
                      </div>
                      {calculations.additionalMedicare > 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Additional Medicare</p>
                              <p className="text-sm text-muted-foreground">0.9% on income over $200,000</p>
                            </div>
                            <span className="font-bold">{formatCurrency(calculations.additionalMedicare)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg mt-4">
                        <span className="font-medium">Total FICA Tax</span>
                        <span className="font-bold text-orange-500">{formatCurrency(calculations.ficaTax)}</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Paycheck Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Paycheck Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Annual</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(calculations.annualTakeHome)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Monthly</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(calculations.monthlyTakeHome)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Bi-Weekly</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(calculations.biweeklyTakeHome)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Disclaimer 
          text="This calculator provides estimates based on 2025 federal and state tax rates (Rev. Proc. 2024-40). Your actual tax liability may differ based on credits, additional income sources, and other factors. Consult a CPA or tax professional for personalized advice."
        />
      </div>
    </div>
  );
};

export default TaxCalculatorUS;
