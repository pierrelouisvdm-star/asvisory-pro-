import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, TrendingUp, DollarSign, Calendar, Target, 
  Info, ArrowRight, School, Gift
} from 'lucide-react';
import { US_RETIREMENT_LIMITS_2024 } from '@/data/usTaxData';
import { Disclaimer } from '@/components/calculators/Disclaimer';

// Average college costs by type (2024)
const COLLEGE_COSTS = {
  publicInState: { tuition: 11260, roomBoard: 12770, total: 24030 },
  publicOutState: { tuition: 29150, roomBoard: 12770, total: 41920 },
  privateNonprofit: { tuition: 42160, roomBoard: 14650, total: 56810 },
  ivyLeague: { tuition: 62000, roomBoard: 18000, total: 80000 },
};

const Calculator529 = () => {
  const [childAge, setChildAge] = useState(5);
  const [collegeStartAge, setCollegeStartAge] = useState(18);
  const [collegeType, setCollegeType] = useState('publicInState');
  const [yearsOfCollege, setYearsOfCollege] = useState(4);
  const [currentBalance, setCurrentBalance] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(300);
  const [expectedReturn, setExpectedReturn] = useState(6);
  const [collegeInflation, setCollegeInflation] = useState(5);
  const [stateTaxDeduction, setStateTaxDeduction] = useState(true);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [useFrontLoad, setUseFrontLoad] = useState(false);

  const limits = US_RETIREMENT_LIMITS_2024.plan529;

  const calculations = useMemo(() => {
    const yearsUntilCollege = Math.max(0, collegeStartAge - childAge);
    const annualReturn = expectedReturn / 100;
    const annualInflation = collegeInflation / 100;
    
    // Current college costs
    const currentCosts = COLLEGE_COSTS[collegeType];
    const currentAnnualCost = currentCosts.total;
    
    // Future college costs (with inflation)
    const futureAnnualCost = currentAnnualCost * Math.pow(1 + annualInflation, yearsUntilCollege);
    const totalCollegeCost = futureAnnualCost * yearsOfCollege;
    
    // 529 Growth calculation
    const annualContribution = monthlyContribution * 12;
    let futureValue = currentBalance;
    let totalContributions = currentBalance;
    const yearlyBreakdown = [];
    
    for (let year = 1; year <= yearsUntilCollege; year++) {
      futureValue = (futureValue + annualContribution) * (1 + annualReturn);
      totalContributions += annualContribution;
      
      yearlyBreakdown.push({
        year,
        childAge: childAge + year,
        balance: futureValue,
        contributions: totalContributions,
        growth: futureValue - totalContributions,
      });
    }
    
    const totalGrowth = futureValue - totalContributions;
    
    // Funding gap
    const fundingGap = totalCollegeCost - futureValue;
    const fundingPercent = (futureValue / totalCollegeCost) * 100;
    
    // Tax savings
    const annualStateTaxSavings = stateTaxDeduction ? (annualContribution * stateTaxRate / 100) : 0;
    const totalStateTaxSavings = annualStateTaxSavings * yearsUntilCollege;
    
    // Federal tax savings on growth (if used for qualified expenses)
    const federalTaxSavingsOnGrowth = totalGrowth * 0.15; // Assuming 15% cap gains avoided
    
    // Front-loading option (5-year gift tax averaging)
    const frontLoadAmount = useFrontLoad ? limits.fiveYearFrontLoad : 0;
    let frontLoadFutureValue = 0;
    if (useFrontLoad) {
      frontLoadFutureValue = frontLoadAmount * Math.pow(1 + annualReturn, yearsUntilCollege);
    }
    
    // Required monthly to fully fund
    const requiredMonthly = yearsUntilCollege > 0 
      ? (totalCollegeCost - currentBalance * Math.pow(1 + annualReturn, yearsUntilCollege)) / 
        (((Math.pow(1 + annualReturn/12, yearsUntilCollege * 12) - 1) / (annualReturn/12)) * (1 + annualReturn/12))
      : 0;
    
    return {
      yearsUntilCollege,
      currentAnnualCost,
      futureAnnualCost,
      totalCollegeCost,
      futureValue,
      totalContributions,
      totalGrowth,
      fundingGap,
      fundingPercent: Math.min(fundingPercent, 100),
      annualStateTaxSavings,
      totalStateTaxSavings,
      federalTaxSavingsOnGrowth,
      frontLoadFutureValue,
      requiredMonthly: Math.max(0, requiredMonthly),
      yearlyBreakdown,
    };
  }, [childAge, collegeStartAge, collegeType, yearsOfCollege, currentBalance, 
      monthlyContribution, expectedReturn, collegeInflation, stateTaxDeduction, 
      stateTaxRate, useFrontLoad, limits]);

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
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <GraduationCap className="h-8 w-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              529 College Savings Calculator
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plan for your child's education with tax-advantaged 529 savings. 
            Earnings grow tax-free when used for qualified education expenses.
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              Gift Tax Exclusion: ${limits.giftTaxExclusion.toLocaleString()}/year
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              5-Year Front-Load: ${limits.fiveYearFrontLoad.toLocaleString()}
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
                  Child's Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="childAge">Child's Age</Label>
                    <Input
                      id="childAge"
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      min={0}
                      max={17}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="collegeAge">College Age</Label>
                    <Input
                      id="collegeAge"
                      type="number"
                      value={collegeStartAge}
                      onChange={(e) => setCollegeStartAge(Number(e.target.value))}
                      min={17}
                      max={22}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Years Until College</p>
                  <p className="text-xl font-bold text-foreground">
                    {calculations.yearsUntilCollege} years
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-indigo-500" />
                  College Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="collegeType">College Type</Label>
                  <Select value={collegeType} onValueChange={setCollegeType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publicInState">Public (In-State)</SelectItem>
                      <SelectItem value="publicOutState">Public (Out-of-State)</SelectItem>
                      <SelectItem value="privateNonprofit">Private University</SelectItem>
                      <SelectItem value="ivyLeague">Ivy League / Elite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Years of College</Label>
                    <span className="text-sm font-medium">{yearsOfCollege} years</span>
                  </div>
                  <Slider
                    value={[yearsOfCollege]}
                    onValueChange={(v) => setYearsOfCollege(v[0])}
                    min={1}
                    max={6}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <p className="text-sm text-muted-foreground">Current Annual Cost</p>
                  <p className="text-xl font-bold text-indigo-500">
                    {formatCurrency(calculations.currentAnnualCost)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tuition + Room & Board
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>College Cost Inflation</Label>
                    <span className="text-sm font-medium">{collegeInflation}%</span>
                  </div>
                  <Slider
                    value={[collegeInflation]}
                    onValueChange={(v) => setCollegeInflation(v[0])}
                    min={2}
                    max={8}
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
                  Savings Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentBalance">Current 529 Balance</Label>
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
                    <Label>Monthly Contribution</Label>
                    <span className="text-sm font-medium">{formatCurrency(monthlyContribution)}</span>
                  </div>
                  <Slider
                    value={[monthlyContribution]}
                    onValueChange={(v) => setMonthlyContribution(v[0])}
                    min={0}
                    max={2000}
                    step={50}
                    className="mt-2"
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

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>State Tax Rate</Label>
                    <span className="text-sm font-medium">{stateTaxRate}%</span>
                  </div>
                  <Slider
                    value={[stateTaxRate]}
                    onValueChange={(v) => setStateTaxRate(v[0])}
                    min={0}
                    max={10}
                    step={0.5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Many states offer tax deductions for 529 contributions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total College Cost</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(calculations.totalCollegeCost)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(calculations.futureAnnualCost)}/year
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">529 at College</p>
                  <p className="text-2xl font-bold text-indigo-500">
                    {formatCurrency(calculations.futureValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.fundingPercent.toFixed(0)}% funded
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`bg-gradient-to-br ${
                calculations.fundingGap > 0 
                  ? 'from-amber-500/10 to-amber-600/5 border-amber-500/20' 
                  : 'from-green-500/10 to-green-600/5 border-green-500/20'
              }`}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {calculations.fundingGap > 0 ? 'Funding Gap' : 'Surplus'}
                  </p>
                  <p className={`text-2xl font-bold ${
                    calculations.fundingGap > 0 ? 'text-amber-500' : 'text-green-500'
                  }`}>
                    {formatCurrency(Math.abs(calculations.fundingGap))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.fundingGap > 0 
                      ? `Need ${formatCurrency(calculations.requiredMonthly)}/mo` 
                      : 'Fully funded!'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Tax Savings</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(calculations.totalStateTaxSavings + calculations.federalTaxSavingsOnGrowth)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    State + Federal
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Funding Progress */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  Funding Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress to Goal</span>
                      <span className="font-medium">{calculations.fundingPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          calculations.fundingPercent >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(calculations.fundingPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>529 Balance: {formatCurrency(calculations.futureValue)}</span>
                      <span>Goal: {formatCurrency(calculations.totalCollegeCost)}</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Your Contributions</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(calculations.totalContributions)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Tax-Free Growth</p>
                      <p className="text-lg font-bold text-indigo-500">{formatCurrency(calculations.totalGrowth)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Tax Savings</p>
                      <p className="text-lg font-bold text-green-500">
                        {formatCurrency(calculations.totalStateTaxSavings + calculations.federalTaxSavingsOnGrowth)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Year by Year */}
                <div className="mt-6 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Child's Age</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Balance</th>
                        <th className="text-right py-2 text-muted-foreground font-medium hidden sm:table-cell">Contributed</th>
                        <th className="text-right py-2 text-muted-foreground font-medium hidden sm:table-cell">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.yearlyBreakdown
                        .filter((_, i) => i % 2 === 1 || i === calculations.yearlyBreakdown.length - 1)
                        .map((year) => (
                          <tr key={year.year} className="border-b border-border/50">
                            <td className="py-2">{year.childAge}</td>
                            <td className="text-right font-medium">{formatCurrency(year.balance)}</td>
                            <td className="text-right text-muted-foreground hidden sm:table-cell">
                              {formatCurrency(year.contributions)}
                            </td>
                            <td className="text-right text-indigo-500 hidden sm:table-cell">
                              {formatCurrency(year.growth)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Gift className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">529 Plan Strategies</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Superfunding</strong> - Contribute up to 5 years' worth (${limits.fiveYearFrontLoad.toLocaleString()}) at once without gift tax.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Grandparent strategy</strong> - Grandparents can contribute without affecting financial aid (new FAFSA rules).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>State tax benefits</strong> - Over 30 states offer tax deductions for 529 contributions.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Roth rollover</strong> - Starting 2024, unused 529 funds can be rolled to a Roth IRA (up to $35K lifetime).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Disclaimer 
          text="This calculator provides estimates based on the assumptions entered. Actual college costs vary by institution. 529 plan rules vary by state. Consult a financial advisor for personalized advice."
        />
      </div>
    </div>
  );
};

export default Calculator529;
