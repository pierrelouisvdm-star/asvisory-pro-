import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  PiggyBank, TrendingUp, DollarSign, Calendar, Target, 
  Info, ArrowRight, Percent, Building2
} from 'lucide-react';
import { US_RETIREMENT_LIMITS_2024, US_FEDERAL_TAX_BRACKETS_2024 } from '@/data/usTaxData';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const Calculator401k = () => {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [annualSalary, setAnnualSalary] = useState(75000);
  const [contributionPercent, setContributionPercent] = useState(10);
  const [employerMatch, setEmployerMatch] = useState(50); // percent of contribution
  const [employerMatchLimit, setEmployerMatchLimit] = useState(6); // percent of salary
  const [currentBalance, setCurrentBalance] = useState(25000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [salaryGrowth, setSalaryGrowth] = useState(3);
  const [filingStatus, setFilingStatus] = useState('single');
  const [isOver50, setIsOver50] = useState(false);
  const [includeRoth, setIncludeRoth] = useState(false);

  const limits = US_RETIREMENT_LIMITS_2024.traditional401k;
  const maxContribution = isOver50 
    ? limits.employeeLimit + limits.catchUp50Plus 
    : limits.employeeLimit;

  const calculations = useMemo(() => {
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const monthlyReturn = expectedReturn / 100 / 12;
    const annualReturn = expectedReturn / 100;
    
    // Annual employee contribution
    const annualContribution = Math.min(
      (annualSalary * contributionPercent) / 100,
      maxContribution
    );
    
    // Employer match calculation
    const matchableContribution = Math.min(
      annualContribution,
      (annualSalary * employerMatchLimit) / 100
    );
    const annualEmployerMatch = (matchableContribution * employerMatch) / 100;
    const totalAnnualContribution = annualContribution + annualEmployerMatch;
    
    // Calculate tax savings (Traditional 401k)
    const brackets = US_FEDERAL_TAX_BRACKETS_2024[filingStatus];
    let marginalRate = 0.22; // default
    const taxableIncome = annualSalary;
    for (const bracket of brackets) {
      if (taxableIncome <= bracket.max) {
        marginalRate = bracket.rate;
        break;
      }
    }
    const annualTaxSavings = includeRoth ? 0 : annualContribution * marginalRate;
    
    // Future value calculation with salary growth
    let futureValue = currentBalance;
    let totalContributions = 0;
    let totalEmployerContributions = 0;
    let totalTaxSavings = 0;
    let currentSalary = annualSalary;
    const yearlyBreakdown = [];
    
    for (let year = 1; year <= yearsToRetirement; year++) {
      // Calculate this year's contribution (with salary growth)
      const yearContribution = Math.min(
        (currentSalary * contributionPercent) / 100,
        maxContribution
      );
      const yearMatchable = Math.min(
        yearContribution,
        (currentSalary * employerMatchLimit) / 100
      );
      const yearEmployerMatch = (yearMatchable * employerMatch) / 100;
      const yearTaxSavings = includeRoth ? 0 : yearContribution * marginalRate;
      
      // Add contributions at start of year, then grow
      futureValue = (futureValue + yearContribution + yearEmployerMatch) * (1 + annualReturn);
      totalContributions += yearContribution;
      totalEmployerContributions += yearEmployerMatch;
      totalTaxSavings += yearTaxSavings;
      
      // Track yearly data for chart
      yearlyBreakdown.push({
        year,
        age: currentAge + year,
        balance: futureValue,
        contributions: totalContributions,
        employerMatch: totalEmployerContributions,
        growth: futureValue - currentBalance - totalContributions - totalEmployerContributions,
      });
      
      // Apply salary growth for next year
      currentSalary *= (1 + salaryGrowth / 100);
    }
    
    const totalGrowth = futureValue - currentBalance - totalContributions - totalEmployerContributions;
    
    // Monthly income in retirement (4% withdrawal rule)
    const monthlyRetirementIncome = (futureValue * 0.04) / 12;
    
    return {
      yearsToRetirement,
      annualContribution,
      annualEmployerMatch,
      totalAnnualContribution,
      annualTaxSavings,
      marginalRate: marginalRate * 100,
      futureValue,
      totalContributions,
      totalEmployerContributions,
      totalGrowth,
      totalTaxSavings,
      monthlyRetirementIncome,
      yearlyBreakdown,
      effectiveMatch: annualEmployerMatch > 0 
        ? ((annualEmployerMatch / annualContribution) * 100)
        : 0,
    };
  }, [currentAge, retirementAge, annualSalary, contributionPercent, employerMatch, 
      employerMatchLimit, currentBalance, expectedReturn, salaryGrowth, filingStatus, 
      isOver50, maxContribution, includeRoth]);

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
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <PiggyBank className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              401(k) Calculator
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plan your retirement savings with employer matching, tax benefits, and 
            compound growth projections.
          </p>
          <Badge className="mt-3 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            2025 Limits: ${limits.employeeLimit.toLocaleString()} + ${limits.catchUp50Plus.toLocaleString()} catch-up
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
                      min={50}
                      max={75}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="salary">Annual Salary</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="salary"
                      type="number"
                      value={annualSalary}
                      onChange={(e) => setAnnualSalary(Number(e.target.value))}
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
                      <SelectItem value="headOfHousehold">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="over50">Age 50+ (Catch-up)</Label>
                    <p className="text-xs text-muted-foreground">+$7,500 contribution limit</p>
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
                    <Label>Your Contribution</Label>
                    <span className="text-sm font-medium">{contributionPercent}% of salary</span>
                  </div>
                  <Slider
                    value={[contributionPercent]}
                    onValueChange={(v) => setContributionPercent(v[0])}
                    min={0}
                    max={30}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatCurrency(calculations.annualContribution)}/year</span>
                    <span>Max: {formatCurrency(maxContribution)}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentBalance">Current 401(k) Balance</Label>
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

                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div>
                    <Label htmlFor="roth">Roth 401(k)</Label>
                    <p className="text-xs text-muted-foreground">After-tax contributions</p>
                  </div>
                  <Switch
                    id="roth"
                    checked={includeRoth}
                    onCheckedChange={setIncludeRoth}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  Employer Match
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Match Rate</Label>
                    <span className="text-sm font-medium">{employerMatch}%</span>
                  </div>
                  <Slider
                    value={[employerMatch]}
                    onValueChange={(v) => setEmployerMatch(v[0])}
                    min={0}
                    max={100}
                    step={10}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Employer matches {employerMatch}% of your contribution
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Match Limit</Label>
                    <span className="text-sm font-medium">{employerMatchLimit}% of salary</span>
                  </div>
                  <Slider
                    value={[employerMatchLimit]}
                    onValueChange={(v) => setEmployerMatchLimit(v[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Match applies up to {employerMatchLimit}% of your salary
                  </p>
                </div>

                {calculations.annualEmployerMatch > 0 && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-muted-foreground">Annual Employer Match</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(calculations.annualEmployerMatch)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      That's FREE money! ({calculations.effectiveMatch.toFixed(0)}% effective match)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  Growth Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Salary Growth</Label>
                    <span className="text-sm font-medium">{salaryGrowth}%</span>
                  </div>
                  <Slider
                    value={[salaryGrowth]}
                    onValueChange={(v) => setSalaryGrowth(v[0])}
                    min={0}
                    max={6}
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
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">At Retirement</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatCurrency(calculations.futureValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    in {calculations.yearsToRetirement} years
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCurrency(calculations.monthlyRetirementIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    4% withdrawal rule
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Free Money</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(calculations.totalEmployerContributions)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total employer match
                  </p>
                </CardContent>
              </Card>
              
              {!includeRoth && (
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Tax Savings</p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCurrency(calculations.totalTaxSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      at {calculations.marginalRate.toFixed(0)}% bracket
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  Retirement Savings Breakdown
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
                          className="h-full bg-emerald-500"
                          style={{ width: `${(calculations.totalContributions / calculations.futureValue) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-purple-500"
                          style={{ width: `${(calculations.totalEmployerContributions / calculations.futureValue) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-amber-500"
                          style={{ width: `${(calculations.totalGrowth / calculations.futureValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Starting</p>
                        <p className="text-sm font-medium">{formatCurrency(currentBalance)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Your Contributions</p>
                        <p className="text-sm font-medium">{formatCurrency(calculations.totalContributions)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Employer Match</p>
                        <p className="text-sm font-medium">{formatCurrency(calculations.totalEmployerContributions)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Investment Growth</p>
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
                              {formatCurrency(year.contributions + year.employerMatch)}
                            </td>
                            <td className="text-right text-emerald-500 hidden sm:table-cell">
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
                  <Info className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Maximize Your 401(k)</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Always get the full match</strong> - It's free money! Contribute at least enough to get 100% of employer match.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Traditional vs Roth</strong> - Traditional reduces taxes now; Roth provides tax-free growth and withdrawals.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Increase with raises</strong> - Boost your contribution by 1% each year to reach the max without feeling the pinch.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Disclaimer 
          text="This calculator provides estimates based on the assumptions entered. Actual returns will vary. Past performance does not guarantee future results. Consult a financial advisor for personalized retirement planning advice."
        />
      </div>
    </div>
  );
};

export default Calculator401k;
