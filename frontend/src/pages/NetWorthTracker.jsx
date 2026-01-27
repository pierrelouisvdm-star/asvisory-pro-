import React, { useState, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField } from '@/components/calculators/InputField';
import { GrowthAreaChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, Home, Briefcase, TrendingUp, Plus, Trash2, PiggyBank, CreditCard } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const NetWorthTracker = () => {
  const { symbol, formatCurrency } = useCurrency();
  
  const [assets, setAssets] = useState([
    { id: generateId(), name: 'Primary Residence', value: 2500000, category: 'property' },
    { id: generateId(), name: 'Investment Property', value: 1500000, category: 'property' },
    { id: generateId(), name: 'Retirement Annuity', value: 800000, category: 'retirement' },
    { id: generateId(), name: 'Pension Fund', value: 600000, category: 'retirement' },
    { id: generateId(), name: 'Stock Portfolio', value: 500000, category: 'investments' },
    { id: generateId(), name: 'Unit Trusts', value: 300000, category: 'investments' },
    { id: generateId(), name: 'Emergency Fund', value: 150000, category: 'cash' },
    { id: generateId(), name: 'Savings Account', value: 100000, category: 'cash' },
    { id: generateId(), name: 'Vehicle', value: 350000, category: 'other' },
  ]);

  const [liabilities, setLiabilities] = useState([
    { id: generateId(), name: 'Home Loan', value: 1800000, category: 'mortgage' },
    { id: generateId(), name: 'Car Finance', value: 200000, category: 'vehicle' },
    { id: generateId(), name: 'Credit Card', value: 50000, category: 'credit' },
    { id: generateId(), name: 'Personal Loan', value: 100000, category: 'personal' },
  ]);

  const [previousNetWorth, setPreviousNetWorth] = useState(3500000);

  const addAsset = () => {
    setAssets(prev => [...prev, { id: generateId(), name: 'New Asset', value: 0, category: 'other' }]);
  };

  const addLiability = () => {
    setLiabilities(prev => [...prev, { id: generateId(), name: 'New Liability', value: 0, category: 'personal' }]);
  };

  const removeAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const removeLiability = (id) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  };

  const updateAsset = (id, field, value) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const updateLiability = (id, field, value) => {
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const results = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Change from previous
    const netWorthChange = netWorth - previousNetWorth;
    const netWorthChangePercent = previousNetWorth > 0 ? (netWorthChange / previousNetWorth * 100) : 0;
    
    // Debt-to-asset ratio
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
    
    // Asset breakdown by category
    const assetCategories = {
      property: { name: 'Property', value: 0, color: 'hsl(43, 74%, 49%)' },
      retirement: { name: 'Retirement', value: 0, color: 'hsl(150, 45%, 35%)' },
      investments: { name: 'Investments', value: 0, color: 'hsl(215, 50%, 35%)' },
      cash: { name: 'Cash', value: 0, color: 'hsl(180, 45%, 40%)' },
      other: { name: 'Other', value: 0, color: 'hsl(280, 45%, 45%)' },
    };
    
    assets.forEach(asset => {
      if (assetCategories[asset.category]) {
        assetCategories[asset.category].value += asset.value;
      }
    });
    
    const assetBreakdown = Object.values(assetCategories).filter(c => c.value > 0);
    
    // Liability breakdown by category
    const liabilityCategories = {
      mortgage: { name: 'Mortgage', value: 0, color: 'hsl(0, 60%, 50%)' },
      vehicle: { name: 'Vehicle Loans', value: 0, color: 'hsl(30, 60%, 50%)' },
      credit: { name: 'Credit Cards', value: 0, color: 'hsl(280, 45%, 45%)' },
      personal: { name: 'Personal Loans', value: 0, color: 'hsl(320, 45%, 45%)' },
    };
    
    liabilities.forEach(liability => {
      if (liabilityCategories[liability.category]) {
        liabilityCategories[liability.category].value += liability.value;
      }
    });
    
    const liabilityBreakdown = Object.values(liabilityCategories).filter(c => c.value > 0);
    
    // Net worth composition
    const netWorthBreakdown = [
      { name: 'Total Assets', value: totalAssets, color: 'hsl(150, 45%, 35%)' },
      { name: 'Total Liabilities', value: totalLiabilities, color: 'hsl(0, 60%, 50%)' },
    ];
    
    // Liquidity analysis
    const liquidAssets = assets.filter(a => ['cash', 'investments'].includes(a.category))
                               .reduce((sum, a) => sum + a.value, 0);
    const liquidityRatio = totalLiabilities > 0 ? (liquidAssets / totalLiabilities * 100) : 100;
    
    // Financial health score (simplified)
    let healthScore = 50;
    if (netWorth > 0) healthScore += 20;
    if (debtToAssetRatio < 50) healthScore += 15;
    if (liquidityRatio > 20) healthScore += 15;
    healthScore = Math.min(100, healthScore);

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      netWorthChange,
      netWorthChangePercent: netWorthChangePercent.toFixed(2),
      debtToAssetRatio: debtToAssetRatio.toFixed(1),
      liquidAssets,
      liquidityRatio: liquidityRatio.toFixed(1),
      healthScore,
      assetBreakdown,
      liabilityBreakdown,
      netWorthBreakdown,
      isPositive: netWorth >= 0,
      isGrowing: netWorthChange >= 0,
    };
  }, [assets, liabilities, previousNetWorth]);

  const printInputs = [
    { label: 'Total Assets', value: formatCurrency(results.totalAssets) },
    { label: 'Total Liabilities', value: formatCurrency(results.totalLiabilities) },
    { label: 'Number of Assets', value: assets.length.toString() },
    { label: 'Number of Liabilities', value: liabilities.length.toString() },
  ];

  const printResults = [
    { label: 'Net Worth', value: formatCurrency(results.netWorth) },
    { label: 'Change from Previous', value: `${results.netWorthChange >= 0 ? '+' : ''}${formatCurrency(results.netWorthChange)} (${results.netWorthChangePercent}%)` },
    { label: 'Debt-to-Asset Ratio', value: `${results.debtToAssetRatio}%` },
    { label: 'Financial Health Score', value: `${results.healthScore}/100` },
  ];

  const categoryOptions = {
    assets: [
      { value: 'property', label: 'Property' },
      { value: 'retirement', label: 'Retirement' },
      { value: 'investments', label: 'Investments' },
      { value: 'cash', label: 'Cash/Savings' },
      { value: 'other', label: 'Other' },
    ],
    liabilities: [
      { value: 'mortgage', label: 'Mortgage' },
      { value: 'vehicle', label: 'Vehicle Loan' },
      { value: 'credit', label: 'Credit Card' },
      { value: 'personal', label: 'Personal Loan' },
    ],
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Net Worth Tracker
          </h1>
          <p className="text-muted-foreground">
            Track your assets, liabilities, and overall financial health
          </p>
        </div>
        <PrintReport
          title="Net Worth Statement"
          calculatorType="net-worth"
          inputs={printInputs}
          results={printResults}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Assets */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Assets
                </CardTitle>
                <Button variant="outline-gold" size="sm" onClick={addAsset}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {assets.map((asset) => (
                <div key={asset.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={asset.category}
                      onChange={(e) => updateAsset(asset.id, 'category', e.target.value)}
                      className="text-xs bg-muted px-2 py-1 rounded border-0"
                    >
                      {categoryOptions.assets.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeAsset(asset.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                    className="w-full text-sm font-medium bg-transparent border-0 p-0 focus:outline-none"
                  />
                  <InputField
                    label=""
                    id={`asset-${asset.id}`}
                    value={asset.value}
                    onChange={(val) => updateAsset(asset.id, 'value', val)}
                    prefix={symbol}
                    min={0}
                    step={10000}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Liabilities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-destructive" />
                  Liabilities
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addLiability}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {liabilities.map((liability) => (
                <div key={liability.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={liability.category}
                      onChange={(e) => updateLiability(liability.id, 'category', e.target.value)}
                      className="text-xs bg-muted px-2 py-1 rounded border-0"
                    >
                      {categoryOptions.liabilities.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeLiability(liability.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={liability.name}
                    onChange={(e) => updateLiability(liability.id, 'name', e.target.value)}
                    className="w-full text-sm font-medium bg-transparent border-0 p-0 focus:outline-none"
                  />
                  <InputField
                    label=""
                    id={`liability-${liability.id}`}
                    value={liability.value}
                    onChange={(val) => updateLiability(liability.id, 'value', val)}
                    prefix={symbol}
                    min={0}
                    step={10000}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Previous Net Worth for comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Previous Net Worth (for comparison)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InputField
                label=""
                id="previousNetWorth"
                value={previousNetWorth}
                onChange={setPreviousNetWorth}
                prefix={symbol}
                min={0}
                step={100000}
              />
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Net Worth Display */}
          <Card className={`overflow-hidden border-2 ${results.isPositive ? 'border-success/20' : 'border-destructive/20'}`}>
            <CardContent className="p-0">
              <div className={`p-8 ${results.isPositive ? 'bg-gradient-to-br from-success/10 to-gold/5' : 'bg-gradient-to-br from-destructive/10 to-muted'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={results.isPositive ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                    <Landmark className="h-3 w-3 mr-1" />
                    Net Worth
                  </Badge>
                  {results.isGrowing ? (
                    <Badge className="bg-success/10 text-success border-success/20">
                      ↑ {results.netWorthChangePercent}%
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                      ↓ {Math.abs(parseFloat(results.netWorthChangePercent))}%
                    </Badge>
                  )}
                </div>
                <p className={`text-5xl font-bold font-display ${results.isPositive ? 'text-foreground' : 'text-destructive'}`}>
                  {formatCurrency(results.netWorth)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Change: {results.netWorthChange >= 0 ? '+' : ''}{formatCurrency(results.netWorthChange)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-2 border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(results.totalAssets)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <CreditCard className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Liabilities</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(results.totalLiabilities)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Metrics */}
          <ResultGrid columns={4}>
            <ResultDisplay
              label="Debt-to-Asset Ratio"
              value={results.debtToAssetRatio}
              prefix=""
              suffix="%"
              variant={parseFloat(results.debtToAssetRatio) < 50 ? "success" : "muted"}
            />
            <ResultDisplay
              label="Liquid Assets"
              value={results.liquidAssets}
              prefix={symbol}
              variant="muted"
            />
            <ResultDisplay
              label="Liquidity Ratio"
              value={results.liquidityRatio}
              prefix=""
              suffix="%"
              variant={parseFloat(results.liquidityRatio) > 20 ? "success" : "muted"}
            />
            <ResultDisplay
              label="Health Score"
              value={results.healthScore}
              prefix=""
              suffix="/100"
              variant={results.healthScore >= 70 ? "success" : results.healthScore >= 50 ? "premium" : "muted"}
            />
          </ResultGrid>

          {/* Charts */}
          <Tabs defaultValue="assets" className="w-full">
            <TabsList>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.assetBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="liabilities" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Liability Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.liabilityBreakdown.length > 0 ? (
                    <BreakdownPieChart
                      data={results.liabilityBreakdown}
                      height={300}
                      prefix={symbol}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No liabilities - Great job!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Assets vs Liabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakdownPieChart
                    data={results.netWorthBreakdown}
                    height={300}
                    prefix={symbol}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
