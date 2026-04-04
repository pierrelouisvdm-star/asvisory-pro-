import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, TrendingUp, DollarSign, Calendar, Target, 
  Info, ArrowRight, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { US_RETIREMENT_LIMITS_2024 } from '@/data/usTaxData';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const RothIRACalculator = () => {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [annualIncome, setAnnualIncome] = useState(85000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [annualContribution, setAnnualContribution] = useState(7000);
  const [currentBalance, setCurrentBalance] = useState(15000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [isOver50, setIsOver50] = useState(false);

  const limits = US_RETIREMENT_LIMITS_2024.rothIRA;
  const maxContribution = isOver50 
    ? limits.annualLimit + limits.catchUp50Plus 
    : limits.annualLimit;

  const calculations = useMemo(() => {
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const annualReturn = expectedReturn / 100;
    
    // Check income eligibility
    const phaseOut = limits.incomePhaseOut[filingStatus] || limits.incomePhaseOut.single;
    let eligibleContribution = annualContribution;
    let eligibilityStatus = 'full';
    
    if (annualIncome >= phaseOut.end) {
      eligibleContribution = 0;
      eligibilityStatus = 'ineligible';
    } else if (annualIncome >= phaseOut.start) {
      // Partial phase-out
      const phaseOutRange = phaseOut.end - phaseOut.start;
      const incomeOverStart = annualIncome - phaseOut.start;
      const reductionPercent = incomeOverStart / phaseOutRange;
      eligibleContribution = Math.round(annualContribution * (1 - reductionPercent));
      eligibilityStatus = 'partial';
    }
    
    // Cap at max contribution
    eligibleContribution = Math.min(eligibleContribution, maxContribution);
    
    // Future value calculation
    let futureValue = currentBalance;
    let totalContributions = 0;
    const yearlyBreakdown = [];
    
    for (let year = 1; year <= yearsToRetirement; year++) {
      futureValue = (futureValue + eligibleContribution) * (1 + annualReturn);
      totalContributions += eligibleContribution;
      
      yearlyBreakdown.push({
        year,
        age: currentAge + year,
        balance: futureValue,
        contributions: totalContributions,
        growth: futureValue - currentBalance - totalContributions,
      });
    }
    
    const totalGrowth = futureValue - currentBalance - totalContributions;
    
    // Tax-free income in retirement (4% rule)
    const monthlyRetirementIncome = (futureValue * 0.04) / 12;
    
    // Tax savings calculation (vs taxable account)
    // Assuming 15% capital gains rate on growth
    const taxSavingsOnGrowth = totalGrowth * 0.15;
    
    return {
      yearsToRetirement,
      eligibleContribution,
      eligibilityStatus,
      phaseOutStart: phaseOut.start,
      phaseOutEnd: phaseOut.end,
      futureValue,
      totalContributions,
      totalGrowth,
      taxSavingsOnGrowth,
      monthlyRetirementIncome,
      yearlyBreakdown,
    };
  }, [currentAge, retirementAge, annualIncome, filingStatus, annualContribution, 
      currentBalance, expectedReturn, isOver50, maxContribution, limits]);

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
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Roth IRA Calculator
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plan your tax-free retirement with a Roth IRA. Contributions are made with 
            after-tax dollars, but qualified withdrawals are completely tax-free.
          </p>
          <Badge className="mt-3 bg-purple-500/10 text-purple-500 border-purple-500/20">
            2024 Limit: ${limits.annualLimit.toLocaleString()} + ${limits.catchUp50Plus.toLocaleString()} catch-up
          </Badge>
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
                      max={70}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="retirementAge">Retirement Age</Label>
                    <Input
                      id="retirementAge"
                      type="number"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(Number(e.target.value))}
                      min={59}
                      max={75}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="income">Annual Income (MAGI)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="income"
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(Number(e.target.value))}
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="over50">Age 50+ (Catch-up)</Label>
                    <p className="text-xs text-muted-foreground">+$1,000 contribution limit</p>
                  </div>
                  <Switch
                    id="over50"
                    checked={isOver50}
                    onCheckedChange={setIsOver50}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Contributions
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
                    step={500}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {formatCurrency(maxContribution)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="currentBalance">Current Roth IRA Balance</Label>
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
                  <div className="flex justify-between mb-2">
                    <Label>Expected Return</Label>
                    <span className="text-sm font-medium">{expectedReturn}%</span>
                  </div>
                  <Slider
                    value={[expectedReturn]}
                    onValueChange={(v) => setExpectedReturn(v[0])}
                    min={3}
                    max={12}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Status */}
            <Card className={`border-2 ${
              calculations.eligibilityStatus === 'full' 
                ? 'bg-green-500/10 border-green-500/30' 
                : calculations.eligibilityStatus === 'partial'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {calculations.eligibilityStatus === 'full' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : calculations.eligibilityStatus === 'partial' ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {calculations.eligibilityStatus === 'full' 
                        ? 'Full Contribution Eligible'
                        : calculations.eligibilityStatus === 'partial'
                        ? 'Partial Contribution (Phase-Out)'
                        : 'Income Too High for Direct Contribution'
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calculations.eligibilityStatus === 'full' 
                        ? `Your income is below the ${formatCurrency(calculations.phaseOutStart)} phase-out threshold.`
                        : calculations.eligibilityStatus === 'partial'
                        ? `Your income falls in the phase-out range (${formatCurrency(calculations.phaseOutStart)} - ${formatCurrency(calculations.phaseOutEnd)}). Eligible: ${formatCurrency(calculations.eligibleContribution)}`
                        : `Consider a Backdoor Roth IRA strategy for high earners.`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">At Retirement</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(calculations.futureValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    100% Tax-Free
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(calculations.monthlyRetirementIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tax-free (4% rule)
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Tax-Free Growth</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {formatCurrency(calculations.totalGrowth)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Investment gains
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Tax Savings</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCurrency(calculations.taxSavingsOnGrowth)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs taxable account
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Growth Breakdown
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
                          className="h-full bg-purple-500"
                          style={{ width: `${(calculations.totalContributions / calculations.futureValue) * 100}%` }}
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
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contributions</p>
                        <p className="text-sm font-medium">{formatCurrency(calculations.totalContributions)}</p>
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

                {/* Year by Year Table */}
                <div className="mt-6 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Age</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Balance</th>
                        <th className="text-right py-2 text-muted-foreground font-medium hidden sm:table-cell">Contributions</th>
                        <th className="text-right py-2 text-muted-foreground font-medium hidden sm:table-cell">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.yearlyBreakdown
                        .filter((_, i) => i % 5 === 4 || i === calculations.yearlyBreakdown.length - 1)
                        .map((year) => (
                          <tr key={year.year} className="border-b border-border/50">
                            <td className="py-2">{year.age}</td>
                            <td className="text-right font-medium">{formatCurrency(year.balance)}</td>
                            <td className="text-right text-muted-foreground hidden sm:table-cell">
                              {formatCurrency(year.contributions)}
                            </td>
                            <td className="text-right text-amber-500 hidden sm:table-cell">
                              {formatCurrency(year.growth)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Roth IRA Benefits */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Why Roth IRA?</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Tax-Free Withdrawals</strong> - All qualified withdrawals in retirement are 100% tax-free.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>No RMDs</strong> - Unlike Traditional IRAs, Roth IRAs have no required minimum distributions.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Flexibility</strong> - Contributions (not earnings) can be withdrawn anytime penalty-free.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Tax Diversification</strong> - Hedge against future tax rate increases.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Disclaimer 
          text="This calculator provides estimates based on the assumptions entered. Roth IRA rules are complex and income limits change annually. Consult a tax professional for personalized advice."
        />
      </div>
    </div>
  );
};

export default RothIRACalculator;
