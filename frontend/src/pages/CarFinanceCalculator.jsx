import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { InputField, SliderField, SelectField } from '@/components/calculators/InputField';
import { GrowthAreaChart, ComparisonBarChart, BreakdownPieChart } from '@/components/calculators/GrowthChart';
import { PrintReport } from '@/components/calculators/PrintReport';
import { ComparisonMode } from '@/components/calculators/ComparisonMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Calculator, GitCompare, BarChart3, Calendar, CreditCard, Wallet, Banknote, PiggyBank } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const loanTermOptions = [
  { value: '24', label: '24 months (2 years)' },
  { value: '36', label: '36 months (3 years)' },
  { value: '48', label: '48 months (4 years)' },
  { value: '60', label: '60 months (5 years)' },
  { value: '72', label: '72 months (6 years)' },
  { value: '84', label: '84 months (7 years)' },
];

const leaseTermOptions = [
  { value: '24', label: '24 months (2 years)' },
  { value: '36', label: '36 months (3 years)' },
  { value: '48', label: '48 months (4 years)' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultScenario = () => ({
  id: generateId(),
  vehiclePrice: 450000,
  downPayment: 50000,
  tradeInValue: 0,
  loanTerm: '60',
  interestRate: 11.5,
  salesTax: 15, // SA VAT rate
  // Balloon payment
  balloonPercent: 0,
  // Lump sum payments
  lumpSumPayments: [],
  // Lease specific
  residualPercent: 55,
  leaseTerm: '36',
  moneyFactor: 0.00125,
});

export const CarFinanceCalculator = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [mode, setMode] = useState('single');
  const [calculationType, setCalculationType] = useState('loan'); // 'loan' or 'lease'
  const [scenarios, setScenarios] = useState([defaultScenario()]);

  const calculateCarFinance = useCallback((scenario) => {
    const { 
      vehiclePrice, downPayment, tradeInValue, loanTerm, interestRate, salesTax,
      residualPercent, leaseTerm, moneyFactor, balloonPercent, lumpSumPayments
    } = scenario;
    
    // Common calculations
    const taxAmount = vehiclePrice * (salesTax / 100);
    const totalPrice = vehiclePrice + taxAmount;
    const netPrice = totalPrice - downPayment - tradeInValue;
    
    // Balloon payment calculation
    const balloonAmount = vehiclePrice * (balloonPercent / 100);

    // Loan calculations with balloon payment
    const loanMonths = parseFloat(loanTerm);
    const monthlyRate = (interestRate / 100) / 12;
    
    // Amount to finance (excluding balloon which is paid at end)
    const amountToFinance = netPrice - balloonAmount;
    
    // Calculate standard loan payment (without lump sums for initial display)
    const loanPayment = amountToFinance > 0 
      ? amountToFinance * (monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) / 
        (Math.pow(1 + monthlyRate, loanMonths) - 1)
      : 0;
    
    // Generate amortization schedule for loan (with lump sum payments)
    const amortizationData = [];
    let balance = amountToFinance;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let totalLumpSumPaid = 0;
    
    // Create a map of lump sum payments by month
    const lumpSumMap = {};
    (lumpSumPayments || []).forEach(ls => {
      if (ls.month && ls.amount > 0) {
        lumpSumMap[ls.month] = (lumpSumMap[ls.month] || 0) + ls.amount;
      }
    });

    for (let month = 1; month <= Math.min(loanMonths, 84); month++) {
      if (balance <= 0) break;
      
      const interestPayment = balance * monthlyRate;
      let principalPayment = loanPayment - interestPayment;
      
      // Apply lump sum payment if exists for this month
      const lumpSum = lumpSumMap[month] || 0;
      if (lumpSum > 0) {
        principalPayment += Math.min(lumpSum, balance - principalPayment);
        totalLumpSumPaid += lumpSum;
      }
      
      balance = Math.max(0, balance - principalPayment);
      cumulativeInterest += interestPayment;
      cumulativePrincipal += principalPayment;

      if (month % 12 === 0 || month === loanMonths || balance <= 0) {
        amortizationData.push({
          year: `Year ${Math.ceil(month / 12)}`,
          principal: cumulativePrincipal,
          interest: cumulativeInterest,
          balance: Math.max(0, balance),
        });
      }
    }
    
    // Calculate actual totals
    const totalLoanPayments = (loanPayment * loanMonths) + balloonAmount;
    const totalLoanInterest = cumulativeInterest;
    const totalLoanCost = downPayment + tradeInValue + totalLoanPayments - totalLumpSumPaid + totalLumpSumPaid;
    
    // Interest saved from lump sum payments (approximate)
    const interestSavedFromLumpSum = totalLumpSumPaid > 0 
      ? totalLumpSumPaid * monthlyRate * (loanMonths / 2) 
      : 0;

    // Lease calculations
    const leaseMonths = parseFloat(leaseTerm);
    const residualValue = vehiclePrice * (residualPercent / 100);
    const depreciation = (netPrice - residualValue) / leaseMonths;
    const financeCharge = (netPrice + residualValue) * moneyFactor;
    const leasePayment = depreciation + financeCharge;
    const totalLeasePayments = leasePayment * leaseMonths;
    const totalLeaseCost = downPayment + totalLeasePayments;

    // Comparison data
    const comparisonData = [
      { name: 'Monthly Payment', loan: loanPayment, lease: leasePayment },
      { name: 'Total Payments', loan: totalLoanPayments, lease: totalLeasePayments },
      { name: 'Total Cost', loan: totalLoanCost, lease: totalLeaseCost },
    ];

    return {
      // Loan results
      loanPayment,
      totalLoanPayments,
      totalLoanInterest,
      totalLoanCost,
      balloonAmount,
      totalLumpSumPaid,
      interestSavedFromLumpSum,
      
      // Lease results
      leasePayment,
      residualValue,
      totalLeasePayments,
      totalLeaseCost,
      
      // Common
      netPrice,
      taxAmount,
      amortizationData,
      comparisonData,
      
      // For comparison mode
      finalValue: calculationType === 'loan' ? totalLoanCost : totalLeaseCost,
      monthlyPayment: calculationType === 'loan' ? loanPayment : leasePayment,
    };
  }, [calculationType]);

  const currentScenario = scenarios[0];
  const results = useMemo(() => calculateCarFinance(currentScenario), [currentScenario, calculateCarFinance]);
  
  const compareResults = useMemo(() => 
    scenarios.map(scenario => calculateCarFinance(scenario)),
    [scenarios, calculateCarFinance]
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

  // Lump sum payment management
  const addLumpSumPayment = () => {
    setScenarios(prev => prev.map((s, i) => 
      i === 0 ? { 
        ...s, 
        lumpSumPayments: [...(s.lumpSumPayments || []), { id: generateId(), month: 12, amount: 10000 }] 
      } : s
    ));
  };

  const removeLumpSumPayment = (lumpSumId) => {
    setScenarios(prev => prev.map((s, i) => 
      i === 0 ? { 
        ...s, 
        lumpSumPayments: (s.lumpSumPayments || []).filter(ls => ls.id !== lumpSumId) 
      } : s
    ));
  };

  const updateLumpSumPayment = (lumpSumId, field, value) => {
    setScenarios(prev => prev.map((s, i) => 
      i === 0 ? { 
        ...s, 
        lumpSumPayments: (s.lumpSumPayments || []).map(ls => 
          ls.id === lumpSumId ? { ...ls, [field]: value } : ls
        ) 
      } : s
    ));
  };

  const loanPieData = [
    { name: 'Principal', value: results.netPrice, color: 'hsl(215, 50%, 35%)' },
    { name: 'Interest', value: results.totalLoanInterest, color: 'hsl(43, 74%, 49%)' },
    { name: 'Down Payment', value: currentScenario.downPayment + currentScenario.tradeInValue, color: 'hsl(150, 45%, 35%)' },
  ];

  const leasePieData = [
    { name: 'Depreciation', value: (results.netPrice - results.residualValue), color: 'hsl(215, 50%, 35%)' },
    { name: 'Finance Charges', value: results.totalLeasePayments - (results.netPrice - results.residualValue), color: 'hsl(43, 74%, 49%)' },
    { name: 'Down Payment', value: currentScenario.downPayment, color: 'hsl(150, 45%, 35%)' },
  ];

  const printInputs = [
    { label: 'Vehicle Price', value: `${symbol}${currentScenario.vehiclePrice.toLocaleString()}` },
    { label: 'Down Payment', value: `${symbol}${currentScenario.downPayment.toLocaleString()}` },
    { label: 'Trade-In Value', value: `${symbol}${currentScenario.tradeInValue.toLocaleString()}` },
    { label: 'VAT', value: `${currentScenario.salesTax}%` },
    ...(calculationType === 'loan' 
      ? [
          { label: 'Loan Term', value: `${currentScenario.loanTerm} months` },
          { label: 'Interest Rate', value: `${currentScenario.interestRate}%` },
        ]
      : [
          { label: 'Lease Term', value: `${currentScenario.leaseTerm} months` },
          { label: 'Residual Value', value: `${currentScenario.residualPercent}%` },
        ]
    ),
  ];

  const printResults = calculationType === 'loan' 
    ? [
        { label: 'Monthly Payment', value: formatCurrency(results.loanPayment) },
        { label: 'Total of Payments', value: formatCurrency(results.totalLoanPayments) },
        { label: 'Total Interest', value: formatCurrency(results.totalLoanInterest) },
        { label: 'Total Cost', value: formatCurrency(results.totalLoanCost) },
      ]
    : [
        { label: 'Monthly Payment', value: formatCurrency(results.leasePayment) },
        { label: 'Total of Payments', value: formatCurrency(results.totalLeasePayments) },
        { label: 'Residual Value', value: formatCurrency(results.residualValue) },
        { label: 'Total Lease Cost', value: formatCurrency(results.totalLeaseCost) },
      ];

  const renderScenarioForm = (scenario, index) => {
    const scenarioResults = compareResults[index];
    return (
      <div className="space-y-4">
        <InputField
          label="Vehicle Price"
          id={`price-${scenario.id}`}
          value={scenario.vehiclePrice}
          onChange={(val) => updateScenario(index, 'vehiclePrice', val)}
          prefix={symbol}
          min={1000}
          step={1000}
        />
        <InputField
          label="Down Payment"
          id={`down-${scenario.id}`}
          value={scenario.downPayment}
          onChange={(val) => updateScenario(index, 'downPayment', val)}
          prefix={symbol}
          min={0}
          step={500}
        />
        <SliderField
          label="Interest Rate"
          id={`rate-${scenario.id}`}
          value={scenario.interestRate}
          onChange={(val) => updateScenario(index, 'interestRate', val)}
          min={0}
          max={20}
          step={0.1}
          suffix="%"
        />
        <SelectField
          label="Loan Term"
          id={`term-${scenario.id}`}
          value={scenario.loanTerm}
          onChange={(val) => updateScenario(index, 'loanTerm', val)}
          options={loanTermOptions}
        />
        
        <div className="pt-4 border-t border-border">
          <ResultDisplay
            label="Monthly Payment"
            value={scenarioResults.loanPayment}
            size="lg"
            variant="premium"
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
            Car Finance Calculator
          </h1>
          <p className="text-muted-foreground">
            Compare loan and lease options for vehicle financing
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
              title={`Car ${calculationType === 'loan' ? 'Loan' : 'Lease'} Analysis`}
              calculatorType="car-finance"
              inputs={printInputs}
              results={printResults}
            />
          )}
        </div>
      </div>

      <Disclaimer />

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
          <div className="lg:col-span-1 space-y-6">
            {/* Calculation Type Toggle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-foreground">Calculation Type</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={calculationType === 'loan' ? 'premium' : 'outline'}
                    onClick={() => setCalculationType('loan')}
                    className="gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Buy (Loan)
                  </Button>
                  <Button
                    variant={calculationType === 'lease' ? 'premium' : 'outline'}
                    onClick={() => setCalculationType('lease')}
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Lease
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CalculatorCard
              title="Vehicle Details"
              description="Enter your vehicle and financing information"
              icon={Car}
            >
              <div className="space-y-5">
                <InputField
                  label="Vehicle Price"
                  id="vehiclePrice"
                  value={currentScenario.vehiclePrice}
                  onChange={(val) => updateScenario(0, 'vehiclePrice', val)}
                  prefix={symbol}
                  min={1000}
                  step={1000}
                  tooltip="The total price of the vehicle"
                />
                
                <InputField
                  label="Down Payment"
                  id="downPayment"
                  value={currentScenario.downPayment}
                  onChange={(val) => updateScenario(0, 'downPayment', val)}
                  prefix={symbol}
                  min={0}
                  step={500}
                />
                
                <InputField
                  label="Trade-In Value"
                  id="tradeInValue"
                  value={currentScenario.tradeInValue}
                  onChange={(val) => updateScenario(0, 'tradeInValue', val)}
                  prefix={symbol}
                  min={0}
                  step={500}
                />
                
                <SliderField
                  label="VAT Rate"
                  id="salesTax"
                  value={currentScenario.salesTax}
                  onChange={(val) => updateScenario(0, 'salesTax', val)}
                  min={0}
                  max={20}
                  step={0.5}
                  suffix="%"
                  tooltip="South Africa VAT is 15%"
                />

                {calculationType === 'loan' ? (
                  <>
                    <SliderField
                      label="Interest Rate (APR)"
                      id="interestRate"
                      value={currentScenario.interestRate}
                      onChange={(val) => updateScenario(0, 'interestRate', val)}
                      min={0}
                      max={20}
                      step={0.1}
                      suffix="%"
                    />
                    
                    <SelectField
                      label="Loan Term"
                      id="loanTerm"
                      value={currentScenario.loanTerm}
                      onChange={(val) => updateScenario(0, 'loanTerm', val)}
                      options={loanTermOptions}
                    />

                    <SliderField
                      label="Balloon Payment"
                      id="balloonPercent"
                      value={currentScenario.balloonPercent}
                      onChange={(val) => updateScenario(0, 'balloonPercent', val)}
                      min={0}
                      max={50}
                      step={5}
                      suffix="%"
                      tooltip="Final lump sum payment due at end of loan term (reduces monthly payments but increases total cost)"
                    />
                    
                    {currentScenario.balloonPercent > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-600">
                          <strong>Balloon Payment:</strong> {formatCurrency(results.balloonAmount)} due at end of term
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <SelectField
                      label="Lease Term"
                      id="leaseTerm"
                      value={currentScenario.leaseTerm}
                      onChange={(val) => updateScenario(0, 'leaseTerm', val)}
                      options={leaseTermOptions}
                    />
                    
                    <SliderField
                      label="Residual Value"
                      id="residualPercent"
                      value={currentScenario.residualPercent}
                      onChange={(val) => updateScenario(0, 'residualPercent', val)}
                      min={30}
                      max={70}
                      step={1}
                      suffix="%"
                      tooltip="The vehicle's estimated value at lease end"
                    />
                    
                    <InputField
                      label="Money Factor"
                      id="moneyFactor"
                      value={currentScenario.moneyFactor}
                      onChange={(val) => updateScenario(0, 'moneyFactor', val)}
                      prefix=""
                      min={0}
                      max={0.01}
                      step={0.00001}
                      tooltip="Lease interest rate (divide APR by 2400)"
                    />
                  </>
                )}
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
                    <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                      {calculationType === 'loan' ? 'Auto Loan' : 'Lease'}
                    </Badge>
                  </div>
                  <ResultDisplay
                    label="Monthly Payment"
                    value={calculationType === 'loan' ? results.loanPayment : results.leasePayment}
                    size="xl"
                    variant="premium"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Secondary Results */}
            {calculationType === 'loan' ? (
              <ResultGrid columns={4}>
                <ResultDisplay
                  label="Amount Financed"
                  value={results.netPrice}
                  variant="muted"
                />
                <ResultDisplay
                  label="Total Interest"
                  value={results.totalLoanInterest}
                  variant="success"
                />
                <ResultDisplay
                  label="Total of Payments"
                  value={results.totalLoanPayments}
                  variant="muted"
                />
                <ResultDisplay
                  label="Total Cost"
                  value={results.totalLoanCost}
                  variant="premium"
                />
              </ResultGrid>
            ) : (
              <ResultGrid columns={4}>
                <ResultDisplay
                  label="Cap Cost"
                  value={results.netPrice}
                  variant="muted"
                />
                <ResultDisplay
                  label="Residual Value"
                  value={results.residualValue}
                  variant="success"
                />
                <ResultDisplay
                  label="Total Payments"
                  value={results.totalLeasePayments}
                  variant="muted"
                />
                <ResultDisplay
                  label="Total Lease Cost"
                  value={results.totalLeaseCost}
                  variant="premium"
                />
              </ResultGrid>
            )}

            {/* Loan vs Lease Comparison */}
            <Card className="border-2 border-forest/20">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-forest" />
                  Buy vs Lease Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Loan Monthly</p>
                    <p className="text-lg font-bold text-foreground">{symbol}{results.loanPayment.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Lease Monthly</p>
                    <p className="text-lg font-bold text-foreground">{symbol}{results.leasePayment.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gold/10 border border-gold/20">
                    <p className="text-xs text-muted-foreground mb-1">Difference</p>
                    <p className="text-lg font-bold text-gold">
                      {symbol}{Math.abs(results.loanPayment - results.leasePayment).toFixed(2)}
                      <span className="text-xs font-normal">/mo</span>
                    </p>
                  </div>
                </div>
                <ComparisonBarChart
                  data={results.comparisonData}
                  dataKeys={[
                    { key: 'loan', name: 'Buy (Loan)', color: 'hsl(215, 50%, 35%)' },
                    { key: 'lease', name: 'Lease', color: 'hsl(43, 74%, 49%)' },
                  ]}
                  xAxisKey="name"
                  height={200}
                  showLegend={true}
                />
              </CardContent>
            </Card>

            {/* Charts */}
            <Tabs defaultValue={calculationType === 'loan' ? 'amortization' : 'breakdown'} className="w-full">
              <TabsList className="w-full justify-start">
                {calculationType === 'loan' && (
                  <TabsTrigger value="amortization" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Amortization
                  </TabsTrigger>
                )}
                <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
              </TabsList>
              
              {calculationType === 'loan' && (
                <TabsContent value="amortization" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-medium">Loan Amortization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GrowthAreaChart
                        data={results.amortizationData}
                        dataKeys={[
                          { key: 'principal', name: 'Principal Paid', color: 'hsl(150, 45%, 35%)' },
                          { key: 'interest', name: 'Interest Paid', color: 'hsl(43, 74%, 49%)' },
                        ]}
                        xAxisKey="year"
                        height={320}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              <TabsContent value="breakdown" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      {calculationType === 'loan' ? 'Loan' : 'Lease'} Cost Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BreakdownPieChart
                      data={calculationType === 'loan' ? loanPieData : leasePieData}
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
