import React, { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  GitCompare, Plus, Trash2, Trophy, Calculator, TrendingDown, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const calculateLoan = (principal, rate, termMonths, fees = 0) => {
  const monthlyRate = rate / 100 / 12;
  let monthlyPayment;
  
  if (monthlyRate > 0 && termMonths > 0) {
    monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  } else {
    monthlyPayment = principal / termMonths;
  }
  
  const totalPayment = (monthlyPayment * termMonths) + fees;
  const totalInterest = totalPayment - principal - fees;
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
};

export const LoanComparisonTool = () => {
  const { currentCurrency } = useCurrency();
  const currencySymbol = currentCurrency.symbol;

  const [loans, setLoans] = useState([
    { id: 1, name: 'Bank A', principal: 1000000, rate: 11.5, term: 240, fees: 5000 },
    { id: 2, name: 'Bank B', principal: 1000000, rate: 12.0, term: 240, fees: 2500 },
  ]);

  const addLoan = () => {
    setLoans([...loans, {
      id: Date.now(),
      name: `Option ${loans.length + 1}`,
      principal: 1000000,
      rate: 11,
      term: 240,
      fees: 0,
    }]);
  };

  const removeLoan = (id) => {
    if (loans.length > 1) {
      setLoans(loans.filter(l => l.id !== id));
    }
  };

  const updateLoan = (id, field, value) => {
    setLoans(loans.map(l => 
      l.id === id ? { ...l, [field]: field === 'name' ? value : parseFloat(value) || 0 } : l
    ));
  };

  // Calculate all loans
  const calculatedLoans = loans.map(loan => ({
    ...loan,
    ...calculateLoan(loan.principal, loan.rate, loan.term, loan.fees),
  }));

  // Find best option (lowest total cost)
  const bestLoan = calculatedLoans.reduce((best, loan) => 
    loan.totalPayment < best.totalPayment ? loan : best
  , calculatedLoans[0]);

  return (
    <div className="min-h-screen bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
            <GitCompare className="h-3 w-3 mr-1" />
            Comparison Tool
          </Badge>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Loan Comparison Calculator
          </h1>
          <p className="text-slate-500 mt-2">
            Compare multiple loan offers side by side to find the best option
          </p>
        </div>

        {/* Loan Inputs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loans.map((loan) => (
            <Card key={loan.id} className={cn(
              "transition-all",
              bestLoan.id === loan.id && calculatedLoans.length > 1 && "ring-2 ring-emerald-500"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={loan.name}
                    onChange={(e) => updateLoan(loan.id, 'name', e.target.value)}
                    className="font-semibold text-lg border-0 px-0 focus-visible:ring-0"
                  />
                  {loans.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeLoan(loan.id)}>
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  )}
                </div>
                {bestLoan.id === loan.id && calculatedLoans.length > 1 && (
                  <Badge className="bg-emerald-100 text-emerald-700 w-fit">
                    <Trophy className="h-3 w-3 mr-1" />
                    Best Option
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Loan Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                    <Input
                      type="number"
                      value={loan.principal}
                      onChange={(e) => updateLoan(loan.id, 'principal', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Interest Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={loan.rate}
                      onChange={(e) => updateLoan(loan.id, 'rate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Term (months)</Label>
                    <Input
                      type="number"
                      value={loan.term}
                      onChange={(e) => updateLoan(loan.id, 'term', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Fees & Costs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                    <Input
                      type="number"
                      value={loan.fees}
                      onChange={(e) => updateLoan(loan.id, 'fees', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Loan Button */}
          {loans.length < 5 && (
            <Card 
              className="border-dashed cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors flex items-center justify-center min-h-[300px]"
              onClick={addLoan}
            >
              <CardContent className="text-center">
                <Plus className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Add Another Option</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comparison Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Comparison Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Option</th>
                    <th className="text-right py-3 px-4">Monthly Payment</th>
                    <th className="text-right py-3 px-4">Total Interest</th>
                    <th className="text-right py-3 px-4">Total Cost</th>
                    <th className="text-right py-3 px-4">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedLoans.map((loan) => {
                    const difference = loan.totalPayment - bestLoan.totalPayment;
                    return (
                      <tr 
                        key={loan.id} 
                        className={cn(
                          "border-b",
                          loan.id === bestLoan.id && "bg-emerald-50 dark:bg-emerald-900/10"
                        )}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{loan.name}</span>
                            {loan.id === bestLoan.id && calculatedLoans.length > 1 && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Best</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-4 px-4 font-semibold">
                          {currencySymbol}{loan.monthlyPayment.toLocaleString()}
                        </td>
                        <td className="text-right py-4 px-4 text-slate-600">
                          {currencySymbol}{loan.totalInterest.toLocaleString()}
                        </td>
                        <td className="text-right py-4 px-4 font-semibold">
                          {currencySymbol}{loan.totalPayment.toLocaleString()}
                        </td>
                        <td className="text-right py-4 px-4">
                          {difference === 0 ? (
                            <span className="text-emerald-600 font-semibold">—</span>
                          ) : (
                            <span className="text-red-600">
                              +{currencySymbol}{difference.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {calculatedLoans.length > 1 && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                      Recommendation: {bestLoan.name}
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-1">
                      Choosing {bestLoan.name} saves you {currencySymbol}
                      {(Math.max(...calculatedLoans.map(l => l.totalPayment)) - bestLoan.totalPayment).toLocaleString()} 
                      {' '}compared to the most expensive option over the loan term.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
