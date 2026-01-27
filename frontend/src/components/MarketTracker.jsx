import React, { useState, useEffect, useCallback } from 'react';
import { marketApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, RefreshCw, Clock, 
  BarChart3, DollarSign, Globe, Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';

const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const MarketTracker = ({ compact = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await marketApi.getData();
      setData(result);
      setLastFetch(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Loading market data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const MarketItem = ({ name, value, change, changePercent, isIndex = true }) => (
    <div className="flex items-center justify-between py-3 border-b border-navy-700 last:border-0">
      <div>
        <p className="font-medium text-sm text-white">{name}</p>
        <p className="text-lg font-bold text-slate-200">
          {isIndex ? formatNumber(value) : `R${value.toFixed(4)}`}
        </p>
      </div>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded",
        change >= 0 
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-red-500/20 text-red-400"
      )}>
        {change >= 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span className="text-xs font-medium">
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-1" data-testid="market-tracker-compact">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Live Markets
          </h4>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(data?.last_updated)}
          </Badge>
        </div>
        {data?.indices?.slice(0, 4).map((idx) => (
          <MarketItem 
            key={idx.symbol} 
            name={idx.name} 
            value={idx.value}
            change={idx.change}
            changePercent={idx.change_percent}
          />
        ))}
      </div>
    );
  }

  return (
    <Card data-testid="market-tracker">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Live Market Tracker
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Updated {formatTime(data?.last_updated)}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          Refreshes every 15 minutes
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indices">
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="indices">
              <Globe className="h-4 w-4 mr-2" />
              Indices
            </TabsTrigger>
            <TabsTrigger value="commodities">
              <Coins className="h-4 w-4 mr-2" />
              Commodities
            </TabsTrigger>
            <TabsTrigger value="currencies">
              <DollarSign className="h-4 w-4 mr-2" />
              Currencies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indices" className="mt-0">
            <div className="space-y-0">
              {data?.indices?.map((idx) => (
                <MarketItem 
                  key={idx.symbol} 
                  name={idx.name} 
                  value={idx.value}
                  change={idx.change}
                  changePercent={idx.change_percent}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commodities" className="mt-0">
            <div className="space-y-0">
              {data?.commodities?.map((com) => (
                <MarketItem 
                  key={com.symbol} 
                  name={com.name} 
                  value={com.value}
                  change={com.change}
                  changePercent={com.change_percent}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="currencies" className="mt-0">
            <div className="space-y-0">
              {data?.currencies?.map((cur) => (
                <MarketItem 
                  key={cur.pair} 
                  name={cur.pair} 
                  value={cur.rate}
                  change={cur.change}
                  changePercent={cur.change_percent}
                  isIndex={false}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
