import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Landmark, TrendingUp, DollarSign, Calendar, Target, 
  Info, ArrowRight, Clock
} from 'lucide-react';
import { US_SOCIAL_SECURITY_2024 } from '@/data/usTaxData';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const SocialSecurityCalculator = () => {
  const [birthYear, setBirthYear] = useState(1970);
  const [currentAge, setCurrentAge] = useState(new Date().getFullYear() - 1970);
  const [averageEarnings, setAverageEarnings] = useState(65000);
  const [claimingAge, setClaimingAge] = useState(67);
  const [yearsWorked, setYearsWorked] = useState(35);
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [spouseBenefit, setSpouseBenefit] = useState(0);

  const ssData = US_SOCIAL_SECURITY_2024;

  const calculations = useMemo(() => {
    // Determine Full Retirement Age (FRA)
    let fraYears = 67;
    let fraMonths = 0;
    if (birthYear <= 1954) {
      fraYears = 66;
    } else if (birthYear >= 1955 && birthYear <= 1959) {
      fraYears = 66;
      fraMonths = (birthYear - 1954) * 2;
    }
    const fra = fraYears + fraMonths / 12;
    
    // Estimate Primary Insurance Amount (PIA) using simplified bend points
    // This is a simplified calculation - actual SS uses 35 highest earning years
    const aime = Math.min(averageEarnings, ssData.maxTaxableEarnings) / 12; // Average Indexed Monthly Earnings
    
    // 2024 bend points (simplified)
    let pia = 0;
    if (aime <= 1174) {
      pia = aime * 0.90;
    } else if (aime <= 7078) {
      pia = 1174 * 0.90 + (aime - 1174) * 0.32;
    } else {
      pia = 1174 * 0.90 + (7078 - 1174) * 0.32 + (aime - 7078) * 0.15;
    }
    
    // Cap at max benefit
    pia = Math.min(pia, ssData.maxBenefitAtFRA);
    
    // Adjust for claiming age
    let benefitAtClaimingAge = pia;
    if (claimingAge < fra) {
      // Reduction for early claiming
      const monthsEarly = (fra - claimingAge) * 12;
      // 5/9% per month for first 36 months, 5/12% for additional months
      const reductionFirst36 = Math.min(monthsEarly, 36) * (5/900);
      const reductionAfter36 = Math.max(0, monthsEarly - 36) * (5/1200);
      benefitAtClaimingAge = pia * (1 - reductionFirst36 - reductionAfter36);
    } else if (claimingAge > fra) {
      // Delayed retirement credits
      const monthsDelayed = Math.min((claimingAge - fra) * 12, (70 - fra) * 12);
      const delayedCredit = monthsDelayed * (2/300); // 8% per year = 2/3% per month
      benefitAtClaimingAge = pia * (1 + delayedCredit);
    }
    
    // Calculate benefits at different ages
    const benefitAt62 = pia * (1 - Math.min(fra - 62, 3) * 0.0667 - Math.max(0, fra - 62 - 3) * 0.05);
    const benefitAtFRA = pia;
    const benefitAt70 = pia * (1 + Math.min((70 - fra), 3) * 0.08);
    
    // Lifetime benefits calculation (assuming life expectancy of 85)
    const lifeExpectancy = 85;
    const yearsReceiving62 = lifeExpectancy - 62;
    const yearsReceivingFRA = lifeExpectancy - fra;
    const yearsReceiving70 = lifeExpectancy - 70;
    
    const lifetimeAt62 = benefitAt62 * 12 * yearsReceiving62;
    const lifetimeAtFRA = benefitAtFRA * 12 * yearsReceivingFRA;
    const lifetimeAt70 = benefitAt70 * 12 * yearsReceiving70;
    
    // Break-even ages
    const breakEven62vsFRA = 62 + (benefitAtFRA * 12 * (fra - 62)) / ((benefitAtFRA - benefitAt62) * 12);
    const breakEvenFRAv70 = fra + (benefitAt70 * 12 * (70 - fra)) / ((benefitAt70 - benefitAtFRA) * 12);
    
    // Spousal benefit (50% of higher earner's PIA)
    const spousalBenefit = maritalStatus === 'married' ? Math.max(pia / 2, spouseBenefit) : 0;
    
    return {
      fra,
      fraYears,
      fraMonths,
      pia,
      aime,
      benefitAtClaimingAge,
      benefitAt62,
      benefitAtFRA,
      benefitAt70,
      lifetimeAt62,
      lifetimeAtFRA,
      lifetimeAt70,
      breakEven62vsFRA: Math.round(breakEven62vsFRA * 10) / 10,
      breakEvenFRAv70: Math.round(breakEvenFRAv70 * 10) / 10,
      spousalBenefit,
      monthlyAtClaiming: benefitAtClaimingAge,
      annualAtClaiming: benefitAtClaimingAge * 12,
      percentageOfFRA: (benefitAtClaimingAge / pia) * 100,
    };
  }, [birthYear, averageEarnings, claimingAge, yearsWorked, maritalStatus, spouseBenefit, ssData]);

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
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Landmark className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Social Security Estimator
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estimate your Social Security benefits based on your earnings history 
            and planned claiming age. Understand the impact of early or delayed retirement.
          </p>
          <Badge className="mt-3 bg-blue-500/10 text-blue-500 border-blue-500/20">
            2024 Max Benefit at FRA: ${ssData.maxBenefitAtFRA.toLocaleString()}/month
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="birthYear">Birth Year</Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={birthYear}
                    onChange={(e) => {
                      setBirthYear(Number(e.target.value));
                      setCurrentAge(new Date().getFullYear() - Number(e.target.value));
                    }}
                    min={1940}
                    max={2005}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current age: {currentAge}
                  </p>
                </div>

                <div>
                  <Label htmlFor="earnings">Average Annual Earnings</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="earnings"
                      type="number"
                      value={averageEarnings}
                      onChange={(e) => setAverageEarnings(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max taxable: {formatCurrency(ssData.maxTaxableEarnings)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="yearsWorked">Years Worked</Label>
                  <Input
                    id="yearsWorked"
                    type="number"
                    value={yearsWorked}
                    onChange={(e) => setYearsWorked(Number(e.target.value))}
                    min={0}
                    max={50}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    SS uses your highest 35 earning years
                  </p>
                </div>

                <div>
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced (10+ years)</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Claiming Age
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>When to Claim</Label>
                    <span className="text-sm font-medium">Age {claimingAge}</span>
                  </div>
                  <Slider
                    value={[claimingAge]}
                    onValueChange={(v) => setClaimingAge(v[0])}
                    min={62}
                    max={70}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>62 (Early)</span>
                    <span>{Math.floor(calculations.fra)} (FRA)</span>
                    <span>70 (Max)</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Full Retirement Age</p>
                  <p className="text-xl font-bold text-foreground">
                    {calculations.fraYears} years{calculations.fraMonths > 0 && `, ${calculations.fraMonths} months`}
                  </p>
                </div>

                <div className={`p-3 rounded-lg ${
                  claimingAge < calculations.fra 
                    ? 'bg-red-500/10 border border-red-500/20' 
                    : claimingAge > calculations.fra
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  <p className="text-sm text-muted-foreground">Benefit Adjustment</p>
                  <p className={`text-xl font-bold ${
                    claimingAge < calculations.fra 
                      ? 'text-red-500' 
                      : claimingAge > calculations.fra
                      ? 'text-green-500'
                      : 'text-blue-500'
                  }`}>
                    {calculations.percentageOfFRA.toFixed(1)}% of FRA
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {claimingAge < calculations.fra 
                      ? `${((1 - calculations.percentageOfFRA/100) * 100).toFixed(1)}% reduction for early claiming`
                      : claimingAge > calculations.fra
                      ? `${((calculations.percentageOfFRA/100 - 1) * 100).toFixed(1)}% increase for delayed claiming`
                      : 'Claiming at Full Retirement Age'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly at Age {claimingAge}</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCurrency(calculations.monthlyAtClaiming)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(calculations.annualAtClaiming)}/year
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly at FRA</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(calculations.benefitAtFRA)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your PIA (Primary Insurance Amount)
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly at 70</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(calculations.benefitAt70)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum possible benefit
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Claiming Age Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 text-muted-foreground font-medium">Claiming Age</th>
                        <th className="text-right py-3 text-muted-foreground font-medium">Monthly</th>
                        <th className="text-right py-3 text-muted-foreground font-medium">Annual</th>
                        <th className="text-right py-3 text-muted-foreground font-medium">% of FRA</th>
                        <th className="text-right py-3 text-muted-foreground font-medium hidden sm:table-cell">Lifetime (to 85)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b border-border/50 ${claimingAge === 62 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-3 font-medium">62 (Earliest)</td>
                        <td className="text-right text-red-500">{formatCurrency(calculations.benefitAt62)}</td>
                        <td className="text-right">{formatCurrency(calculations.benefitAt62 * 12)}</td>
                        <td className="text-right">{((calculations.benefitAt62 / calculations.benefitAtFRA) * 100).toFixed(0)}%</td>
                        <td className="text-right hidden sm:table-cell">{formatCurrency(calculations.lifetimeAt62)}</td>
                      </tr>
                      <tr className={`border-b border-border/50 ${claimingAge === Math.floor(calculations.fra) ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-3 font-medium">{Math.floor(calculations.fra)} (FRA)</td>
                        <td className="text-right text-green-500">{formatCurrency(calculations.benefitAtFRA)}</td>
                        <td className="text-right">{formatCurrency(calculations.benefitAtFRA * 12)}</td>
                        <td className="text-right">100%</td>
                        <td className="text-right hidden sm:table-cell">{formatCurrency(calculations.lifetimeAtFRA)}</td>
                      </tr>
                      <tr className={`border-b border-border/50 ${claimingAge === 70 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-3 font-medium">70 (Maximum)</td>
                        <td className="text-right text-purple-500">{formatCurrency(calculations.benefitAt70)}</td>
                        <td className="text-right">{formatCurrency(calculations.benefitAt70 * 12)}</td>
                        <td className="text-right">{((calculations.benefitAt70 / calculations.benefitAtFRA) * 100).toFixed(0)}%</td>
                        <td className="text-right hidden sm:table-cell">{formatCurrency(calculations.lifetimeAt70)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Break-Even Points</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">62 vs FRA break-even:</p>
                      <p className="font-medium">Age {calculations.breakEven62vsFRA}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">FRA vs 70 break-even:</p>
                      <p className="font-medium">Age {calculations.breakEvenFRAv70}</p>
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
                    <h3 className="font-semibold text-foreground mb-2">Social Security Strategies</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Delay if possible</strong> - Each year you delay past FRA increases benefits by 8% until age 70.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Spousal benefits</strong> - Non-working spouses can claim up to 50% of the higher earner's PIA.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Consider health</strong> - If you have health concerns, claiming earlier may make sense.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Work history matters</strong> - Benefits are based on your highest 35 earning years.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Disclaimer 
          text="This calculator provides estimates only. Actual Social Security benefits depend on your complete earnings history and SSA calculations. Visit ssa.gov for official estimates."
        />
      </div>
    </div>
  );
};

export default SocialSecurityCalculator;
