import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, GitCompare, TrendingUp, TrendingDown, Minus, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonBarChart } from './GrowthChart';

export const ComparisonMode = ({
  scenarios,
  onAddScenario,
  onRemoveScenario,
  onDuplicateScenario,
  renderScenarioForm,
  compareResults,
  maxScenarios = 3,
  className,
}) => {
  const canAddMore = scenarios.length < maxScenarios;

  const getComparisonData = () => {
    if (!compareResults || scenarios.length < 2) return [];
    
    return compareResults.map((result, index) => ({
      name: `Scenario ${index + 1}`,
      value: result.finalValue || 0,
      ...result,
    }));
  };

  const getBestScenario = () => {
    if (!compareResults || scenarios.length < 2) return null;
    
    let bestIndex = 0;
    let bestValue = compareResults[0]?.finalValue || 0;
    
    compareResults.forEach((result, index) => {
      if ((result.finalValue || 0) > bestValue) {
        bestValue = result.finalValue || 0;
        bestIndex = index;
      }
    });
    
    return bestIndex;
  };

  const bestScenarioIndex = getBestScenario();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-forest/10 ring-1 ring-gold/20">
            <GitCompare className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Scenario Comparison
            </h3>
            <p className="text-sm text-muted-foreground">
              Compare up to {maxScenarios} different scenarios side by side
            </p>
          </div>
        </div>
        {canAddMore && (
          <Button 
            variant="outline-gold" 
            size="sm" 
            onClick={onAddScenario}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Scenario
          </Button>
        )}
      </div>

      {/* Scenarios Grid */}
      <div className={cn(
        "grid gap-4",
        scenarios.length === 1 && "grid-cols-1",
        scenarios.length === 2 && "grid-cols-1 lg:grid-cols-2",
        scenarios.length >= 3 && "grid-cols-1 lg:grid-cols-3"
      )}>
        {scenarios.map((scenario, index) => (
          <Card 
            key={scenario.id} 
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              bestScenarioIndex === index && scenarios.length > 1 && "ring-2 ring-gold shadow-gold"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    Scenario {index + 1}
                  </CardTitle>
                  {bestScenarioIndex === index && scenarios.length > 1 && (
                    <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Best
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDuplicateScenario(index)}
                    disabled={!canAddMore}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onRemoveScenario(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderScenarioForm(scenario, index)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Results */}
      {scenarios.length > 1 && compareResults && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="font-display text-lg">Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="chart">Chart View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart">
                <ComparisonBarChart
                  data={getComparisonData()}
                  dataKeys={[{ key: 'value', name: 'Final Value', color: 'hsl(43, 74%, 49%)' }]}
                  xAxisKey="name"
                  height={250}
                />
              </TabsContent>
              
              <TabsContent value="table">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Metric</th>
                        {scenarios.map((_, index) => (
                          <th key={index} className="py-3 px-4 text-right font-semibold text-muted-foreground">
                            Scenario {index + 1}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-right font-semibold text-muted-foreground">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareResults[0] && Object.keys(compareResults[0]).map((key) => {
                        if (key === 'finalValue') return null;
                        const values = compareResults.map(r => r[key] || 0);
                        const maxVal = Math.max(...values.map(v => typeof v === 'number' ? v : 0));
                        const minVal = Math.min(...values.map(v => typeof v === 'number' ? v : 0));
                        const diff = maxVal - minVal;
                        
                        return (
                          <tr key={key} className="border-b border-border/50">
                            <td className="py-3 px-4 font-medium text-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </td>
                            {values.map((value, index) => (
                              <td 
                                key={index} 
                                className={cn(
                                  "py-3 px-4 text-right tabular-nums",
                                  typeof value === 'number' && value === maxVal && "text-success font-semibold",
                                  typeof value === 'number' && value === minVal && scenarios.length > 1 && "text-muted-foreground"
                                )}
                              >
                                {typeof value === 'number' 
                                  ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : value
                                }
                              </td>
                            ))}
                            <td className="py-3 px-4 text-right tabular-nums">
                              {typeof diff === 'number' && diff !== 0 ? (
                                <span className="flex items-center justify-end gap-1 text-gold">
                                  {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                  ${diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
