import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, MultiLineChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { ComparisonMode } from '@/components/calculators/ComparisonMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calculator, GitCompare, BarChart3, LineChart } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

const paymentFrequencyOptions = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Semi-annually' },
  { value: '4', label: 'Quarterly' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  faceValue: 1000,
  couponRate: 5,
  marketRate: 4,
  yearsToMaturity: 10,
  paymentFrequency: '2',
});

export const BondCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateBond = useCallback((scenario) => {
    const { faceValue, couponRate, marketRate, yearsToMaturity, paymentFrequency } = scenario;
    const n = parseFloat(paymentFrequency);
    const couponPayment = (faceValue * (couponRate / 100)) / n;
    const periodicRate = (marketRate / 100) / n;
    const totalPeriods = yearsToMaturity * n;
    
    // Bond Price = PV of coupon payments + PV of face value
    let pvCoupons = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      pvCoupons += couponPayment / Math.pow(1 + periodicRate, i);
    }
    const pvFaceValue = faceValue / Math.pow(1 + periodicRate, totalPeriods);
    const bondPrice = pvCoupons + pvFaceValue;
    
    // Premium or Discount
    const premiumDiscount = bondPrice - faceValue;
    const premiumDiscountPercent = ((bondPrice - faceValue) / faceValue) * 100;
    
    // Current Yield
    const annualCoupon = couponPayment * n;
    const currentYield = (annualCoupon / bondPrice) * 100;
    
    // Macaulay Duration
    let weightedTime = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      const pvCashFlow = couponPayment / Math.pow(1 + periodicRate, i);
      weightedTime += (pvCashFlow * i / n);
    }
    weightedTime += (pvFaceValue * yearsToMaturity);
    const macaulayDuration = weightedTime / bondPrice;
    
    // Modified Duration
    const modifiedDuration = macaulayDuration / (1 + periodicRate);
    
    // Total Interest Payments
    const totalInterest = annualCoupon * yearsToMaturity;
    const totalReturn = totalInterest + faceValue - bondPrice;

    // Generate cash flow data
    const cashFlowData = [];
    let cumulativeCashFlow = -bondPrice;
    
    for (let year = 1; year <= yearsToMaturity; year++) {
      const yearCashFlow = annualCoupon + (year === yearsToMaturity ? faceValue : 0);
      cumulativeCashFlow += yearCashFlow;
      
      cashFlowData.push({
        year: `Year ${year}`,
        cashFlow: yearCashFlow,
        cumulative: cumulativeCashFlow,
      });
    }

    // Generate price sensitivity data
    const sensitivityData = [];
    for (let rateChange = -2; rateChange <= 2; rateChange += 0.5) {
      const testRate = (marketRate + rateChange) / 100 / n;
      let testPvCoupons = 0;
      for (let i = 1; i <= totalPeriods; i++) {
        testPvCoupons += couponPayment / Math.pow(1 + testRate, i);
      }
      const testPvFace = faceValue / Math.pow(1 + testRate, totalPeriods);
      const testPrice = testPvCoupons + testPvFace;
      
      sensitivityData.push({
        rate: `${(marketRate + rateChange).toFixed(1)}%`,
        price: testPrice,
      });
    }

    return {
      bondPrice,
      premiumDiscount,
      premiumDiscountPercent: premiumDiscountPercent.toFixed(2),
      currentYield: currentYield.toFixed(2),
      macaulayDuration: macaulayDuration.toFixed(2),
      modifiedDuration: modifiedDuration.toFixed(2),
      annualCoupon,
      totalInterest,
      totalReturn: totalReturn.toFixed(2),
      cashFlowData,
      sensitivityData,
      isPremium: bondPrice > faceValue,
      finalValue: bondPrice,
    };
  }, []);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateBond(currentScenario), [currentScenario, calculateBond]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateBond(scenario)),
    [scenarios, calculateBond]
  );

  const updateScenario = (index, field, value) => {
    setScenarios(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const addScenario = () => {
    if (scenarios.length < 3) {
      setScenarios(prev => [...prev, defaultScenario()]);
    }
  };

  const removeScenario = (index) => {
    if (scenarios.length > 1) {
      setScenarios(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateScenario = (index) => {
    if (scenarios.length < 3) {
      setScenarios(prev => [...prev, { ...prev[index], id: generateId() }]);
    }
  };

  const pieData = [
    { name: 'Present Value of Coupons', value: results.bondPrice - (currentScenario.faceValue / Math.pow(1 + (currentScenario.marketRate / 100 / parseFloat(currentScenario.paymentFrequency)), currentScenario.yearsToMaturity * parseFloat(currentScenario.paymentFrequency))), color: 'hsl(43, 74%, 49%)' },
    { name: 'Present Value of Face Value', value: currentScenario.faceValue / Math.pow(1 + (currentScenario.marketRate / 100 / parseFloat(currentScenario.paymentFrequency)), currentScenario.yearsToMaturity * parseFloat(currentScenario.paymentFrequency)), color: 'hsl(150, 45%, 35%)' },
  ];

  const printInputs = [
    { label: 'Face Value', value: `$${currentScenario.faceValue.toLocaleString()}` },
    { label: 'Coupon Rate', value: `${currentScenario.couponRate}%` },
    { label: 'Market Rate (YTM)', value: `${currentScenario.marketRate}%` },
    { label: 'Years to Maturity', value: `${currentScenario.yearsToMaturity} years` },
    { label: 'Payment Frequency', value: paymentFrequencyOptions.find(o => o.value === currentScenario.paymentFrequency)?.label },
  ];

  const printResults = [
    { label: 'Bond Price', value: `$${results.bondPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Premium/Discount', value: `$${results.premiumDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${results.premiumDiscountPercent}%)` },
    { label: 'Current Yield', value: `${results.currentYield}%` },
    { label: 'Macaulay Duration', value: `${results.macaulayDuration} years` },
    { label: 'Modified Duration', value: results.modifiedDuration },
  ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <InputField
          label="Face Value"
          id={`faceValue-${scenario.id}`}
          value={scenario.faceValue}
          onChange={(val) => updateScenario(index, 'faceValue', val)}
          prefix={symbol}
          min={100}
          step={100}
        />
        <SliderField
          label="Coupon Rate"
          id={`couponRate-${scenario.id}`}
          value={scenario.couponRate}
          onChange={(val) => updateScenario(index, 'couponRate', val)}
          min={0}
          max={15}
          step={0.25}
          suffix="%"
        />
        <SliderField
          label="Market Rate (YTM)"
          id={`marketRate-${scenario.id}`}
          value={scenario.marketRate}
          onChange={(val) => updateScenario(index, 'marketRate', val)}
          min={0}
          max={15}
          step={0.25}
          suffix="%"
        />
        <SliderField
          label="Years to Maturity"
          id={`years-${scenario.id}`}
          value={scenario.yearsToMaturity}
          onChange={(val) => updateScenario(index, 'yearsToMaturity', val)}
          min={1}
          max={30}
          step={1}
          suffix=" years"
        />
        
        <div className="pt-4 border-t border-border">
          <ResultDisplay
            label="Bond Price"
            value={scenarioResults.bondPrice}
            size="lg"
            variant={scenarioResults.isPremium ? 'premium' : 'success'}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Bond Calculator
          </h1>
          <p className="text-muted-foreground">
            Analyze bond pricing, yields, and duration metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={mode === 'single' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('single')}
              className="gap-2"
            >
              <Calculator className="h-4 w-4" />
              Single
            </Button>
            <Button
              variant={mode === 'compare' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('compare')}
              className="gap-2"
            >
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
          </div>
          {mode === 'single' && (
            <PrintReport
              title="Bond Analysis"
              calculatorType="bond"
              inputs={printInputs}
              results={printResults}
            />
          )}
        </div>
      </div>

      {mode === 'compare' ? (
        <ComparisonMode
          scenarios={scenarios}
          onAddScenario={addScenario}
          onRemoveScenario={removeScenario}
          onDuplicateScenario={duplicateScenario}
          renderScenarioForm={renderScenarioForm}
          compareResults={compareResults}
          maxScenarios={3}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Card */}
          <div className="lg:col-span-1">
            <CalculatorCard
              title="Bond Parameters"
              description="Enter bond details for pricing"
              icon={Building2}
            >
              <div className="space-y-5">
                <InputField
                  label="Face Value (Par)"
                  id="faceValue"
                  value={currentScenario.faceValue}
                  onChange={(val) => updateScenario(0, 'faceValue', val)}
                  prefix={symbol}
                  min={100}
                  step={100}
                  tooltip="The bond's value at maturity"
                />
                
                <SliderField
                  label="Coupon Rate"
                  id="couponRate"
                  value={currentScenario.couponRate}
                  onChange={(val) => updateScenario(0, 'couponRate', val)}
                  min={0}
                  max={15}
                  step={0.25}
                  suffix="%"
                  tooltip="Annual interest rate paid by the bond"
                />
                
                <SliderField
                  label="Market Rate (YTM)"
                  id="marketRate"
                  value={currentScenario.marketRate}
                  onChange={(val) => updateScenario(0, 'marketRate', val)}
                  min={0}
                  max={15}
                  step={0.25}
                  suffix="%"
                  tooltip="Current market yield to maturity"
                />
                
                <SliderField
                  label="Years to Maturity"
                  id="yearsToMaturity"
                  value={currentScenario.yearsToMaturity}
                  onChange={(val) => updateScenario(0, 'yearsToMaturity', val)}
                  min={1}
                  max={30}
                  step={1}
                  suffix=" years"
                />
                
                <SelectField
                  label="Payment Frequency"
                  id="paymentFrequency"
                  value={currentScenario.paymentFrequency}
                  onChange={(val) => updateScenario(0, 'paymentFrequency', val)}
                  options={paymentFrequencyOptions}
                  tooltip="How often coupon payments are made"
                />
              </div>
            </CalculatorCard>
          </div>

          {/* Results & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Result */}
            <Card className="overflow-hidden border-2 border-gold/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gold/10 to-forest/5 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${results.isPremium ? 'bg-gold/20 text-gold' : 'bg-forest/20 text-forest'}`}>
                      {results.isPremium ? 'Premium Bond' : results.premiumDiscount < 0 ? 'Discount Bond' : 'Par Bond'}
                    </span>
                  </div>
                  <ResultDisplay
                    label="Bond Price"
                    value={results.bondPrice}
                    size="xl"
                    variant="premium"
                    trend={results.isPremium ? 'up' : results.premiumDiscount < 0 ? 'down' : 'neutral'}
                    trendValue={`${results.premiumDiscountPercent}%`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Secondary Results */}
            <ResultGrid columns={4}>
              <ResultDisplay
                label="Current Yield"
                value={results.currentYield}
                prefix=""
                suffix="%"
                variant="success"
              />
              <ResultDisplay
                label="Annual Coupon"
                value={results.annualCoupon}
                variant="muted"
              />
              <ResultDisplay
                label="Duration (Years)"
                value={results.macaulayDuration}
                prefix=""
                variant="muted"
              />
              <ResultDisplay
                label="Modified Duration"
                value={results.modifiedDuration}
                prefix=""
                variant="muted"
              />
            </ResultGrid>

            {/* Charts */}
            <Tabs defaultValue="cashflow" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="cashflow" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cash Flows
                </TabsTrigger>
                <TabsTrigger value="sensitivity" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  Price Sensitivity
                </TabsTrigger>
                <TabsTrigger value="breakdown">Value Breakdown</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cashflow" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Cash Flow Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GrowthAreaChart
                      data={results.cashFlowData}
                      dataKeys={[
                        { key: 'cumulative', name: 'Cumulative Cash Flow', color: 'hsl(43, 74%, 49%)' },
                        { key: 'cashFlow', name: 'Annual Cash Flow', color: 'hsl(150, 45%, 35%)' },
                      ]}
                      xAxisKey="year"
                      height={320}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sensitivity" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Price vs Interest Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MultiLineChart
                      data={results.sensitivityData}
                      dataKeys={[
                        { key: 'price', name: 'Bond Price', color: 'hsl(43, 74%, 49%)' },
                      ]}
                      xAxisKey="rate"
                      height={320}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="breakdown" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Present Value Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BreakdownPieChart
                      data={pieData}
                      height={320}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
