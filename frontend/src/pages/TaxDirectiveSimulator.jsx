import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, FileText, AlertCircle, CheckCircle2, 
  TrendingDown, Lightbulb, Plus, Trash2, Info,
  Download, PiggyBank, Briefcase, Heart, UserMinus
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';

// SARS Tax Tables 2024/25
const RETIREMENT_TAX_TABLE = [
  { min: 0, max: 550000, rate: 0, base: 0 },
  { min: 550001, max: 770000, rate: 0.18, base: 0 },
  { min: 770001, max: 1155000, rate: 0.27, base: 39600 },
  { min: 1155001, max: Infinity, rate: 0.36, base: 143550 },
];

const WITHDRAWAL_TAX_TABLE = [
  { min: 0, max: 27500, rate: 0, base: 0 },
  { min: 27501, max: 726000, rate: 0.18, base: 0 },
  { min: 726001, max: 1089000, rate: 0.27, base: 125730 },
  { min: 1089001, max: Infinity, rate: 0.36, base: 223740 },
];

const withdrawalTypes = [
  { value: 'retirement', label: 'Retirement (55+)', icon: PiggyBank, description: 'Normal retirement at age 55 or older' },
  { value: 'retrenchment', label: 'Retrenchment', icon: Briefcase, description: 'Involuntary termination of employment' },
  { value: 'death', label: 'Death Benefit', icon: Heart, description: 'Benefit paid to beneficiaries' },
  { value: 'withdrawal', label: 'Withdrawal (Before 55)', icon: UserMinus, description: 'Early withdrawal or resignation' },
];

