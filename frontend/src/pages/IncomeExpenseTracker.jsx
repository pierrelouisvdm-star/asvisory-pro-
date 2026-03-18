import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Receipt,
  PiggyBank, Car, Home, ShoppingCart, Utensils, Zap, Phone,
  GraduationCap, Heart, Plane, Gift, BarChart3, Calendar,
  Download, Filter, ArrowUpRight, ArrowDownRight, CheckCircle2,
  AlertCircle, Tag, RefreshCw, FileText
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';
import { CalculatorGate } from '../components/FeatureGate';
import { toast } from 'sonner';

// Expense categories with icons and colors
const EXPENSE_CATEGORIES = [
  { id: 'housing', name: 'Housing', icon: Home, color: 'blue', taxDeductible: false },
  { id: 'transport', name: 'Transport', icon: Car, color: 'amber', taxDeductible: false },
  { id: 'food', name: 'Food & Groceries', icon: Utensils, color: 'orange', taxDeductible: false },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'yellow', taxDeductible: false },
  { id: 'communication', name: 'Phone & Internet', icon: Phone, color: 'purple', taxDeductible: true },
  { id: 'education', name: 'Education', icon: GraduationCap, color: 'indigo', taxDeductible: true },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'red', taxDeductible: true },
  { id: 'entertainment', name: 'Entertainment', icon: Gift, color: 'pink', taxDeductible: false },
  { id: 'travel', name: 'Travel', icon: Plane, color: 'cyan', taxDeductible: false },
  { id: 'shopping', name: 'Shopping', icon: ShoppingCart, color: 'emerald', taxDeductible: false },
  { id: 'business', name: 'Business Expense', icon: Receipt, color: 'slate', taxDeductible: true },
  { id: 'other', name: 'Other', icon: Tag, color: 'gray', taxDeductible: false },
];

// Income categories
const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salary', icon: Wallet, color: 'emerald' },
  { id: 'bonus', name: 'Bonus', icon: Gift, color: 'amber' },
  { id: 'investment', name: 'Investment Returns', icon: TrendingUp, color: 'blue' },
  { id: 'rental', name: 'Rental Income', icon: Home, color: 'purple' },
  { id: 'freelance', name: 'Freelance/Side Income', icon: Receipt, color: 'indigo' },
  { id: 'other', name: 'Other Income', icon: Tag, color: 'gray' },
];

// Standalone Input component
const TrackerInput = ({ label, id, value, onChange, prefix, type = 'number', placeholder }) => {
  const [localValue, setLocalValue] = useState(String(value || ''));
  
  useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    if (type === 'number') {
      if (inputValue === '' || inputValue === '-') {
        onChange(0);
      } else {
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) onChange(parsed);
      }
    } else {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    if (type === 'number') {
      const parsed = parseFloat(localValue);
      if (isNaN(parsed) || localValue === '') {
        setLocalValue('0');
        onChange(0);
      } else {
        setLocalValue(String(parsed));
      }
    }
  };

  return (
    <div className="space-y-1">
      {label && <Label htmlFor={id} className="text-sm text-slate-300">{label}</Label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        )}
        <Input
          id={id}
          type={type === 'number' ? 'number' : 'text'}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`bg-navy-800 border-navy-600 text-white ${prefix ? 'pl-8' : ''}`}
        />
      </div>
    </div>
  );
};

