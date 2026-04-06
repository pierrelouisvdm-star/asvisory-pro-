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
  AlertCircle, Tag, RefreshCw, FileText, Upload, Image, Eye, X, Paperclip, Loader2,
  ShieldPlus, Mic
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useJurisdiction } from '../context/JurisdictionContext';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';
import { CalculatorGate } from '../components/FeatureGate';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import VoiceTransactionRecorder from '../components/VoiceTransactionRecorder';
import VoiceReceiptAnalyzer from '../components/VoiceReceiptAnalyzer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// SA Expense categories
const SA_EXPENSE_CATEGORIES = [
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

// US Expense categories
const US_EXPENSE_CATEGORIES = [
  { id: 'housing', name: 'Housing / Rent', icon: Home, color: 'blue', taxDeductible: false },
  { id: 'transport', name: 'Transportation', icon: Car, color: 'amber', taxDeductible: false },
  { id: 'food', name: 'Food & Groceries', icon: Utensils, color: 'orange', taxDeductible: false },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'yellow', taxDeductible: false },
  { id: 'communication', name: 'Phone & Internet', icon: Phone, color: 'purple', taxDeductible: true },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'red', taxDeductible: true },
  { id: 'health_insurance', name: 'Health Insurance', icon: ShieldPlus, color: 'teal', taxDeductible: true },
  { id: 'retirement_401k', name: '401(k) Contribution', icon: PiggyBank, color: 'emerald', taxDeductible: true },
  { id: 'hsa', name: 'HSA Contribution', icon: ShieldPlus, color: 'cyan', taxDeductible: true },
  { id: 'education', name: 'Education / 529', icon: GraduationCap, color: 'indigo', taxDeductible: true },
  { id: 'entertainment', name: 'Entertainment', icon: Gift, color: 'pink', taxDeductible: false },
  { id: 'travel', name: 'Travel', icon: Plane, color: 'cyan', taxDeductible: false },
  { id: 'shopping', name: 'Shopping', icon: ShoppingCart, color: 'emerald', taxDeductible: false },
  { id: 'business', name: 'Business Expense', icon: Receipt, color: 'slate', taxDeductible: true },
  { id: 'other', name: 'Other', icon: Tag, color: 'gray', taxDeductible: false },
];

// SA Income categories
const SA_INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salary', icon: Wallet, color: 'emerald' },
  { id: 'bonus', name: 'Bonus', icon: Gift, color: 'amber' },
  { id: 'investment', name: 'Investment Returns', icon: TrendingUp, color: 'blue' },
  { id: 'rental', name: 'Rental Income', icon: Home, color: 'purple' },
  { id: 'freelance', name: 'Freelance/Side Income', icon: Receipt, color: 'indigo' },
  { id: 'other', name: 'Other Income', icon: Tag, color: 'gray' },
];

// US Income categories
const US_INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salary / W-2 Wages', icon: Wallet, color: 'emerald' },
  { id: 'bonus', name: 'Bonus', icon: Gift, color: 'amber' },
  { id: 'investment', name: 'Investment Returns', icon: TrendingUp, color: 'blue' },
  { id: 'rental', name: 'Rental Income', icon: Home, color: 'purple' },
  { id: 'freelance', name: '1099 / Freelance Income', icon: Receipt, color: 'indigo' },
  { id: 'social_security', name: 'Social Security', icon: ShieldPlus, color: 'teal' },
  { id: 'retirement_dist', name: '401(k) / IRA Distribution', icon: PiggyBank, color: 'cyan' },
  { id: 'other', name: 'Other Income', icon: Tag, color: 'gray' },
];

