import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, Percent, 
  PiggyBank, AlertTriangle, Info, Scale, BarChart3, Minus, Plus
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';

// InputField component OUTSIDE the main component to prevent re-creation on render
const EACInputField = ({ label, value, onChange, prefix, suffix, step = 1, min = 0, max }) => {
  const [localValue, setLocalValue] = useState(String(value || ''));
  const [isFocused, setIsFocused] = useState(false);
  
  // Only sync from parent when not focused (to prevent overwriting while typing)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value || ''));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    
    // Update parent immediately for calculations, but don't let parent override our local state
    if (inputValue === '' || inputValue === '-') {
      onChange(0);
    } else {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) onChange(parsed);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || localValue === '') {
      setLocalValue('0');
      onChange(0);
    } else {
      setLocalValue(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm text-slate-300">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        )}
        <Input
          type="number"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
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

// Fee input component OUTSIDE the main component
const EACFeeInput = ({ label, value, onChange, min = 0, max, step = 0.1 }) => {
  const [localValue, setLocalValue] = useState(String(value || ''));
  const [isFocused, setIsFocused] = useState(false);
  
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value || ''));
    }
  }, [value, isFocused]);

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

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || localValue === '') {
      setLocalValue('0');
      onChange(0);
    } else {
      setLocalValue(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <div>
      <Label className="text-xs text-slate-400">{label}</Label>
      <Input
        type="number"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="bg-navy-800 border-navy-600 text-white mt-1"
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
};

const FeeComparisonCalculator = () => {
  const { formatCurrency, symbol } = useCurrency();
  
  // Investment inputs
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [annualContributionIncrease, setAnnualContributionIncrease] = useState(0);
  const [investmentYears, setInvestmentYears] = useState(20);
  const [expectedReturn, setExpectedReturn] = useState(10);
  
  // Fee structures for comparison (2 options)
  const [options, setOptions] = useState([
    {
      name: 'Option A',
      ter: 0,           // Total Expense Ratio
      platformFee: 0,
      advisorFee: 0,
      performanceFee: 0,
    },
    {
      name: 'Option B',
      ter: 0,
      platformFee: 0,
      advisorFee: 0,
      performanceFee: 0,
    },
  ]);

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  // Calculate results for each option
  const results = useMemo(() => {
    return options.map((option, idx) => {
      const totalAnnualFee = option.ter + option.platformFee + option.advisorFee;
      const netReturn = (expectedReturn - totalAnnualFee) / 100;
      const monthlyReturn = netReturn / 12;
      
      // Also calculate without any fees for comparison
      const grossReturn = expectedReturn / 100;
      const monthlyGrossReturn = grossReturn / 12;
      
      const months = investmentYears * 12;
      
      // Calculate year-by-year growth with escalating contributions
      const yearlyData = [];
      let currentValueNet = initialInvestment;
      let currentValueGross = initialInvestment;
      let totalContributions = initialInvestment;
      let totalFeesLost = 0;
      let currentMonthlyContribution = monthlyContribution;
      
      for (let year = 1; year <= investmentYears; year++) {
        // Calculate for 12 months
        for (let month = 1; month <= 12; month++) {
          // Gross growth (no fees)
          currentValueGross = currentValueGross * (1 + monthlyGrossReturn) + currentMonthlyContribution;
          
          // Net growth (after fees)
          currentValueNet = currentValueNet * (1 + monthlyReturn) + currentMonthlyContribution;
          
          totalContributions += currentMonthlyContribution;
        }
        
        // Increase contribution for next year
        currentMonthlyContribution = currentMonthlyContribution * (1 + annualContributionIncrease / 100);
        
        totalFeesLost = currentValueGross - currentValueNet;
        
        yearlyData.push({
          year,
          valueNet: Math.round(currentValueNet),
          valueGross: Math.round(currentValueGross),
          feesLost: Math.round(totalFeesLost),
          contributions: Math.round(totalContributions),
        });
      }
      
      const finalValue = currentValueNet;
      const finalValueNoFees = currentValueGross;
      const totalFeesCost = finalValueNoFees - finalValue;
      const effectiveAnnualCost = totalAnnualFee;
      const feePercentOfFinal = (totalFeesCost / finalValueNoFees) * 100;
      
      return {
        ...option,
        index: idx,
        totalAnnualFee,
        netReturn: netReturn * 100,
        finalValue,
        finalValueNoFees,
        totalFeesCost,
        totalContributions,
        effectiveAnnualCost,
        feePercentOfFinal,
        yearlyData,
        growthAfterFees: finalValue - totalContributions,
        growthWithoutFees: finalValueNoFees - totalContributions,
      };
    });
  }, [options, initialInvestment, monthlyContribution, annualContributionIncrease, investmentYears, expectedReturn]);

  // Combined chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let year = 0; year <= investmentYears; year++) {
      const point = { year };
      results.forEach((result, idx) => {
        if (year === 0) {
          point[`option${idx}`] = initialInvestment;
        } else {
          point[`option${idx}`] = result.yearlyData[year - 1]?.valueNet || 0;
        }
      });
      // Add no-fee reference line
      if (year === 0) {
        point.noFees = initialInvestment;
      } else {
        point.noFees = results[0]?.yearlyData[year - 1]?.valueGross || 0;
      }
      data.push(point);
    }
    return data;
  }, [results, investmentYears, initialInvestment]);

  // Fee impact chart data
  const feeImpactData = results.map(r => ({
    name: r.name,
    finalValue: r.finalValue,
    feesLost: r.totalFeesCost,
    totalAnnualFee: r.totalAnnualFee,
  }));

  // Best and worst options
  const sortedByValue = [...results].sort((a, b) => b.finalValue - a.finalValue);
  const bestOption = sortedByValue[0];
  const worstOption = sortedByValue[sortedByValue.length - 1];
  const savingsFromBest = worstOption ? bestOption.finalValue - worstOption.finalValue : 0;

  const colors = ['#10b981', '#3b82f6'];

  return (
    <div className="space-y-6" data-testid="fee-comparison-calculator">
      <Disclaimer />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Scale className="h-7 w-7 text-emerald-400" />
            EAC / Fee Comparison Tool
          </h1>
          <p className="text-slate-400 mt-1">
            See how fees impact your investment returns over time
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
          Fee Impact Analysis
        </Badge>
      </div>

      {/* Key Insight Banner */}
      {savingsFromBest > 0 && (
        <Card className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Potential savings by choosing lower fees</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(savingsFromBest)}
                </p>
                <p className="text-xs text-slate-400">
                  {bestOption.name} vs {worstOption.name} over {investmentYears} years
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Investment Parameters */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-400" />
              Investment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputField
              label="Initial Investment"
              value={initialInvestment}
              onChange={setInitialInvestment}
              prefix={symbol}
              step={10000}
            />
            <InputField
              label="Monthly Contribution"
              value={monthlyContribution}
              onChange={setMonthlyContribution}
              prefix={symbol}
              step={500}
            />
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Annual Contribution Increase: {annualContributionIncrease}%</Label>
              <Slider
                value={[annualContributionIncrease]}
                onValueChange={([val]) => setAnnualContributionIncrease(val)}
                min={0}
                max={15}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-slate-500">Increase your monthly contribution each year to keep pace with inflation</p>
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
              <Label className="text-sm text-slate-300">Expected Annual Return (before fees): {expectedReturn}%</Label>
              <Slider
                value={[expectedReturn]}
                onValueChange={([val]) => setExpectedReturn(val)}
                min={4}
                max={15}
                step={0.5}
                className="mt-2"
              />
            </div>
            
            <div className="p-3 bg-navy-800 rounded-lg">
              <p className="text-xs text-slate-400">Total Contributions</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(results[0]?.totalContributions || 0)}
              </p>
              {annualContributionIncrease > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Including {annualContributionIncrease}% annual increase
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fee Structures */}
        <Card className="lg:col-span-2 bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Percent className="h-5 w-5 text-emerald-400" />
              Fee Structures to Compare
            </CardTitle>
            <CardDescription>Adjust the fee components for each option</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {options.map((option, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `${colors[idx]}10`,
                    borderColor: `${colors[idx]}50`
                  }}
                >
                  <Input
                    value={option.name}
                    onChange={(e) => updateOption(idx, 'name', e.target.value)}
                    className="bg-navy-800 border-navy-600 text-white font-medium mb-3"
                    placeholder="Option name"
                  />
                  
                  <div className="space-y-3">
                    <FeeInput
                      label="TER / Management Fee (%)"
                      value={option.ter}
                      onChange={(val) => updateOption(idx, 'ter', val)}
                      min={0}
                      max={5}
                      step={0.1}
                    />
                    <FeeInput
                      label="Platform Fee (%)"
                      value={option.platformFee}
                      onChange={(val) => updateOption(idx, 'platformFee', val)}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <FeeInput
                      label="Advisor Fee (%)"
                      value={option.advisorFee}
                      onChange={(val) => updateOption(idx, 'advisorFee', val)}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    
                    <div className="pt-2 border-t border-navy-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Total EAC</span>
                        <span 
                          className="text-lg font-bold"
                          style={{ color: colors[idx] }}
                        >
                          {(option.ter + option.platformFee + option.advisorFee).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Comparison */}
      <div className="grid lg:grid-cols-2 gap-4">
        {results.map((result, idx) => (
          <Card 
            key={idx}
            className={`border ${idx === 0 ? 'bg-gradient-to-br from-emerald-500/10 to-navy-900 border-emerald-500/30' : 'bg-navy-900/60 border-navy-700'}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">{result.name}</CardTitle>
                {result.finalValue === bestOption.finalValue && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                    Best Option
                  </Badge>
                )}
              </div>
              <CardDescription>EAC: {result.totalAnnualFee.toFixed(2)}% p.a.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-navy-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Final Value</p>
                <p className="text-2xl font-bold" style={{ color: colors[idx] }}>
                  {formatCurrency(result.finalValue)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-navy-800/50 rounded-lg">
                  <p className="text-xs text-slate-400">Growth</p>
                  <p className="text-sm font-medium text-emerald-400">
                    +{formatCurrency(result.growthAfterFees)}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-xs text-slate-400">Fees Cost</p>
                  <p className="text-sm font-medium text-red-400">
                    -{formatCurrency(result.totalFeesCost)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Net Return (after fees)</span>
                  <span className="text-white">{result.netReturn.toFixed(2)}% p.a.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fees as % of potential</span>
                  <span className="text-red-400">{result.feePercentOfFinal.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Value without fees</span>
                  <span className="text-slate-300">{formatCurrency(result.finalValueNoFees)}</span>
                </div>
              </div>
              
              {result.finalValue !== bestOption.finalValue && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-amber-400">
                      {formatCurrency(bestOption.finalValue - result.finalValue)} less than best option
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="bg-navy-800">
          <TabsTrigger value="growth">Growth Comparison</TabsTrigger>
          <TabsTrigger value="fees">Fee Impact</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Investment Growth Over Time</CardTitle>
              <CardDescription>Compare how each option grows over {investmentYears} years</CardDescription>
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
                      dataKey="noFees"
                      name="No Fees (Reference)"
                      stroke="#64748b"
                      fill="#64748b"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                    {results.map((result, idx) => (
                      <Area
                        key={idx}
                        type="monotone"
                        dataKey={`option${idx}`}
                        name={result.name}
                        stroke={colors[idx]}
                        fill={colors[idx]}
                        fillOpacity={0.2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Total Fees Lost to Costs</CardTitle>
              <CardDescription>Money lost to fees that could have been in your investment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeImpactData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8"
                      tickFormatter={(val) => `${symbol}${(val / 1000000).toFixed(1)}M`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#94a3b8"
                      width={150}
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
                    <Bar dataKey="finalValue" name="Final Value" fill="#10b981" />
                    <Bar dataKey="feesLost" name="Lost to Fees" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Fee Component Breakdown</CardTitle>
              <CardDescription>Annual cost breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {results.map((result, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-medium text-white">{result.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-navy-800 rounded">
                        <span className="text-sm text-slate-300">TER / Management</span>
                        <span className="text-white">{options[idx].ter.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-navy-800 rounded">
                        <span className="text-sm text-slate-300">Platform Fee</span>
                        <span className="text-white">{options[idx].platformFee.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-navy-800 rounded">
                        <span className="text-sm text-slate-300">Advisor Fee</span>
                        <span className="text-white">{options[idx].advisorFee.toFixed(2)}%</span>
                      </div>
                      <div 
                        className="flex justify-between items-center p-2 rounded font-medium"
                        style={{ backgroundColor: `${colors[idx]}20` }}
                      >
                        <span className="text-slate-200">Total EAC</span>
                        <span style={{ color: colors[idx] }}>{result.totalAnnualFee.toFixed(2)}%</span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-navy-700">
                      <p className="text-xs text-slate-400 mb-1">Impact over {investmentYears} years</p>
                      <p className="text-lg font-bold text-red-400">
                        -{formatCurrency(result.totalFeesCost)}
                      </p>
                      <p className="text-xs text-slate-400">
                        ({result.feePercentOfFinal.toFixed(1)}% of potential value)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Key Insights */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-400 mb-2">Understanding Fee Impact</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• <strong>TER (Total Expense Ratio)</strong> - The fund's internal costs including management fees</li>
                <li>• <strong>Platform Fee</strong> - Charged by your investment platform (LISP/LISP)</li>
                <li>• <strong>Advisor Fee</strong> - Ongoing advice fee charged by your financial advisor</li>
                <li>• A 1% difference in fees can cost you <strong>20-30%</strong> of your potential returns over 20+ years</li>
                <li>• Always compare the <strong>Effective Annual Cost (EAC)</strong> which includes all fees</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Report */}
      <PrintReport
        title="Fee Comparison Analysis"
        calculatorType="EAC / Fee Comparison Tool"
        inputs={[
          { label: 'Initial Investment', value: formatCurrency(initialInvestment) },
          { label: 'Monthly Contribution', value: formatCurrency(monthlyContribution) },
          { label: 'Investment Period', value: `${investmentYears} years` },
          { label: 'Expected Return (before fees)', value: `${expectedReturn}%` },
        ]}
        results={[
          { label: `${results[0]?.name} (EAC: ${results[0]?.totalAnnualFee.toFixed(2)}%)`, value: formatCurrency(results[0]?.finalValue) },
          { label: `${results[1]?.name} (EAC: ${results[1]?.totalAnnualFee.toFixed(2)}%)`, value: formatCurrency(results[1]?.finalValue) },
          { label: 'Difference', value: formatCurrency(savingsFromBest) },
          { label: 'Best Option', value: bestOption?.name },
        ]}
      />
    </div>
  );
};

export default FeeComparisonCalculator;
