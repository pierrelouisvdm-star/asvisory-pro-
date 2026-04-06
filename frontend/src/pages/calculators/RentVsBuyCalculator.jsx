import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Building2, Home, TrendingUp, DollarSign, CheckCircle2, Info } from 'lucide-react';
import { Disclaimer } from '@/components/calculators/Disclaimer';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const calcMonthlyMortgage = (principal, annualRate, months) => {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

export default function RentVsBuyCalculator() {
  const [homePrice, setHomePrice] = useState(450000);
  const [downPayment, setDownPayment] = useState(90000);
  const [mortgageRate, setMortgageRate] = useState(7.0);
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [homeInsurance, setHomeInsurance] = useState(200);
  const [maintenanceRate, setMaintenanceRate] = useState(1.0);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [homeAppreciationRate, setHomeAppreciationRate] = useState(3.5);
  const [monthlyRent, setMonthlyRent] = useState(2200);
  const [rentIncreaseRate, setRentIncreaseRate] = useState(3.0);
  const [investmentReturnRate, setInvestmentReturnRate] = useState(7.0);
  const [marginalTaxRate, setMarginalTaxRate] = useState(22);
  const [analysisYears, setAnalysisYears] = useState(10);

  const results = useMemo(() => {
    const loan = homePrice - downPayment;
    const r = mortgageRate / 100;
    const monthlyPI = calcMonthlyMortgage(loan, r, loanTerm * 12);
    const monthlyTax = (homePrice * propertyTaxRate / 100) / 12;
    const monthlyMaintenance = (homePrice * maintenanceRate / 100) / 12;

    const chartData = [];
    let buyTotalCost = downPayment; // upfront
    let rentTotalCost = 0;
    let rentInvestmentBalance = downPayment; // opportunity cost of down payment invested
    let homeValue = homePrice;
    let loanBalance = loan;
    let currentRent = monthlyRent;

    // Buying: monthly PITI + maintenance + HOA
    const monthlyBuyTotal = monthlyPI + monthlyTax + homeInsurance + monthlyMaintenance + hoaMonthly;

    for (let yr = 1; yr <= analysisYears; yr++) {
      // Home appreciation
      homeValue *= (1 + homeAppreciationRate / 100);

      // Loan amortization for the year
      const rM = r / 12;
      let interestPaidYr = 0;
      for (let m = 0; m < 12; m++) {
        const interestM = loanBalance * rM;
        const principalM = monthlyPI - interestM;
        interestPaidYr += interestM;
        loanBalance = Math.max(0, loanBalance - principalM);
        buyTotalCost += monthlyBuyTotal;
      }

      // Mortgage interest deduction (simplified: assume itemize if interest+property tax > std deduction)
      const annualInterest = interestPaidYr;
      const annualTax = monthlyTax * 12;
      const saltCapped = Math.min(annualTax, 10000);
      const totalItemized = annualInterest + saltCapped;
      const stdDed = 15750; // 2025 single standard deduction
      const deductionBenefit = totalItemized > stdDed ? (totalItemized - stdDed) * marginalTaxRate / 100 : 0;
      buyTotalCost -= deductionBenefit;

      // Rent
      for (let m = 0; m < 12; m++) {
        rentTotalCost += currentRent;
        rentInvestmentBalance = rentInvestmentBalance * (1 + investmentReturnRate / 100 / 12) + (monthlyBuyTotal - currentRent > 0 ? monthlyBuyTotal - currentRent : 0);
      }
      currentRent *= (1 + rentIncreaseRate / 100);

      // Home equity
      const homeEquity = homeValue - loanBalance;
      // Renter's wealth: invested down payment + difference invested
      const renterWealth = rentInvestmentBalance;

      chartData.push({
        year: yr,
        buyTotalCost: Math.round(buyTotalCost),
        rentTotalCost: Math.round(rentTotalCost),
        homeEquity: Math.round(homeEquity),
        renterWealth: Math.round(renterWealth),
        buyNetCost: Math.round(buyTotalCost - homeEquity),
        rentNetCost: Math.round(rentTotalCost - renterWealth),
      });
    }

    const lastPoint = chartData[chartData.length - 1];
    const buyWins = lastPoint.buyNetCost < lastPoint.rentNetCost;

    // Find break-even
    let breakEvenYear = null;
    for (const point of chartData) {
      if (point.buyNetCost <= point.rentNetCost) {
        breakEvenYear = point.year;
        break;
      }
    }

    return { chartData, lastPoint, buyWins, breakEvenYear, monthlyBuyTotal };
  }, [homePrice, downPayment, mortgageRate, loanTerm, propertyTaxRate, homeInsurance, maintenanceRate, hoaMonthly, homeAppreciationRate, monthlyRent, rentIncreaseRate, investmentReturnRate, marginalTaxRate, analysisYears]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
          <Building2 className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Rent vs. Buy Analyzer</h1>
          <p className="text-muted-foreground text-sm">True cost comparison including opportunity cost, appreciation, and tax benefits</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Home className="h-4 w-4" /> Buying Costs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Home Price ($)</Label>
                <Input type="number" value={homePrice} onChange={e => setHomePrice(+e.target.value)} className="h-9 mt-1" data-testid="rvb-home-price" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Down Payment ($)</Label>
                <Input type="number" value={downPayment} onChange={e => setDownPayment(+e.target.value)} className="h-9 mt-1" data-testid="rvb-down-payment" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Mortgage Rate</Label>
                  <span className="text-xs font-medium text-primary">{mortgageRate}%</span>
                </div>
                <Slider value={[mortgageRate]} onValueChange={([v]) => setMortgageRate(v)} min={3} max={12} step={0.125} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Home Appreciation/yr</Label>
                  <span className="text-xs font-medium text-emerald-500">{homeAppreciationRate}%</span>
                </div>
                <Slider value={[homeAppreciationRate]} onValueChange={([v]) => setHomeAppreciationRate(v)} min={0} max={8} step={0.5} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Property Tax Rate (%/yr)</Label>
                <Input type="number" value={propertyTaxRate} onChange={e => setPropertyTaxRate(+e.target.value)} className="h-9 mt-1" step={0.1} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">HOA Monthly ($)</Label>
                <Input type="number" value={hoaMonthly} onChange={e => setHoaMonthly(+e.target.value)} className="h-9 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Renting Costs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Monthly Rent ($)</Label>
                <Input type="number" value={monthlyRent} onChange={e => setMonthlyRent(+e.target.value)} className="h-9 mt-1" data-testid="rvb-monthly-rent" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Annual Rent Increase</Label>
                  <span className="text-xs font-medium text-amber-500">{rentIncreaseRate}%</span>
                </div>
                <Slider value={[rentIncreaseRate]} onValueChange={([v]) => setRentIncreaseRate(v)} min={0} max={8} step={0.5} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Investment Return Rate</Label>
                  <span className="text-xs font-medium text-blue-500">{investmentReturnRate}%</span>
                </div>
                <Slider value={[investmentReturnRate]} onValueChange={([v]) => setInvestmentReturnRate(v)} min={3} max={12} step={0.5} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Marginal Tax Rate (%)</Label>
                <Input type="number" value={marginalTaxRate} onChange={e => setMarginalTaxRate(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Analysis Period (years)</Label>
                <div className="flex gap-2 mt-1">
                  {[5, 7, 10, 15, 20].map(y => (
                    <button key={y} onClick={() => setAnalysisYears(y)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${analysisYears === y ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {y}y
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className={results.buyWins ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {results.buyWins
                  ? <Home className="h-6 w-6 text-emerald-500" />
                  : <Building2 className="h-6 w-6 text-blue-500" />
                }
                <div>
                  <p className="font-bold text-foreground text-lg">
                    {results.buyWins ? 'Buying wins' : 'Renting wins'} over {analysisYears} years
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {results.breakEvenYear
                      ? `Break-even: Year ${results.breakEvenYear}`
                      : 'Renting is more cost-effective over this period'
                    }
                    {' · '}
                    Monthly buying cost: {fmt(results.monthlyBuyTotal)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: `Net Buying Cost (Yr ${analysisYears})`, value: fmt(results.lastPoint?.buyNetCost), color: 'emerald' },
                  { label: `Net Renting Cost (Yr ${analysisYears})`, value: fmt(results.lastPoint?.rentNetCost), color: 'blue' },
                  { label: `Home Equity (Yr ${analysisYears})`, value: fmt(results.lastPoint?.homeEquity), color: 'amber' },
                  { label: `Renter Wealth (Yr ${analysisYears})`, value: fmt(results.lastPoint?.renterWealth), color: 'purple' },
                ].map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-base font-bold text-${item.color}-500`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Net Cost Over Time (Total Paid − Wealth Built)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="year" tickFormatter={y => `Yr ${y}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v)]} labelFormatter={l => `Year ${l}`} />
                  <Legend />
                  <Area type="monotone" dataKey="buyNetCost" name="Buying (net)" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                  <Area type="monotone" dataKey="rentNetCost" name="Renting (net)" stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                  {results.breakEvenYear && (
                    <ReferenceLine x={results.breakEvenYear} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Break-even', fontSize: 10 }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Net cost = Total cash outflows minus wealth accumulated (home equity for buyers, investment portfolio for renters).
                Lower net cost is better. This model accounts for mortgage interest deduction, opportunity cost of down payment,
                property appreciation, and rent inflation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