// Backward compatibility — these will be replaced by jurisdiction-aware ones at runtime
const EXPENSE_CATEGORIES = SA_EXPENSE_CATEGORIES;
const INCOME_CATEGORIES = SA_INCOME_CATEGORIES;

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
  const { formatCurrency, currencySymbol, locale } = useCurrency();
  const { isUS } = useJurisdiction();
  
  // Use jurisdiction-appropriate categories
  const ACTIVE_EXPENSE_CATEGORIES = isUS ? US_EXPENSE_CATEGORIES : SA_EXPENSE_CATEGORIES;
  const ACTIVE_INCOME_CATEGORIES = isUS ? US_INCOME_CATEGORIES : SA_INCOME_CATEGORIES;
  
  // Tax rate for savings hint
  const taxHintRate = isUS ? 0.22 : 0.31;
  const taxHintLabel = isUS ? '22% federal rate' : '31% marginal rate';
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState(null); // File to upload after transaction creation
  
  // Transactions state
  const [transactions, setTransactions] = useState([]);
  
  // Budget state (still using localStorage as budgets are user preferences)
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
    receipt: null, // { name, type, file (File object) }
  });

  // Receipt preview modal
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [receiptBlobUrls, setReceiptBlobUrls] = useState({});
  
  // OCR state
  const [ocrData, setOcrData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load transactions from backend
  const loadTransactions = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/transactions?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load transactions');
      
      const data = await response.json();
      // Transform backend format to frontend format
      const transformed = data.transactions.map(t => ({
        ...t,
        taxDeductible: t.tax_deductible,
        isRecurring: t.is_recurring,
        createdAt: t.created_at,
        receipt: t.receipt_id ? { id: t.receipt_id, name: t.receipt_filename } : null
      }));
      setTransactions(transformed);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to localStorage for offline support
      const saved = localStorage.getItem('incomeExpenseTransactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTransactions(parsed.filter(t => t.date.startsWith(selectedMonth)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedMonth]);

  // Load transactions when month changes or on mount
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Save budgets to localStorage
  useEffect(() => {
    localStorage.setItem('incomeExpenseBudgets', JSON.stringify(budgets));
  }, [budgets]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(receiptBlobUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [receiptBlobUrls]);

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

  // Add transaction (with backend API)
  const addTransaction = async () => {
    if (newTransaction.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!token) {
      toast.error('Please log in to add transactions');
      return;
    }

    setIsSaving(true);
    
    try {
      // Create transaction via API
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newTransaction.type,
          amount: newTransaction.amount,
          category: newTransaction.category,
          description: newTransaction.description,
          date: newTransaction.date,
          is_recurring: newTransaction.isRecurring,
          tax_deductible: newTransaction.taxDeductible
        })
      });

      if (!response.ok) throw new Error('Failed to create transaction');
      
      const createdTransaction = await response.json();
      
      // If there's a receipt to upload, upload it now
      if (newTransaction.receipt?.file) {
        const formData = new FormData();
        formData.append('file', newTransaction.receipt.file);
        
        const receiptResponse = await fetch(`${API_URL}/api/transactions/${createdTransaction.id}/receipt`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (receiptResponse.ok) {
          const receiptData = await receiptResponse.json();
          createdTransaction.receipt_id = receiptData.receipt_id;
          createdTransaction.receipt_filename = receiptData.filename;
          
          // Show OCR data if available (for future reference - already applied above)
          if (receiptData.ocr_data) {
            toast.success('Receipt analyzed! Data extracted automatically.');
          }
        } else {
          toast.error('Transaction saved but receipt upload failed');
        }
      }
      
      // Clear OCR data
      setOcrData(null);
      
      // Transform and add to state
      const transformed = {
        ...createdTransaction,
        taxDeductible: createdTransaction.tax_deductible,
        isRecurring: createdTransaction.is_recurring,
        createdAt: createdTransaction.created_at,
        receipt: createdTransaction.receipt_id ? { 
          id: createdTransaction.receipt_id, 
          name: createdTransaction.receipt_filename 
        } : null
      };
      
      setTransactions([transformed, ...transactions]);
      setNewTransaction({
        type: 'expense',
        amount: 0,
        category: 'other',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        isRecurring: false,
        taxDeductible: false,
        receipt: null,
      });
      
      toast.success(`${newTransaction.type === 'income' ? 'Income' : 'Expense'} added successfully${newTransaction.receipt ? ' with receipt' : ''}`);
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle receipt upload - store file object for later upload
  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Store file object and create preview URL
    const previewUrl = URL.createObjectURL(file);
    setNewTransaction({
      ...newTransaction,
      receipt: {
        name: file.name,
        type: file.type,
        file: file,
        size: file.size,
        previewUrl: previewUrl
      }
    });
    toast.success('Receipt attached');
  };

  // Remove receipt from new transaction
  const removeReceipt = () => {
    if (newTransaction.receipt?.previewUrl) {
      URL.revokeObjectURL(newTransaction.receipt.previewUrl);
    }
    setNewTransaction({ ...newTransaction, receipt: null });
  };

  // Get transactions with receipts
  const transactionsWithReceipts = transactions.filter(t => t.receipt);

  // Delete transaction (with backend API)
  const deleteTransaction = async (id) => {
    if (!token) {
      toast.error('Please log in to delete transactions');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete transaction');
      
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  // View receipt from backend
  const viewReceipt = async (transaction) => {
    if (!transaction.receipt?.id || !token) return;
    
    // Check if we already have the blob URL cached
    if (receiptBlobUrls[transaction.id]) {
      setViewingReceipt({
        ...transaction.receipt,
        url: receiptBlobUrls[transaction.id],
        transactionId: transaction.id
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/transactions/${transaction.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load receipt');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Cache the blob URL
      setReceiptBlobUrls(prev => ({ ...prev, [transaction.id]: blobUrl }));
      
      setViewingReceipt({
        ...transaction.receipt,
        url: blobUrl,
        type: blob.type,
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast.error('Failed to load receipt');
    }
  };

  // Analyze receipt for a transaction
  const analyzeReceipt = async (transactionId) => {
    if (!token) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/api/transactions/${transactionId}/receipt/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to analyze receipt');
      
      const data = await response.json();
      if (data.ocr_data) {
        toast.success('Receipt analyzed! Review the extracted data.');
        return data.ocr_data;
      } else {
        toast.info('Could not extract data from this receipt');
        return null;
      }
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      toast.error('Failed to analyze receipt');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply OCR data to form
  const applyOcrData = (data) => {
    if (!data) return;
    
    setNewTransaction(prev => ({
      ...prev,
      amount: data.amount || prev.amount,
      category: data.category || prev.category,
      description: data.description || data.merchant || prev.description,
      date: data.date || prev.date
    }));
    setOcrData(null);
    toast.success('OCR data applied to form');
  };

  // Apply dual-context receipt+voice analysis result
  const handleReceiptVoiceAnalyzed = (data) => {
    if (!data) return;
    const expCats = ACTIVE_EXPENSE_CATEGORIES.map(c => c.id);
    const validCat = expCats.includes(data.category) ? data.category : 'other';
    const cat = ACTIVE_EXPENSE_CATEGORIES.find(c => c.id === validCat);
    setNewTransaction(prev => ({
      ...prev,
      amount: data.amount > 0 ? data.amount : prev.amount,
      category: validCat,
      description: data.description || data.merchant || prev.description,
      date: data.date || prev.date,
      taxDeductible: cat?.taxDeductible || prev.taxDeductible,
    }));
  };

  // Apply voice-parsed data to form
  const handleVoiceParsed = (data) => {
    if (!data) return;
    const expCats = ACTIVE_EXPENSE_CATEGORIES.map(c => c.id);
    const incCats = ACTIVE_INCOME_CATEGORIES.map(c => c.id);
    const validCat = data.type === 'income'
      ? (incCats.includes(data.category) ? data.category : 'other')
      : (expCats.includes(data.category) ? data.category : 'other');

    const cat = ACTIVE_EXPENSE_CATEGORIES.find(c => c.id === validCat);
    setNewTransaction(prev => ({
      ...prev,
      type: data.type || prev.type,
      amount: data.amount > 0 ? data.amount : prev.amount,
      category: validCat,
      description: data.description || prev.description,
      date: data.date || prev.date,
      taxDeductible: cat?.taxDeductible || false,
    }));
    toast.success('Voice transaction applied! Review and confirm.');
    setActiveTab('add');
  };

  // Get category info
  const getCategoryInfo = (categoryId, type) => {
    const categories = type === 'income' ? ACTIVE_INCOME_CATEGORIES : ACTIVE_EXPENSE_CATEGORIES;
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
                  {new Date(month + '-01').toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
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
          <TabsTrigger value="receipts" className="data-[state=active]:bg-emerald-500/20">
            <Paperclip className="h-4 w-4 mr-2" />
            Receipts
            {transactionsWithReceipts.length > 0 && (
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 text-xs">{transactionsWithReceipts.length}</Badge>
            )}
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
                {ACTIVE_EXPENSE_CATEGORIES.map(category => {
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
                {ACTIVE_EXPENSE_CATEGORIES.filter(c => budgets[c.id] > 0).map(category => {
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
                    Potential tax saving: {formatCurrency(totals.taxDeductible * taxHintRate)} (at {taxHintLabel})
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
              <CardDescription>Record your income or expenses — type manually or speak it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Recorder */}
              <div className="pb-2 border-b border-navy-700">
                <VoiceTransactionRecorder
                  onParsed={handleVoiceParsed}
                  jurisdiction={isUS ? 'us' : 'sa'}
                  currencySymbol={currencySymbol}
                  token={token}
                />
              </div>

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
                      const cat = ACTIVE_EXPENSE_CATEGORIES.find(c => c.id === val);
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
                      {(newTransaction.type === 'income' ? ACTIVE_INCOME_CATEGORIES : ACTIVE_EXPENSE_CATEGORIES).map(cat => {
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

              {/* Receipt Upload */}
              <div className="border border-dashed border-navy-600 rounded-lg p-4 bg-navy-800/30">
                <Label className="text-sm text-slate-300 mb-3 block">
                  <Paperclip className="h-4 w-4 inline mr-1" />
                  Attach Receipt/Invoice (optional)
                </Label>
                
                {newTransaction.receipt ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-3 bg-navy-800 rounded-lg border border-navy-600">
                      <div className="flex items-center gap-3">
                        {newTransaction.receipt.type.startsWith('image/') ? (
                          <Image className="h-8 w-8 text-blue-400" />
                        ) : (
                          <FileText className="h-8 w-8 text-red-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[200px]">
                            {newTransaction.receipt.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(newTransaction.receipt.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingReceipt(newTransaction.receipt)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeReceipt}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Voice Receipt Analyzer — only for image files */}
                    {newTransaction.receipt.type.startsWith('image/') && (
                      <VoiceReceiptAnalyzer
                        receiptFile={newTransaction.receipt.file}
                        onAnalyzed={handleReceiptVoiceAnalyzed}
                        jurisdiction={isUS ? 'us' : 'sa'}
                        token={token}
                      />
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-navy-800/50 rounded-lg transition-colors">
                    <Upload className="h-8 w-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-400">Click to upload receipt or invoice</span>
                    <span className="text-xs text-slate-600 mt-1">JPG, PNG, WebP or PDF (max 5MB)</span>
                    <span className="text-xs text-emerald-500 mt-1">AI + voice = near-perfect extraction</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* OCR Data Preview */}
              {ocrData && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Receipt Analyzed</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applyOcrData(ocrData)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                    >
                      Apply Data
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {ocrData.amount && (
                      <div>
                        <span className="text-slate-500">Amount:</span>
                        <span className="text-white ml-2">R{ocrData.amount.toFixed(2)}</span>
                      </div>
                    )}
                    {ocrData.date && (
                      <div>
                        <span className="text-slate-500">Date:</span>
                        <span className="text-white ml-2">{ocrData.date}</span>
                      </div>
                    )}
                    {ocrData.merchant && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Merchant:</span>
                        <span className="text-white ml-2">{ocrData.merchant}</span>
                      </div>
                    )}
                    {ocrData.category && (
                      <div>
                        <span className="text-slate-500">Category:</span>
                        <span className="text-white ml-2 capitalize">{ocrData.category}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOcrData(null)}
                    className="text-slate-500 hover:text-slate-300 mt-2 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              <Button 
                onClick={addTransaction} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </>
                )}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                  <span className="ml-3 text-slate-400">Loading transactions...</span>
                </div>
              ) : filteredTransactions.length === 0 ? (
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
                              {transaction.description || new Date(transaction.date).toLocaleDateString(locale)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {transaction.receipt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewReceipt(transaction)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          )}
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

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-6">
          <Card className="bg-navy-900/50 border-navy-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-emerald-400" />
                Uploaded Receipts & Invoices
              </CardTitle>
              <CardDescription>All your uploaded documents in one place</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsWithReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">No receipts uploaded yet</p>
                  <p className="text-xs text-slate-600">Add a transaction and attach a receipt to see it here</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transactionsWithReceipts.map(transaction => {
                    const category = getCategoryInfo(transaction.category, transaction.type);
                    const Icon = category.icon;
                    const isImage = transaction.receipt.name?.match(/\.(jpg|jpeg|png|webp)$/i);
                    
                    return (
                      <div
                        key={transaction.id}
                        className="border border-navy-700 rounded-lg overflow-hidden hover:border-emerald-500/50 transition-colors"
                      >
                        {/* Preview */}
                        <div 
                          className="h-32 bg-navy-800 flex items-center justify-center cursor-pointer"
                          onClick={() => viewReceipt(transaction)}
                        >
                          {isImage ? (
                            receiptBlobUrls[transaction.id] ? (
                              <img 
                                src={receiptBlobUrls[transaction.id]} 
                                alt="Receipt" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-center">
                                <Image className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                                <span className="text-xs text-slate-500">Click to view</span>
                              </div>
                            )
                          ) : (
                            <div className="text-center">
                              <FileText className="h-12 w-12 text-red-400 mx-auto mb-2" />
                              <span className="text-xs text-slate-500">PDF Document</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-3 bg-navy-900/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`h-4 w-4 text-${category.color}-400`} />
                            <span className="text-sm font-medium text-white truncate">{category.name}</span>
                          </div>
                          <p className={`text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(transaction.date).toLocaleDateString(locale)}
                          </p>
                          {transaction.taxDeductible && (
                            <Badge className="mt-2 text-xs bg-purple-500/20 text-purple-300">Tax Deductible</Badge>
                          )}
                          {/* Analyze button for images */}
                          {isImage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const data = await analyzeReceipt(transaction.id);
                                if (data) {
                                  setOcrData(data);
                                  setActiveTab('add');
                                  toast.info('Go to Add tab to review extracted data');
                                }
                              }}
                              disabled={isAnalyzing}
                              className="mt-2 w-full text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              {isAnalyzing ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Eye className="h-3 w-3 mr-1" />
                              )}
                              Re-analyze
                            </Button>
                          )}
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
              {ACTIVE_EXPENSE_CATEGORIES.map(category => {
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
          { label: 'Period', value: new Date(selectedMonth + '-01').toLocaleDateString(locale, { month: 'long', year: 'numeric' }) },
          { label: 'Total Transactions', value: filteredTransactions.length.toString() },
          { label: 'Receipts Attached', value: transactionsWithReceipts.length.toString() },
        ]}
        results={[
          { label: 'Total Income', value: formatCurrency(totals.income) },
          { label: 'Total Expenses', value: formatCurrency(totals.expenses) },
          { label: 'Net Income', value: formatCurrency(netIncome) },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%` },
          { label: 'Tax Deductible Expenses', value: formatCurrency(totals.taxDeductible) },
        ]}
      />

      {/* Receipt Viewing Modal */}
      {viewingReceipt && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-navy-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-navy-700">
              <div className="flex items-center gap-3">
                {(viewingReceipt.type?.startsWith('image/') || viewingReceipt.name?.match(/\.(jpg|jpeg|png|webp)$/i)) ? (
                  <Image className="h-5 w-5 text-blue-400" />
                ) : (
                  <FileText className="h-5 w-5 text-red-400" />
                )}
                <span className="text-white font-medium">{viewingReceipt.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingReceipt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {(viewingReceipt.type?.startsWith('image/') || viewingReceipt.name?.match(/\.(jpg|jpeg|png|webp)$/i)) ? (
                <img 
                  src={viewingReceipt.url || viewingReceipt.previewUrl || viewingReceipt.data} 
                  alt="Receipt" 
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <iframe
                  src={viewingReceipt.url || viewingReceipt.previewUrl || viewingReceipt.data}
                  title="PDF Receipt"
                  className="w-full h-[70vh] bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
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
