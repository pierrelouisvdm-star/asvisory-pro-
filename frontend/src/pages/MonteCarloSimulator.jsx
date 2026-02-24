import React, { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { monteCarloApi } from '@/services/api';
import { CalculatorCard } from '@/components/calculators/CalculatorCard';
import { SliderField } from '@/components/calculators/InputField';
import { ResultDisplay, ResultGrid } from '@/components/calculators/ResultDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Play, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const MonteCarloSimulator = () => {
  const { currentCurrency } = useCurrency();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const [params, setParams] = useState({
    current_savings: 0,
    monthly_contribution: 0,
    years_to_retirement: 20,
    retirement_years: 25,
    monthly_retirement_need: 0,
    expected_return: 8,
    volatility: 15,
    inflation: 5,
    num_simulations: 1000,
  });

  const runSimulation = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        // Use backend API
        const data = await monteCarloApi.runRetirement(params);
        setResults(data);
      } else {
        // Run locally (simplified)
        const result = runLocalSimulation(params);
        setResults(result);
      }
      toast.success('Simulation complete!');
    } catch (error) {
      toast.error('Simulation failed');
      // Fallback to local
      const result = runLocalSimulation(params);
      setResults(result);
    } finally {
      setLoading(false);
    }
  };

  const runLocalSimulation = (p) => {
    const simulations = p.num_simulations;
    let successCount = 0;
    const endingBalances = [];

    for (let i = 0; i < simulations; i++) {
      let balance = p.current_savings;
      
      // Accumulation
      for (let month = 0; month < p.years_to_retirement * 12; month++) {
        const monthlyReturn = gaussianRandom(p.expected_return / 100 / 12, p.volatility / 100 / Math.sqrt(12));
        balance = balance * (1 + monthlyReturn) + p.monthly_contribution;
      }
      
      const peakBalance = balance;
      
      // Withdrawal
      let failed = false;
      let annualWithdrawal = p.monthly_retirement_need * 12;
      
      for (let year = 0; year < p.retirement_years; year++) {
        if (balance <= 0) {
          failed = true;
          break;
        }
        const withdrawal = annualWithdrawal * Math.pow(1 + p.inflation / 100, year);
        const annualReturn = gaussianRandom(p.expected_return / 100, p.volatility / 100);
        balance = (balance - withdrawal) * (1 + annualReturn);
      }
      
      if (!failed && balance > 0) successCount++;
      endingBalances.push(Math.max(0, balance));
    }

    endingBalances.sort((a, b) => a - b);
    const successRate = (successCount / simulations) * 100;

    return {
      success_rate: Math.round(successRate * 10) / 10,
      num_simulations: simulations,
      ending_balance_percentiles: {
        '10th': Math.round(endingBalances[Math.floor(simulations * 0.1)]),
        '25th': Math.round(endingBalances[Math.floor(simulations * 0.25)]),
        '50th': Math.round(endingBalances[Math.floor(simulations * 0.5)]),
        '75th': Math.round(endingBalances[Math.floor(simulations * 0.75)]),
        '90th': Math.round(endingBalances[Math.floor(simulations * 0.9)]),
      },
      interpretation: interpretSuccessRate(successRate),
    };
  };

  const gaussianRandom = (mean, stdDev) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  };

  const interpretSuccessRate = (rate) => {
    if (rate >= 90) return "Excellent - High probability of success. Plan appears well-funded.";
    if (rate >= 75) return "Good - Reasonable probability of success. Consider building additional buffer.";
    if (rate >= 50) return "Fair - Some risk of shortfall. Consider increasing savings or adjusting goals.";
    return "Poor - Significant risk of running out of money. Plan adjustments recommended.";
  };

  const getSuccessColor = (rate) => {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 75) return 'text-emerald-500';
    if (rate >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const currencySymbol = currentCurrency.symbol;

  return (
    <div className="min-h-screen bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-3 bg-purple-100 text-purple-700 border-purple-200">
            <BarChart3 className="h-3 w-3 mr-1" />
            Advanced Analysis
          </Badge>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Monte Carlo Retirement Simulator
          </h1>
          <p className="text-slate-500 mt-2">
            Run thousands of simulations to assess the probability of retirement success
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <CalculatorCard title="Current Situation" icon={Target}>
              <div className="space-y-6">
                <SliderField
                  id="current_savings"
                  label="Current Retirement Savings"
                  value={params.current_savings}
                  onChange={(v) => setParams({...params, current_savings: v})}
                  min={0}
                  max={10000000}
                  step={10000}
                  prefix={currencySymbol}
                />
                <SliderField
                  id="monthly_contribution"
                  label="Monthly Contribution"
                  value={params.monthly_contribution}
                  onChange={(v) => setParams({...params, monthly_contribution: v})}
                  min={0}
                  max={50000}
                  step={500}
                  prefix={currencySymbol}
                />
                <SliderField
                  id="years_to_retirement"
                  label="Years to Retirement"
                  value={params.years_to_retirement}
                  onChange={(v) => setParams({...params, years_to_retirement: v})}
                  min={1}
                  max={40}
                  step={1}
                  suffix=" years"
                />
              </div>
            </CalculatorCard>

            <CalculatorCard title="Retirement Needs" icon={TrendingUp}>
              <div className="space-y-6">
                <SliderField
                  id="monthly_retirement_need"
                  label="Monthly Income Needed in Retirement"
                  value={params.monthly_retirement_need}
                  onChange={(v) => setParams({...params, monthly_retirement_need: v})}
                  min={5000}
                  max={200000}
                  step={1000}
                  prefix={currencySymbol}
                />
                <SliderField
                  id="retirement_years"
                  label="Years in Retirement"
                  value={params.retirement_years}
                  onChange={(v) => setParams({...params, retirement_years: v})}
                  min={10}
                  max={40}
                  step={1}
                  suffix=" years"
                />
              </div>
            </CalculatorCard>

            <CalculatorCard title="Market Assumptions" icon={BarChart3}>
              <div className="space-y-6">
                <SliderField
                  id="expected_return"
                  label="Expected Annual Return"
                  value={params.expected_return}
                  onChange={(v) => setParams({...params, expected_return: v})}
                  min={1}
                  max={15}
                  step={0.5}
                  suffix="%"
                />
                <SliderField
                  id="volatility"
                  label="Market Volatility (Std Dev)"
                  value={params.volatility}
                  onChange={(v) => setParams({...params, volatility: v})}
                  min={5}
                  max={30}
                  step={1}
                  suffix="%"
                />
                <SliderField
                  id="inflation"
                  label="Expected Inflation"
                  value={params.inflation}
                  onChange={(v) => setParams({...params, inflation: v})}
                  min={1}
                  max={10}
                  step={0.5}
                  suffix="%"
                />
              </div>
            </CalculatorCard>

            <Button 
              onClick={runSimulation} 
              className="w-full btn-premium h-12"
              disabled={loading}
              data-testid="run-simulation-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running {params.num_simulations} Simulations...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Monte Carlo Simulation
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {results ? (
              <>
                {/* Success Rate */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-navy-800/50 pb-4">
                    <CardTitle className="flex items-center gap-2">
                      {results.success_rate >= 75 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      Probability of Success
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <span className={cn("text-6xl font-bold", getSuccessColor(results.success_rate))}>
                        {results.success_rate}%
                      </span>
                      <p className="text-slate-500 mt-2">
                        Based on {results.num_simulations.toLocaleString()} simulations
                      </p>
                    </div>
                    <Progress 
                      value={results.success_rate} 
                      className={cn(
                        "h-4",
                        results.success_rate >= 75 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"
                      )}
                    />
                    <p className="text-sm text-slate-400 mt-4 p-4 bg-navy-800 rounded-lg">
                      {results.interpretation}
                    </p>
                  </CardContent>
                </Card>

                {/* Ending Balance Percentiles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Projected Ending Balance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(results.ending_balance_percentiles).map(([percentile, value]) => (
                        <div key={percentile} className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">{percentile} Percentile</span>
                          <span className="font-semibold">
                            {currencySymbol}{value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm text-slate-500">
                        The 50th percentile (median) represents the most likely outcome. 
                        The 10th percentile shows the worst-case scenario (90% of outcomes are better).
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <ResultGrid columns={2}>
                  <ResultDisplay
                    label="Median Ending Balance"
                    value={results.ending_balance_percentiles['50th']}
                    prefix={currencySymbol}
                    variant="premium"
                  />
                  <ResultDisplay
                    label="Worst Case (10th %ile)"
                    value={results.ending_balance_percentiles['10th']}
                    prefix={currencySymbol}
                    variant="muted"
                  />
                </ResultGrid>
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Ready to Simulate</h3>
                  <p className="text-slate-500 mb-4">
                    Adjust the parameters and run the simulation to see the probability of retirement success.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
