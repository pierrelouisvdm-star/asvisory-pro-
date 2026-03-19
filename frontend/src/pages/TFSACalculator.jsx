import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PiggyBank, TrendingUp, Calculator, Info, Shield, 
  Calendar, Target, Percent, DollarSign, CheckCircle2,
  AlertTriangle, Sparkles
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// TFSA Limits for South Africa 2026/2027 (Effective 1 March 2026)
const TFSA_ANNUAL_LIMIT = 46000;    // Increased from R36,000 to R46,000
const TFSA_LIFETIME_LIMIT = 500000; // Unchanged

// Input component defined OUTSIDE the main component to prevent re-creation on every render
const TFSAInputField = ({ label, value, onChange, prefix, suffix, step = 1, min = 0, max, tooltip }) => {
  const [localValue, setLocalValue] = React.useState(String(value || ''));
  
  React.useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    if (inputValue === '' || inputValue === '-') {
      onChange(0);
    } else {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || localValue === '') {
      setLocalValue('0');
      onChange(0);
    } else {
      setLocalValue(String(parsed));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-slate-300">{label}</Label>
        {tooltip && (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        )}
        <Input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`bg-navy-800 border-navy-600 text-white ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
          step={step}
          min={min}
          max={max}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
};

const TFSACalculator = () => {
  const { formatCurrency, symbol } = useCurrency();
  
  // Contribution inputs
  const [currentBalance, setCurrentBalance] = useState(0);
  const [lifetimeContributions, setLifetimeContributions] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [yearToDateContribution, setYearToDateContribution] = useState(0);
  
  // Growth assumptions
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [investmentYears, setInvestmentYears] = useState(20);
  
  // Tax rates for comparison
  const [marginalTaxRate, setMarginalTaxRate] = useState(36);
  const [interestTaxRate] = useState(45); // Interest taxed at marginal rate
  const [dividendTaxRate] = useState(20); // DWT
  const [cgtInclusionRate] = useState(40); // CGT inclusion

  // Calculate results
  const results = useMemo(() => {
    // Current year limits
    const annualRemaining = Math.max(0, TFSA_ANNUAL_LIMIT - yearToDateContribution);
    const lifetimeRemaining = Math.max(0, TFSA_LIFETIME_LIMIT - lifetimeContributions);
    const effectiveAnnualLimit = Math.min(annualRemaining, lifetimeRemaining);
    
    // Monthly contribution capped (R46,000 / 12 months = ~R3,833/month)
    const monthsRemaining = 12 - Math.ceil(yearToDateContribution / 3833);
    const maxMonthlyToLimit = monthsRemaining > 0 ? effectiveAnnualLimit / monthsRemaining : 0;
    const effectiveMonthly = Math.min(monthlyContribution, maxMonthlyToLimit);
    
    // Project TFSA growth (tax-free)
    const monthlyReturn = expectedReturn / 100 / 12;
    const tfsaProjection = [];
    const taxableProjection = [];
    
    let tfsaBalance = currentBalance;
    let taxableBalance = currentBalance;
    let totalTfsaContributions = lifetimeContributions;
    let totalTaxableContributions = lifetimeContributions;
    
    for (let year = 1; year <= investmentYears; year++) {
      // Annual contribution (capped at limits)
      const remainingLifetime = TFSA_LIFETIME_LIMIT - totalTfsaContributions;
      const annualContribution = Math.min(TFSA_ANNUAL_LIMIT, remainingLifetime, monthlyContribution * 12);
      
      for (let month = 1; month <= 12; month++) {
        const monthlyContrib = annualContribution / 12;
        
        // TFSA: Tax-free growth
        tfsaBalance = tfsaBalance * (1 + monthlyReturn) + monthlyContrib;
        totalTfsaContributions += monthlyContrib;
        
        // Taxable: Growth reduced by taxes
        // Assume 50% dividends, 50% capital growth
        const grossReturn = taxableBalance * monthlyReturn;
        const dividendPortion = grossReturn * 0.5;
        const growthPortion = grossReturn * 0.5;
        
        const dividendTax = dividendPortion * (dividendTaxRate / 100);
        const netReturn = grossReturn - dividendTax; // CGT only on realization
        
        taxableBalance = taxableBalance + netReturn + monthlyContrib;
        totalTaxableContributions += monthlyContrib;
      }
      
      tfsaProjection.push({
        year,
        balance: Math.round(tfsaBalance),
        contributions: Math.round(totalTfsaContributions),
        growth: Math.round(tfsaBalance - totalTfsaContributions),
      });
      
      // Apply CGT on taxable account (simplified - annual rebalancing assumption)
      // 2026/27: R50,000 annual exclusion (was R40,000)
      const taxableGrowth = taxableBalance - totalTaxableContributions;
      const annualCGT = taxableGrowth > 50000 ? (taxableGrowth - 50000) * (cgtInclusionRate / 100) * (marginalTaxRate / 100) * 0.1 : 0;
      taxableBalance -= annualCGT;
      
      taxableProjection.push({
        year,
        balance: Math.round(taxableBalance),
        contributions: Math.round(totalTaxableContributions),
        growth: Math.round(taxableBalance - totalTaxableContributions),
      });
    }
    
    const finalTfsaBalance = tfsaBalance;
    const finalTaxableBalance = taxableBalance;
    const taxSavings = finalTfsaBalance - finalTaxableBalance;
    const taxSavingsPercent = (taxSavings / finalTaxableBalance) * 100;
    
    // Time to reach lifetime limit
    const annualContribRate = monthlyContribution * 12;
    const yearsToLifetimeLimit = annualContribRate > 0 
      ? Math.ceil(lifetimeRemaining / Math.min(annualContribRate, TFSA_ANNUAL_LIMIT))
      : Infinity;
    
    return {
      annualRemaining,
      lifetimeRemaining,
      effectiveAnnualLimit,
      maxMonthlyToLimit,
      yearsToLifetimeLimit,
      finalTfsaBalance,
      finalTaxableBalance,
      taxSavings,
      taxSavingsPercent,
      tfsaProjection,
      taxableProjection,
      totalContributions: totalTfsaContributions,
      totalGrowth: finalTfsaBalance - totalTfsaContributions,
    };
  }, [currentBalance, lifetimeContributions, monthlyContribution, yearToDateContribution, expectedReturn, investmentYears, marginalTaxRate, dividendTaxRate, cgtInclusionRate]);

  // Combined chart data
  const chartData = results.tfsaProjection.map((tfsa, idx) => ({
    year: tfsa.year,
    tfsa: tfsa.balance,
    taxable: results.taxableProjection[idx].balance,
    contributions: tfsa.contributions,
  }));

  return (
    <div className="space-y-6" data-testid="tfsa-calculator">
      <Disclaimer />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="h-7 w-7 text-emerald-400" />
            Tax Free Savings Calculator
          </h1>
          <p className="text-slate-400 mt-1">
            Maximize your TFSA and see the power of tax-free compounding
          </p>
        </div>
      </div>

      {/* Limit Status Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-navy-900 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Annual Limit Remaining</p>
                <p className="text-xl font-bold text-emerald-400">
                  {formatCurrency(results.annualRemaining)}
                </p>
                <p className="text-xs text-slate-500">of {formatCurrency(TFSA_ANNUAL_LIMIT)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-navy-900 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Lifetime Limit Remaining</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatCurrency(results.lifetimeRemaining)}
                </p>
                <p className="text-xs text-slate-500">of {formatCurrency(TFSA_LIFETIME_LIMIT)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-navy-900 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Projected Tax Savings</p>
                <p className="text-xl font-bold text-amber-400">
                  {formatCurrency(results.taxSavings)}
                </p>
                <p className="text-xs text-slate-500">over {investmentYears} years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-navy-900 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Years to Lifetime Limit</p>
                <p className="text-xl font-bold text-purple-400">
                  {results.yearsToLifetimeLimit === Infinity ? '∞' : `${results.yearsToLifetimeLimit} years`}
                </p>
                <p className="text-xs text-slate-500">at current rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-400" />
              Your TFSA Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TFSAInputField
              label="Current TFSA Balance"
              value={currentBalance}
              onChange={setCurrentBalance}
              prefix={symbol}
              step={1000}
              tooltip="Total value of your TFSA today"
            />
            <TFSAInputField
              label="Lifetime Contributions Made"
              value={lifetimeContributions}
              onChange={setLifetimeContributions}
              prefix={symbol}
              step={1000}
              max={TFSA_LIFETIME_LIMIT}
              tooltip="Total you've contributed since opening (max R500k)"
            />
            <TFSAInputField
              label="This Year's Contributions"
              value={yearToDateContribution}
              onChange={setYearToDateContribution}
              prefix={symbol}
              step={1000}
              max={TFSA_ANNUAL_LIMIT}
              tooltip="Amount contributed in current tax year"
            />
            <TFSAInputField
              label="Monthly Contribution"
              value={monthlyContribution}
              onChange={setMonthlyContribution}
              prefix={symbol}
              step={500}
              tooltip="How much you plan to contribute monthly"
            />
            
            {monthlyContribution * 12 > TFSA_ANNUAL_LIMIT && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-400">
                    Monthly amount exceeds annual limit. Max: {formatCurrency(TFSA_ANNUAL_LIMIT / 12)}/month
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Assumptions */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Growth Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Expected Annual Return: {expectedReturn}%</Label>
              <Slider
                value={[expectedReturn]}
                onValueChange={([val]) => setExpectedReturn(val)}
                min={4}
                max={15}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-slate-500">Typical equity returns: 8-12% p.a.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Investment Period: {investmentYears} years</Label>
              <Slider
                value={[investmentYears]}
                onValueChange={([val]) => setInvestmentYears(val)}
                min={5}
                max={40}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Your Marginal Tax Rate: {marginalTaxRate}%</Label>
              <Slider
                value={[marginalTaxRate]}
                onValueChange={([val]) => setMarginalTaxRate(val)}
                min={18}
                max={45}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-slate-500">Used to calculate tax savings vs taxable account</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-400" />
              Projection Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-slate-400">TFSA Value (Tax-Free)</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(results.finalTfsaBalance)}
              </p>
            </div>
            
            <div className="p-4 bg-slate-500/10 border border-slate-500/30 rounded-lg">
              <p className="text-sm text-slate-400">Taxable Account Value</p>
              <p className="text-2xl font-bold text-slate-300">
                {formatCurrency(results.finalTaxableBalance)}
              </p>
            </div>
            
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-slate-400">Your Tax Savings</p>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(results.taxSavings)}
              </p>
              <p className="text-xs text-slate-500">
                {results.taxSavingsPercent.toFixed(1)}% more in your pocket
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-navy-800/50 rounded-lg">
                <p className="text-xs text-slate-400">Total Contributed</p>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(results.totalContributions)}
                </p>
              </div>
              <div className="p-3 bg-navy-800/50 rounded-lg">
                <p className="text-xs text-slate-400">Total Growth</p>
                <p className="text-sm font-medium text-emerald-400">
                  +{formatCurrency(results.totalGrowth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="bg-navy-800">
          <TabsTrigger value="comparison">TFSA vs Taxable</TabsTrigger>
          <TabsTrigger value="growth">Growth Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">TFSA vs Taxable Account Growth</CardTitle>
              <CardDescription>See the power of tax-free compounding over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#94a3b8"
                      label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      tickFormatter={(val) => `${symbol}${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="tfsa"
                      name="TFSA (Tax-Free)"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="taxable"
                      name="Taxable Account"
                      stroke="#64748b"
                      fill="#64748b"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="contributions"
                      name="Total Contributions"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Contributions vs Growth</CardTitle>
              <CardDescription>See how your money grows tax-free</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.filter((_, i) => i % 2 === 0 || i === chartData.length - 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis 
                      stroke="#94a3b8"
                      tickFormatter={(val) => `${symbol}${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="contributions" name="Your Contributions" fill="#3b82f6" stackId="a" />
                    <Bar 
                      dataKey={(data) => data.tfsa - data.contributions} 
                      name="Tax-Free Growth" 
                      fill="#10b981" 
                      stackId="a" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* TFSA Rules Info */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-400 mb-2">TFSA Rules (South Africa) - 2026/2027</h4>
              <ul className="text-sm text-slate-300 space-y-1 grid sm:grid-cols-2 gap-x-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Annual contribution limit: <strong>R46,000</strong> (from 1 March 2026)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Lifetime contribution limit: <strong>R500,000</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  No tax on interest, dividends, or capital gains
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Withdrawals don't restore contribution room
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  40% penalty on excess contributions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  One TFSA per person (can have multiple accounts)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Report */}
      <PrintReport
        title="Tax Free Savings Account Analysis"
        calculatorType="TFSA Calculator"
        inputs={[
          { label: 'Current TFSA Balance', value: formatCurrency(currentBalance) },
          { label: 'Lifetime Contributions', value: formatCurrency(lifetimeContributions) },
          { label: 'Monthly Contribution', value: formatCurrency(monthlyContribution) },
          { label: 'Expected Return', value: `${expectedReturn}%` },
          { label: 'Investment Period', value: `${investmentYears} years` },
          { label: 'Marginal Tax Rate', value: `${marginalTaxRate}%` },
        ]}
        results={[
          { label: 'Annual Limit Remaining', value: formatCurrency(results.annualRemaining) },
          { label: 'Lifetime Limit Remaining', value: formatCurrency(results.lifetimeRemaining) },
          { label: 'Projected TFSA Value', value: formatCurrency(results.finalTfsaBalance) },
          { label: 'Projected Taxable Value', value: formatCurrency(results.finalTaxableBalance) },
          { label: 'Total Tax Savings', value: formatCurrency(results.taxSavings) },
          { label: 'Years to Lifetime Limit', value: results.yearsToLifetimeLimit === Infinity ? 'N/A' : `${results.yearsToLifetimeLimit} years` },
        ]}
      />
    </div>
  );
};

export default TFSACalculator;
