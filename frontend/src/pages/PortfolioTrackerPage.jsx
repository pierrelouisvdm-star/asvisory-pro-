import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { portfolioApi, clientsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PieChart, Plus, ArrowLeft, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, Trash2, BarChart3, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PieChart as RechartsPI, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const assetClassColors = {
  cash: '#64748b',
  bonds: '#0ea5e9',
  domestic_equity: '#10b981',
  international_equity: '#8b5cf6',
  real_estate: '#f59e0b',
  commodities: '#ef4444',
  alternatives: '#ec4899',
  crypto: '#f97316',
};

const assetClassLabels = {
  cash: 'Cash',
  bonds: 'Bonds',
  domestic_equity: 'Domestic Equity',
  international_equity: 'International Equity',
  real_estate: 'Real Estate',
  commodities: 'Commodities',
  alternatives: 'Alternatives',
  crypto: 'Cryptocurrency',
};

export const PortfolioTrackerPage = () => {
  const { clientId } = useParams();
  const { isAuthenticated } = useAuth();
  const { currentCurrency } = useCurrency();
  const [client, setClient] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [rebalanceSuggestions, setRebalanceSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [holdings, setHoldings] = useState([]);
  const [targetAllocation, setTargetAllocation] = useState({
    cash: 10,
    bonds: 20,
    domestic_equity: 40,
    international_equity: 20,
    real_estate: 10,
  });

  const [newHolding, setNewHolding] = useState({
    name: '',
    asset_class: 'domestic_equity',
    value: '',
    cost_basis: '',
  });

  useEffect(() => {
    if (isAuthenticated && clientId) {
      fetchData();
    }
  }, [isAuthenticated, clientId]);

  const fetchData = async () => {
    try {
      const clientData = await clientsApi.getById(clientId);
      setClient(clientData);
      
      try {
        const portfolioData = await portfolioApi.get(clientId);
        setPortfolio(portfolioData);
        setHoldings(portfolioData.holdings || []);
        if (portfolioData.target_allocation) {
          setTargetAllocation(portfolioData.target_allocation);
        }
        
        // Get rebalance suggestions
        const suggestions = await portfolioApi.getRebalancingSuggestions(clientId);
        setRebalanceSuggestions(suggestions);
      } catch {
        // No portfolio exists yet
        setPortfolio(null);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addHolding = () => {
    if (!newHolding.name.trim() || !newHolding.value) return;
    setHoldings([...holdings, {
      ...newHolding,
      id: Date.now().toString(),
      value: parseFloat(newHolding.value) || 0,
      cost_basis: parseFloat(newHolding.cost_basis) || 0,
    }]);
    setNewHolding({ name: '', asset_class: 'domestic_equity', value: '', cost_basis: '' });
  };

  const removeHolding = (id) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const handleSavePortfolio = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const portfolioData = {
        name: 'Main Portfolio',
        holdings: holdings,
        target_allocation: targetAllocation,
      };
      
      const saved = await portfolioApi.createOrUpdate(clientId, portfolioData);
      setPortfolio(saved);
      setIsAddOpen(false);
      toast.success('Portfolio saved!');
      fetchData(); // Refresh to get updated calculations
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate allocations for pie chart
  const getAllocationData = () => {
    if (!portfolio?.holdings?.length) return [];
    
    const byClass = {};
    portfolio.holdings.forEach(h => {
      const ac = h.asset_class;
      byClass[ac] = (byClass[ac] || 0) + h.value;
    });
    
    return Object.entries(byClass).map(([key, value]) => ({
      name: assetClassLabels[key] || key,
      value: value,
      color: assetClassColors[key] || '#64748b',
    }));
  };

  const currencySymbol = currentCurrency.symbol;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const allocationData = getAllocationData();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="portfolio-tracker-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/clients/${clientId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {client?.first_name}'s Profile
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Portfolio Tracker
              </h1>
              <p className="text-slate-500 mt-1">
                Manage {client?.first_name}'s investment portfolio
              </p>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="btn-premium" data-testid="manage-portfolio-btn">
                  {portfolio ? 'Edit Portfolio' : 'Create Portfolio'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {portfolio ? 'Edit Portfolio' : 'Create Portfolio'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSavePortfolio}>
                  <div className="grid gap-6 py-4">
                    {/* Holdings */}
                    <div>
                      <Label className="text-base font-semibold">Holdings</Label>
                      <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                        {holdings.map((holding) => (
                          <div key={holding.id} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{holding.name}</p>
                              <p className="text-sm text-slate-500">
                                {assetClassLabels[holding.asset_class]} • {currencySymbol}{holding.value.toLocaleString()}
                              </p>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeHolding(holding.id)}
                            >
                              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <Input
                          placeholder="Name"
                          value={newHolding.name}
                          onChange={(e) => setNewHolding({...newHolding, name: e.target.value})}
                        />
                        <Select 
                          value={newHolding.asset_class}
                          onValueChange={(v) => setNewHolding({...newHolding, asset_class: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(assetClassLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Value"
                          value={newHolding.value}
                          onChange={(e) => setNewHolding({...newHolding, value: e.target.value})}
                        />
                        <Button type="button" variant="outline" onClick={addHolding}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Target Allocation */}
                    <div>
                      <Label className="text-base font-semibold">Target Allocation (%)</Label>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        {Object.entries(assetClassLabels).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: assetClassColors[key] }}
                            />
                            <Label className="flex-1 text-sm">{label}</Label>
                            <Input
                              type="number"
                              className="w-20"
                              value={targetAllocation[key] || 0}
                              onChange={(e) => setTargetAllocation({
                                ...targetAllocation,
                                [key]: parseFloat(e.target.value) || 0
                              })}
                              min={0}
                              max={100}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Total: {Object.values(targetAllocation).reduce((a, b) => a + b, 0)}%
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting || holdings.length === 0}>
                      {submitting ? 'Saving...' : 'Save Portfolio'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        {!portfolio ? (
          <Card className="text-center py-12">
            <CardContent>
              <PieChart className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No portfolio set up</h3>
              <p className="text-slate-500 mb-4">Create a portfolio to track investments and allocations</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Portfolio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                      <Wallet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {currencySymbol}{(portfolio.total_value / 1000).toFixed(0)}k
                      </p>
                      <p className="text-sm text-slate-500">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{portfolio.holdings?.length || 0}</p>
                      <p className="text-sm text-slate-500">Holdings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      portfolio.diversification_score >= 70 ? "bg-emerald-100 dark:bg-emerald-900/20" :
                      portfolio.diversification_score >= 50 ? "bg-amber-100 dark:bg-amber-900/20" :
                      "bg-red-100 dark:bg-red-900/20"
                    )}>
                      <TrendingUp className={cn(
                        "h-5 w-5",
                        portfolio.diversification_score >= 70 ? "text-emerald-600" :
                        portfolio.diversification_score >= 50 ? "text-amber-600" :
                        "text-red-600"
                      )} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{portfolio.diversification_score?.toFixed(0) || 0}</p>
                      <p className="text-sm text-slate-500">Diversification</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      portfolio.rebalancing_needed ? "bg-amber-100 dark:bg-amber-900/20" : "bg-emerald-100 dark:bg-emerald-900/20"
                    )}>
                      {portfolio.rebalancing_needed ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {portfolio.rebalancing_needed ? 'Needed' : 'Balanced'}
                      </p>
                      <p className="text-sm text-slate-500">Rebalance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts & Holdings */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Allocation Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-slate-500" />
                    Current Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPI>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                        />
                        <Legend />
                      </RechartsPI>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Holdings List */}
              <Card>
                <CardHeader>
                  <CardTitle>Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {portfolio.holdings?.map((holding, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: assetClassColors[holding.asset_class] }}
                          />
                          <div>
                            <p className="font-medium">{holding.name}</p>
                            <p className="text-sm text-slate-500">
                              {assetClassLabels[holding.asset_class]}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {currencySymbol}{holding.value?.toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-500">
                            {holding.allocation_percentage?.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rebalancing Suggestions */}
            {rebalanceSuggestions?.suggestions?.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                    Rebalancing Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rebalanceSuggestions.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: assetClassColors[suggestion.asset_class] }}
                          />
                          <div>
                            <p className="font-medium">
                              {assetClassLabels[suggestion.asset_class]}
                            </p>
                            <p className="text-sm text-slate-500">
                              Current: {suggestion.current_percentage}% → Target: {suggestion.target_percentage}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={cn(
                            suggestion.action === 'BUY' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          )}>
                            {suggestion.action} {currencySymbol}{suggestion.amount?.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    {rebalanceSuggestions.summary}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
