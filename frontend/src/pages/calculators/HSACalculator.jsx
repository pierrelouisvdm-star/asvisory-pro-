import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ShieldPlus, TrendingUp, DollarSign, Calendar, Target, 
  Info, ArrowRight, Heart, CheckCircle2
} from 'lucide-react';
import { US_RETIREMENT_LIMITS_2024 } from '@/data/usTaxData';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const HSACalculator = () => {
  const [annualContribution, setAnnualContribution] = useState(3000);
  const [coverageType, setCoverageType] = useState('individual');
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentBalance, setCurrentBalance] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(6);
  const [annualMedicalExpenses, setAnnualMedicalExpenses] = useState(2000);
  const [payMedicalFromHSA, setPayMedicalFromHSA] = useState(false);
  const [marginalTaxRate, setMarginalTaxRate] = useState(22);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [isOver55, setIsOver55] = useState(false);

  const limits = US_RETIREMENT_LIMITS_2024.hsa;
  const maxContribution = coverageType === 'family' 
    ? limits.family + (isOver55 ? limits.catchUp55Plus : 0)
    : limits.individual + (isOver55 ? limits.catchUp55Plus : 0);

  const calculations = useMemo(() => {
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const annualReturn = expectedReturn / 100;
    const effectiveContribution = payMedicalFromHSA 
      ? Math.max(0, annualContribution - annualMedicalExpenses)
      : annualContribution;
    
    // Tax savings calculation (Triple Tax Advantage)
    const combinedTaxRate = (marginalTaxRate + stateTaxRate + 7.65) / 100; // FICA included
    const annualTaxSavings = annualContribution * combinedTaxRate;
    
    // Future value calculation
    let futureValue = currentBalance;
    let totalContributions = 0;
    let totalTaxSavings = 0;
    let totalMedicalPaid = 0;
    const yearlyBreakdown = [];
    
    for (let year = 1; year <= yearsToRetirement; year++) {
      const yearContribution = effectiveContribution;
      const yearMedical = payMedicalFromHSA ? annualMedicalExpenses : 0;
      
      futureValue = (futureValue + yearContribution) * (1 + annualReturn);
      totalContributions += annualContribution;
      totalTaxSavings += annualTaxSavings;
      totalMedicalPaid += yearMedical;
      
      yearlyBreakdown.push({
        year,
        age: currentAge + year,
        balance: futureValue,
        contributions: totalContributions,
        growth: futureValue - currentBalance - (totalContributions - totalMedicalPaid),
      });
    }
    
    const totalGrowth = futureValue - currentBalance - (totalContributions - totalMedicalPaid);
    
    // Post-65 benefits (can use for any expense without penalty)
    const monthlyRetirementIncome = (futureValue * 0.04) / 12;
    
    // Estimated healthcare costs in retirement
    const estimatedRetirementHealthcareCosts = 315000; // Fidelity estimate for couple
    const healthcareCoverage = (futureValue / estimatedRetirementHealthcareCosts) * 100;
    
    return {
      yearsToRetirement,
      effectiveContribution,
      annualTaxSavings,
      futureValue,
      totalContributions,
      totalTaxSavings,
      totalGrowth,
      totalMedicalPaid,
      monthlyRetirementIncome,
      healthcareCoverage: Math.min(healthcareCoverage, 100),
      estimatedRetirementHealthcareCosts,
      combinedTaxRate: combinedTaxRate * 100,
      yearlyBreakdown,
    };
  }, [currentAge, retirementAge, annualContribution, currentBalance, expectedReturn, 
      annualMedicalExpenses, payMedicalFromHSA, marginalTaxRate, stateTaxRate, isOver55]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-teal-500/10 rounded-xl">
              <ShieldPlus className="h-8 w-8 text-teal-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              HSA Calculator
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Health Savings Accounts offer the ultimate triple tax advantage: 
            tax-deductible contributions, tax-free growth, and tax-free withdrawals for medical expenses.
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20">
              Individual: ${limits.individual.toLocaleString()}
            </Badge>
            <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20">
              Family: ${limits.family.toLocaleString()}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentAge">Current Age</Label>
                    <Input
                      id="currentAge"
                      type="number"
                      value={currentAge}
                      onChange={(e) => setCurrentAge(Number(e.target.value))}
                      min={18}
                      max={64}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="retirementAge">Target Age</Label>
                    <Input
                      id="retirementAge"
                      type="number"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(Number(e.target.value))}
                      min={55}
                      max={80}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverageType">Coverage Type</Label>
                  <Select value={coverageType} onValueChange={setCoverageType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual (Self-only)</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="over55">Age 55+ (Catch-up)</Label>
                    <p className="text-xs text-muted-foreground">+$1,000 contribution limit</p>
                  </div>
                  <Switch
                    id="over55"
                    checked={isOver55}
                    onCheckedChange={setIsOver55}
                  />
                </div>

                <div>
                  <Label htmlFor="marginalRate">Federal Tax Bracket</Label>
                  <Select value={marginalTaxRate.toString()} onValueChange={(v) => setMarginalTaxRate(Number(v))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="22">22%</SelectItem>
                      <SelectItem value="24">24%</SelectItem>
                      <SelectItem value="32">32%</SelectItem>
                      <SelectItem value="35">35%</SelectItem>
                      <SelectItem value="37">37%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>State Tax Rate</Label>
                    <span className="text-sm font-medium">{stateTaxRate}%</span>
                  </div>
                  <Slider
                    value={[stateTaxRate]}
                    onValueChange={(v) => setStateTaxRate(v[0])}
                    min={0}
                    max={13}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Contributions & Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Annual Contribution</Label>
                    <span className="text-sm font-medium">{formatCurrency(annualContribution)}</span>
                  </div>
                  <Slider
                    value={[annualContribution]}
                    onValueChange={(v) => setAnnualContribution(v[0])}
                    min={0}
                    max={maxContribution}
                    step={100}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {formatCurrency(maxContribution)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="currentBalance">Current HSA Balance</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="currentBalance"
                      type="number"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="medicalExpenses">Annual Medical Expenses</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="medicalExpenses"
                      type="number"
                      value={annualMedicalExpenses}
                      onChange={(e) => setAnnualMedicalExpenses(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="payFromHSA">Pay Medical from HSA</Label>
                    <p className="text-xs text-muted-foreground">Reduces growth potential</p>
                  </div>
                  <Switch
                    id="payFromHSA"
                    checked={payMedicalFromHSA}
                    onCheckedChange={setPayMedicalFromHSA}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Expected Return</Label>
                    <span className="text-sm font-medium">{expectedReturn}%</span>
                  </div>
                  <Slider
                    value={[expectedReturn]}
                    onValueChange={(v) => setExpectedReturn(v[0])}
                    min={3}
                    max={10}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">At Age {retirementAge}</p>
                  <p className="text-2xl font-bold text-teal-500">
                    {formatCurrency(calculations.futureValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tax-free for medical
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Annual Tax Savings</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(calculations.annualTaxSavings)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.combinedTaxRate.toFixed(1)}% effective rate
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Tax Savings</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(calculations.totalTaxSavings)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Over {calculations.yearsToRetirement} years
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Healthcare Coverage</p>
                  <p className="text-2xl font-bold text-rose-500">
                    {calculations.healthcareCoverage.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of retirement costs
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Triple Tax Advantage */}
            <Card className="bg-gradient-to-br from-teal-500/5 to-teal-600/5 border-teal-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500" />
                  Triple Tax Advantage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-teal-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 font-bold">1</div>
                      <h4 className="font-semibold text-foreground">Tax-Deductible</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contributions reduce your taxable income. You save {formatCurrency(calculations.annualTaxSavings)} per year in taxes.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-background/50 rounded-lg border border-teal-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 font-bold">2</div>
                      <h4 className="font-semibold text-foreground">Tax-Free Growth</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Investment gains are never taxed. Your {formatCurrency(calculations.totalGrowth)} in growth is 100% yours.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-background/50 rounded-lg border border-teal-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 font-bold">3</div>
                      <h4 className="font-semibold text-foreground">Tax-Free Withdrawals</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Qualified medical expenses are tax-free. After 65, use for anything (income tax only).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-500" />
                  Growth Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-8 rounded-full overflow-hidden bg-muted flex">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(currentBalance / calculations.futureValue) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-teal-500"
                          style={{ width: `${((calculations.totalContributions - calculations.totalMedicalPaid) / calculations.futureValue) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-amber-500"
                          style={{ width: `${(calculations.totalGrowth / calculations.futureValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Starting</p>
                        <p className="text-sm font-medium">{formatCurrency(currentBalance)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-teal-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Net Contributions</p>
                        <p className="text-sm font-medium">{formatCurrency(calculations.totalContributions - calculations.totalMedicalPaid)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tax-Free Growth</p>
                        <p className="text-sm font-medium">{formatCurrency(calculations.totalGrowth)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">HSA Pro Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Max it out</strong> - The HSA is the most tax-advantaged account available. Contribute the max if you can.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Invest it</strong> - Don't leave HSA funds in cash. Invest for long-term growth.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Save receipts</strong> - Pay medical expenses out-of-pocket now, reimburse yourself tax-free later (even decades later).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Retirement backup</strong> - After 65, HSA becomes like a Traditional IRA for non-medical expenses.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Disclaimer 
          text="This calculator provides estimates based on the assumptions entered. HSA eligibility requires enrollment in a High Deductible Health Plan (HDHP). Consult a tax professional for personalized advice."
        />
      </div>
    </div>
  );
};

export default HSACalculator;