const IncomeExpenseTrackerContent = () => {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Transactions state
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('incomeExpenseTransactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Budget state
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('incomeExpenseBudgets');
    return saved ? JSON.parse(saved) : EXPENSE_CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] = 0;
      return acc;
    }, {});
  });
  
  // New transaction form
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: 0,
    category: 'other',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    isRecurring: false,
    taxDeductible: false,
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('incomeExpenseTransactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('incomeExpenseBudgets', JSON.stringify(budgets));
  }, [budgets]);

  // Filter transactions by month
  const filteredTransactions = transactions.filter(t => 
    t.date.startsWith(selectedMonth)
  );

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') {
      acc.income += t.amount;
    } else {
      acc.expenses += t.amount;
      if (t.taxDeductible) {
        acc.taxDeductible += t.amount;
      }
      acc.byCategory[t.category] = (acc.byCategory[t.category] || 0) + t.amount;
    }
    return acc;
  }, { income: 0, expenses: 0, taxDeductible: 0, byCategory: {} });

  const netIncome = totals.income - totals.expenses;
  const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income) * 100 : 0;

  // Add transaction
  const addTransaction = () => {
    if (newTransaction.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const transaction = {
      ...newTransaction,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    setTransactions([transaction, ...transactions]);
    setNewTransaction({
      type: 'expense',
      amount: 0,
      category: 'other',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      isRecurring: false,
      taxDeductible: false,
    });
    
    toast.success(`${newTransaction.type === 'income' ? 'Income' : 'Expense'} added successfully`);
  };

  // Delete transaction
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success('Transaction deleted');
  };

  // Get category info
  const getCategoryInfo = (categoryId, type) => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find(c => c.id === categoryId) || categories[categories.length - 1];
  };

  // Generate months for selector
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }

  return (
    <div className="space-y-6" data-testid="income-expense-tracker">
      <Disclaimer />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="h-7 w-7 text-emerald-400" />
            Income & Expense Tracker
          </h1>
          <p className="text-slate-400 mt-1">Track your finances, set budgets, and identify tax-deductible expenses</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px] bg-navy-800 border-navy-600">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-900/50 to-navy-900 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-300">Total Income</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totals.income)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-navy-900 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totals.expenses)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${netIncome >= 0 ? 'from-blue-900/50' : 'from-amber-900/50'} to-navy-900 border-${netIncome >= 0 ? 'blue' : 'amber'}-500/30`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full ${netIncome >= 0 ? 'bg-blue-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
                <PiggyBank className={`h-5 w-5 ${netIncome >= 0 ? 'text-blue-400' : 'text-amber-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-navy-900 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Tax Deductible</p>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(totals.taxDeductible)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Rate */}
      <Card className="bg-navy-900/50 border-navy-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Savings Rate</span>
            <span className={`text-sm font-medium ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, savingsRate))} 
            className="h-2"
          />
          <p className="text-xs text-slate-500 mt-2">
            {savingsRate >= 20 ? 'Excellent! You\'re saving more than 20% of your income.' :
             savingsRate >= 10 ? 'Good progress! Aim for 20% savings rate.' :
             'Consider reducing expenses to improve your savings rate.'}
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-navy-800 border border-navy-700 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-emerald-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-emerald-500/20">
            <FileText className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-emerald-500/20">
            <PiggyBank className="h-4 w-4 mr-2" />
            Budget
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Expense by Category */}
            <Card className="bg-navy-900/50 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {EXPENSE_CATEGORIES.map(category => {
                  const amount = totals.byCategory[category.id] || 0;
                  const percentage = totals.expenses > 0 ? (amount / totals.expenses) * 100 : 0;
                  const Icon = category.icon;
                  
                  if (amount === 0) return null;
                  
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 text-${category.color}-400`} />
                          <span className="text-sm text-slate-300">{category.name}</span>
                          {category.taxDeductible && (
                            <Badge className="text-xs bg-purple-500/20 text-purple-300">Tax Deductible</Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium text-white">{formatCurrency(amount)}</span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
                {totals.expenses === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No expenses recorded this month</p>
                )}
              </CardContent>
            </Card>

            {/* Budget vs Actual */}
            <Card className="bg-navy-900/50 border-navy-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Budget vs Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {EXPENSE_CATEGORIES.filter(c => budgets[c.id] > 0).map(category => {
                  const actual = totals.byCategory[category.id] || 0;
                  const budget = budgets[category.id];
                  const percentage = budget > 0 ? (actual / budget) * 100 : 0;
                  const isOver = actual > budget;
                  const Icon = category.icon;
                  
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 text-${category.color}-400`} />
                          <span className="text-sm text-slate-300">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatCurrency(actual)}
                          </span>
                          <span className="text-xs text-slate-500"> / {formatCurrency(budget)}</span>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, percentage)} 
                        className={`h-1.5 ${isOver ? '[&>div]:bg-red-500' : ''}`}
                      />
                      {isOver && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Over budget by {formatCurrency(actual - budget)}
                        </p>
                      )}
                    </div>
                  );
                })}
                {Object.values(budgets).every(b => b === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Set budgets in the Budget tab to track your spending
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tax Deductible Summary */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-navy-900 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Tax Deductible Expenses</h3>
                  <p className="text-slate-400 text-sm mb-3">
                    You have {formatCurrency(totals.taxDeductible)} in potentially tax-deductible expenses this month.
                    Categories like business expenses, education, healthcare, and work-related phone/internet may qualify.
                  </p>
                  <Badge className="bg-purple-500/20 text-purple-300">
                    Potential tax saving: {formatCurrency(totals.taxDeductible * 0.31)} (at 31% marginal rate)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Transaction Tab */}
        <TabsContent value="add" className="space-y-6">
          <Card className="bg-navy-900/50 border-navy-700">
            <CardHeader>
              <CardTitle className="text-white">Add New Transaction</CardTitle>
              <CardDescription>Record your income or expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Type */}
              <div className="flex gap-4">
                <Button
                  variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                  className={newTransaction.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-navy-600'}
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category: 'salary' })}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Income
                </Button>
                <Button
                  variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                  className={newTransaction.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'border-navy-600'}
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category: 'other' })}
                >
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Expense
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Amount */}
                <TrackerInput
                  label="Amount"
                  id="amount"
                  value={newTransaction.amount}
                  onChange={(val) => setNewTransaction({ ...newTransaction, amount: val })}
                  prefix={currencySymbol}
                />

                {/* Date */}
                <div className="space-y-1">
                  <Label className="text-sm text-slate-300">Date</Label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="bg-navy-800 border-navy-600 text-white"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <Label className="text-sm text-slate-300">Category</Label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(val) => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === val);
                      setNewTransaction({ 
                        ...newTransaction, 
                        category: val,
                        taxDeductible: cat?.taxDeductible || false
                      });
                    }}
                  >
                    <SelectTrigger className="bg-navy-800 border-navy-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 text-${cat.color}-400`} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <TrackerInput
                  label="Description (optional)"
                  id="description"
                  value={newTransaction.description}
                  onChange={(val) => setNewTransaction({ ...newTransaction, description: val })}
                  type="text"
                  placeholder="e.g., Grocery shopping"
                />
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTransaction.isRecurring}
                    onCheckedChange={(checked) => setNewTransaction({ ...newTransaction, isRecurring: checked })}
                  />
                  <Label className="text-sm text-slate-300">
                    <RefreshCw className="h-4 w-4 inline mr-1" />
                    Recurring monthly
                  </Label>
                </div>
                
                {newTransaction.type === 'expense' && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newTransaction.taxDeductible}
                      onCheckedChange={(checked) => setNewTransaction({ ...newTransaction, taxDeductible: checked })}
                    />
                    <Label className="text-sm text-slate-300">
                      <Receipt className="h-4 w-4 inline mr-1" />
                      Tax deductible
                    </Label>
                  </div>
                )}
              </div>

              <Button onClick={addTransaction} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-navy-900/50 border-navy-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Transaction History</span>
                <Badge>{filteredTransactions.length} transactions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No transactions recorded for this month</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredTransactions.map(transaction => {
                    const category = getCategoryInfo(transaction.category, transaction.type);
                    const Icon = category.icon;
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-navy-800/50 border border-navy-700 hover:border-navy-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full bg-${category.color}-500/20 flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 text-${category.color}-400`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{category.name}</p>
                              {transaction.isRecurring && (
                                <RefreshCw className="h-3 w-3 text-slate-500" />
                              )}
                              {transaction.taxDeductible && (
                                <Badge className="text-xs bg-purple-500/20 text-purple-300">Tax</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {transaction.description || new Date(transaction.date).toLocaleDateString('en-ZA')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`font-semibold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-6">
          <Card className="bg-navy-900/50 border-navy-700">
            <CardHeader>
              <CardTitle className="text-white">Monthly Budgets</CardTitle>
              <CardDescription>Set spending limits for each category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {EXPENSE_CATEGORIES.map(category => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full bg-${category.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 text-${category.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm text-slate-300">{category.name}</Label>
                      <Input
                        type="number"
                        value={budgets[category.id] || ''}
                        onChange={(e) => setBudgets({ ...budgets, [category.id]: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="bg-navy-800 border-navy-600 text-white mt-1"
                      />
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-navy-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Monthly Budget</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(Object.values(budgets).reduce((a, b) => a + b, 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Report */}
      <PrintReport
        title="Income & Expense Report"
        calculatorType="Income & Expense Tracker"
        inputs={[
          { label: 'Period', value: new Date(selectedMonth + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) },
          { label: 'Total Transactions', value: filteredTransactions.length.toString() },
        ]}
        results={[
          { label: 'Total Income', value: formatCurrency(totals.income) },
          { label: 'Total Expenses', value: formatCurrency(totals.expenses) },
          { label: 'Net Income', value: formatCurrency(netIncome) },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%` },
          { label: 'Tax Deductible Expenses', value: formatCurrency(totals.taxDeductible) },
        ]}
      />
    </div>
  );
};

// Wrap with CalculatorGate for premium access
const IncomeExpenseTracker = () => {
  return (
    <CalculatorGate path="/income-expense-tracker">
      <IncomeExpenseTrackerContent />
    </CalculatorGate>
  );
};

export default IncomeExpenseTracker;