const TaxDirectiveSimulator = () => {
  const { formatCurrency, currency } = useCurrency();
  
  const [withdrawalType, setWithdrawalType] = useState('retirement');
  const [currentAmount, setCurrentAmount] = useState('');
  const [previousRetirementWithdrawals, setPreviousRetirementWithdrawals] = useState([]);
  const [previousEarlyWithdrawals, setPreviousEarlyWithdrawals] = useState([]);
  const [newPrevRetirement, setNewPrevRetirement] = useState('');
  const [newPrevEarly, setNewPrevEarly] = useState('');
  const [results, setResults] = useState(null);

  const addPreviousRetirement = () => {
    if (newPrevRetirement && parseFloat(newPrevRetirement) > 0) {
      setPreviousRetirementWithdrawals([...previousRetirementWithdrawals, parseFloat(newPrevRetirement)]);
      setNewPrevRetirement('');
    }
  };

  const addPreviousEarly = () => {
    if (newPrevEarly && parseFloat(newPrevEarly) > 0) {
      setPreviousEarlyWithdrawals([...previousEarlyWithdrawals, parseFloat(newPrevEarly)]);
      setNewPrevEarly('');
    }
  };

  const removePreviousRetirement = (index) => {
    setPreviousRetirementWithdrawals(previousRetirementWithdrawals.filter((_, i) => i !== index));
  };

  const removePreviousEarly = (index) => {
    setPreviousEarlyWithdrawals(previousEarlyWithdrawals.filter((_, i) => i !== index));
  };

  const calculateTax = (amount, taxTable, threshold) => {
    if (amount <= 0) return { tax: 0, effectiveRate: 0, bracket: taxTable[0] };
    
    for (let i = taxTable.length - 1; i >= 0; i--) {
      const bracket = taxTable[i];
      if (amount >= bracket.min) {
        let tax = 0;
        if (i === 0) {
          tax = 0;
        } else {
          const taxableAboveThreshold = amount - taxTable[i].min + 1;
          tax = bracket.base + (taxableAboveThreshold * bracket.rate);
        }
        const effectiveRate = amount > 0 ? (tax / amount) * 100 : 0;
        return { tax: Math.max(0, tax), effectiveRate, bracket };
      }
    }
    return { tax: 0, effectiveRate: 0, bracket: taxTable[0] };
  };

  const runSimulation = () => {
    const amount = parseFloat(currentAmount) || 0;
    if (amount <= 0) return;

    const totalPrevRetirement = previousRetirementWithdrawals.reduce((sum, w) => sum + w, 0);
    const totalPrevEarly = previousEarlyWithdrawals.reduce((sum, w) => sum + w, 0);

    let taxTable, totalPrevious, taxFreeThreshold;
    
    if (withdrawalType === 'withdrawal') {
      // Early withdrawal uses withdrawal tax table
      taxTable = WITHDRAWAL_TAX_TABLE;
      totalPrevious = totalPrevEarly;
      taxFreeThreshold = 27500;
    } else {
      // Retirement, Retrenchment, Death use retirement tax table
      taxTable = RETIREMENT_TAX_TABLE;
      totalPrevious = totalPrevRetirement;
      taxFreeThreshold = 550000;
    }

    // Calculate tax on previous withdrawals alone
    const prevTaxResult = calculateTax(totalPrevious, taxTable, taxFreeThreshold);
    
    // Calculate tax on combined total (previous + current)
    const combinedTotal = totalPrevious + amount;
    const combinedTaxResult = calculateTax(combinedTotal, taxTable, taxFreeThreshold);
    
    // Tax on current withdrawal = Combined tax - Previous tax
    const currentTax = Math.max(0, combinedTaxResult.tax - prevTaxResult.tax);
    const effectiveRate = amount > 0 ? (currentTax / amount) * 100 : 0;
    
    // Calculate net amount after tax
    const netAmount = amount - currentTax;
    
    // Calculate remaining tax-free amount
    const usedTaxFree = Math.min(totalPrevious, taxFreeThreshold);
    const remainingTaxFree = Math.max(0, taxFreeThreshold - usedTaxFree);
    const taxFreeOnCurrent = Math.min(remainingTaxFree, amount);
    const taxableOnCurrent = Math.max(0, amount - taxFreeOnCurrent);

    // Optimization suggestions
    const suggestions = [];
    
    if (remainingTaxFree > 0 && amount > remainingTaxFree) {
      suggestions.push({
        type: 'optimize',
        title: 'Consider Splitting Withdrawal',
        description: `You have ${formatCurrency(remainingTaxFree)} of tax-free allowance remaining. Consider taking only the tax-free portion now if you don't need the full amount immediately.`
      });
    }
    
    if (withdrawalType === 'retirement' && effectiveRate > 20) {
      suggestions.push({
        type: 'warning',
        title: 'High Effective Tax Rate',
        description: `Your effective tax rate is ${effectiveRate.toFixed(1)}%. Consider taking a smaller lump sum and transferring more to a living annuity for tax-efficient income.`
      });
    }

    if (totalPrevious > 0) {
      suggestions.push({
        type: 'info',
        title: 'Previous Withdrawals Impact',
        description: `Your previous withdrawals of ${formatCurrency(totalPrevious)} have reduced your tax-free threshold. This is factored into your current calculation.`
      });
    }

    if (withdrawalType === 'retirement' && taxableOnCurrent > 0) {
      const optimalAmount = remainingTaxFree;
      if (optimalAmount > 0 && optimalAmount < amount) {
        suggestions.push({
          type: 'optimize',
          title: 'Tax-Free Optimal Amount',
          description: `To pay zero tax, consider withdrawing only ${formatCurrency(optimalAmount)}. Any amount above this will be taxed.`
        });
      }
    }

    setResults({
      withdrawalType,
      currentAmount: amount,
      totalPrevious,
      combinedTotal,
      taxFreeThreshold,
      remainingTaxFree,
      taxFreeOnCurrent,
      taxableOnCurrent,
      currentTax,
      effectiveRate,
      netAmount,
      suggestions,
      taxTable: withdrawalType === 'withdrawal' ? 'Withdrawal' : 'Retirement/Retrenchment/Death',
      marginalRate: combinedTaxResult.bracket.rate * 100,
    });
  };

  const resetForm = () => {
    setCurrentAmount('');
    setPreviousRetirementWithdrawals([]);
    setPreviousEarlyWithdrawals([]);
    setResults(null);
  };

  const getTypeIcon = (type) => {
    const found = withdrawalTypes.find(t => t.value === type);
    return found ? found.icon : PiggyBank;
  };

  const TypeIcon = getTypeIcon(withdrawalType);

  return (
    <div className="space-y-6" data-testid="tax-directive-simulator">
      <Disclaimer />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calculator className="h-7 w-7 text-emerald-400" />
            Tax Directive Simulator
          </h1>
          <p className="text-slate-400 mt-1">
            Simulate SARS tax directives for retirement fund withdrawals
          </p>
        </div>
        {results && (
          <PrintReport
            title="Tax Directive Simulation"
            calculatorType="Tax Directive"
            inputs={[
              { label: 'Withdrawal Type', value: withdrawalTypes.find(t => t.value === results.withdrawalType)?.label || '' },
              { label: 'Withdrawal Amount', value: formatCurrency(results.currentAmount) },
              { label: 'Previous Withdrawals', value: formatCurrency(results.totalPrevious) },
              { label: 'Tax Table Applied', value: results.taxTable },
            ]}
            results={[
              { label: 'Tax-Free Threshold', value: formatCurrency(results.taxFreeThreshold) },
              { label: 'Remaining Tax-Free', value: formatCurrency(results.remainingTaxFree) },
              { label: 'Taxable Amount', value: formatCurrency(results.taxableOnCurrent) },
              { label: 'Estimated Tax', value: formatCurrency(results.currentTax) },
              { label: 'Net Amount After Tax', value: formatCurrency(results.netAmount) },
              { label: 'Effective Tax Rate', value: `${results.effectiveRate.toFixed(2)}%` },
            ]}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Withdrawal Type Selection */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <TypeIcon className="h-5 w-5 text-emerald-400" />
                Withdrawal Type
              </CardTitle>
              <CardDescription>Select the type of withdrawal or benefit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {withdrawalTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setWithdrawalType(type.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      withdrawalType === type.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-navy-600 bg-navy-800/50 hover:border-navy-500'
                    }`}
                    data-testid={`type-${type.value}`}
                  >
                    <type.icon className={`h-5 w-5 mb-2 ${
                      withdrawalType === type.value ? 'text-emerald-400' : 'text-slate-400'
                    }`} />
                    <p className={`font-medium text-sm ${
                      withdrawalType === type.value ? 'text-white' : 'text-slate-300'
                    }`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Withdrawal Amount */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Current Withdrawal</CardTitle>
              <CardDescription>Enter the lump sum amount to withdraw</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Lump Sum Amount ({currency})</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  placeholder="e.g., 500000"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="bg-navy-800 border-navy-600 text-white"
                  data-testid="current-amount-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Previous Withdrawals */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Previous Withdrawals
              </CardTitle>
              <CardDescription>
                Add any previous withdrawals from retirement funds. These affect your tax-free thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="retirement" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-navy-800">
                  <TabsTrigger value="retirement" className="data-[state=active]:bg-emerald-500/20">
                    At Retirement
                  </TabsTrigger>
                  <TabsTrigger value="early" className="data-[state=active]:bg-emerald-500/20">
                    Before Retirement
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="retirement" className="space-y-4 mt-4">
                  <p className="text-xs text-slate-400">
                    Previous lump sums taken at retirement, retrenchment, or death benefits.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={newPrevRetirement}
                      onChange={(e) => setNewPrevRetirement(e.target.value)}
                      className="bg-navy-800 border-navy-600 text-white"
                      data-testid="prev-retirement-input"
                    />
                    <Button onClick={addPreviousRetirement} size="icon" className="bg-emerald-600 hover:bg-emerald-500">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {previousRetirementWithdrawals.length > 0 && (
                    <div className="space-y-2">
                      {previousRetirementWithdrawals.map((amount, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-navy-800 rounded-lg">
                          <span className="text-slate-300">{formatCurrency(amount)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removePreviousRetirement(index)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-navy-700">
                        <p className="text-sm text-slate-400">
                          Total: <span className="text-white font-medium">
                            {formatCurrency(previousRetirementWithdrawals.reduce((s, w) => s + w, 0))}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="early" className="space-y-4 mt-4">
                  <p className="text-xs text-slate-400">
                    Previous withdrawals before age 55 (resignation, RA surrenders, etc.)
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={newPrevEarly}
                      onChange={(e) => setNewPrevEarly(e.target.value)}
                      className="bg-navy-800 border-navy-600 text-white"
                      data-testid="prev-early-input"
                    />
                    <Button onClick={addPreviousEarly} size="icon" className="bg-emerald-600 hover:bg-emerald-500">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {previousEarlyWithdrawals.length > 0 && (
                    <div className="space-y-2">
                      {previousEarlyWithdrawals.map((amount, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-navy-800 rounded-lg">
                          <span className="text-slate-300">{formatCurrency(amount)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removePreviousEarly(index)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-navy-700">
                        <p className="text-sm text-slate-400">
                          Total: <span className="text-white font-medium">
                            {formatCurrency(previousEarlyWithdrawals.reduce((s, w) => s + w, 0))}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={runSimulation} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              disabled={!currentAmount || parseFloat(currentAmount) <= 0}
              data-testid="simulate-btn"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Simulate Tax Directive
            </Button>
            <Button 
              onClick={resetForm} 
              variant="outline" 
              className="border-navy-600 text-slate-300 hover:bg-navy-800"
              data-testid="reset-btn"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!results ? (
            <Card className="bg-navy-900/60 border-navy-700 h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-12">
                <Calculator className="h-16 w-16 text-navy-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Enter withdrawal details and click "Simulate" to see your tax calculation
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tax Summary Card */}
              <Card className="bg-gradient-to-br from-emerald-500/10 to-navy-900 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    Tax Directive Simulation Result
                  </CardTitle>
                  <Badge variant="outline" className="w-fit border-emerald-500/50 text-emerald-400">
                    {withdrawalTypes.find(t => t.value === results.withdrawalType)?.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Result */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Withdrawal Amount</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(results.currentAmount)}</p>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">Estimated Tax</p>
                      <p className="text-2xl font-bold text-red-400">{formatCurrency(results.currentTax)}</p>
                    </div>
                  </div>

                  {/* Net Amount */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-sm text-emerald-400">Net Amount After Tax</p>
                    <p className="text-3xl font-bold text-emerald-400">{formatCurrency(results.netAmount)}</p>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-300">Tax Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tax Table Applied</span>
                        <span className="text-white">{results.taxTable}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tax-Free Threshold</span>
                        <span className="text-white">{formatCurrency(results.taxFreeThreshold)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Previous Withdrawals</span>
                        <span className="text-white">{formatCurrency(results.totalPrevious)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Remaining Tax-Free</span>
                        <span className="text-emerald-400">{formatCurrency(results.remainingTaxFree)}</span>
                      </div>
                      <div className="flex justify-between border-t border-navy-700 pt-2">
                        <span className="text-slate-400">Tax-Free on Current</span>
                        <span className="text-emerald-400">{formatCurrency(results.taxFreeOnCurrent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taxable on Current</span>
                        <span className="text-amber-400">{formatCurrency(results.taxableOnCurrent)}</span>
                      </div>
                      <div className="flex justify-between border-t border-navy-700 pt-2">
                        <span className="text-slate-400">Effective Tax Rate</span>
                        <span className="text-white font-medium">{results.effectiveRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Marginal Tax Rate</span>
                        <span className="text-white font-medium">{results.marginalRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {results.suggestions.length > 0 && (
                <Card className="bg-navy-900/60 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-400" />
                      Insights & Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.suggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border ${
                          suggestion.type === 'optimize' 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : suggestion.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        <p className={`font-medium text-sm mb-1 ${
                          suggestion.type === 'optimize' 
                            ? 'text-emerald-400' 
                            : suggestion.type === 'warning'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}>
                          {suggestion.title}
                        </p>
                        <p className="text-sm text-slate-300">{suggestion.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tax Tables Reference */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">SARS Tax Tables 2024/25</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="retirement-table">
                    <TabsList className="grid w-full grid-cols-2 bg-navy-800">
                      <TabsTrigger value="retirement-table" className="data-[state=active]:bg-emerald-500/20 text-xs">
                        Retirement/Death
                      </TabsTrigger>
                      <TabsTrigger value="withdrawal-table" className="data-[state=active]:bg-emerald-500/20 text-xs">
                        Withdrawal
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="retirement-table" className="mt-4">
                      <div className="text-xs space-y-1">
                        <div className="grid grid-cols-2 gap-2 p-2 bg-navy-800 rounded font-medium text-slate-300">
                          <span>Taxable Income</span>
                          <span>Rate</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R0 - R550,000</span>
                          <span className="text-emerald-400">0%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R550,001 - R770,000</span>
                          <span>18% above R550,000</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R770,001 - R1,155,000</span>
                          <span>R39,600 + 27%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R1,155,001+</span>
                          <span>R143,550 + 36%</span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="withdrawal-table" className="mt-4">
                      <div className="text-xs space-y-1">
                        <div className="grid grid-cols-2 gap-2 p-2 bg-navy-800 rounded font-medium text-slate-300">
                          <span>Taxable Income</span>
                          <span>Rate</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R0 - R27,500</span>
                          <span className="text-emerald-400">0%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R27,501 - R726,000</span>
                          <span>18% above R27,500</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R726,001 - R1,089,000</span>
                          <span>R125,730 + 27%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 text-slate-400">
                          <span>R1,089,001+</span>
                          <span>R223,740 + 36%</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Print Report */}
      {results && (
        <PrintReport
          title="Tax Directive Simulation"
          calculatorType="Tax Directive"
          inputs={[
            { label: 'Withdrawal Type', value: withdrawalTypes.find(t => t.value === results.withdrawalType)?.label || '' },
            { label: 'Withdrawal Amount', value: formatCurrency(results.currentAmount) },
            { label: 'Previous Withdrawals', value: formatCurrency(results.totalPrevious) },
            { label: 'Tax Table Applied', value: results.taxTable },
          ]}
          results={[
            { label: 'Tax-Free Threshold', value: formatCurrency(results.taxFreeThreshold) },
            { label: 'Remaining Tax-Free', value: formatCurrency(results.remainingTaxFree) },
            { label: 'Taxable Amount', value: formatCurrency(results.taxableOnCurrent) },
            { label: 'Estimated Tax', value: formatCurrency(results.currentTax) },
            { label: 'Net Amount After Tax', value: formatCurrency(results.netAmount) },
            { label: 'Effective Tax Rate', value: `${results.effectiveRate.toFixed(2)}%` },
          ]}
        />
      )}
    </div>
  );
};

export default TaxDirectiveSimulator;
