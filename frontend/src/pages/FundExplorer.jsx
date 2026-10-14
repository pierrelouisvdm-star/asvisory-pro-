import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fundsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, TrendingUp, TrendingDown, LineChart as LineChartIcon, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useJurisdiction } from '@/context/JurisdictionContext';

const formatDateTime = (dateStr, isUS) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString(isUS ? 'en-US' : 'en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RETURN_FIELDS = [
  { key: 'one_month', label: '1 Month' },
  { key: 'ytd', label: 'YTD' },
  { key: 'one_year', label: '1 Year' },
  { key: 'three_year', label: '3 Year' },
  { key: 'five_year', label: '5 Year' },
];

const formatPct = (value) => {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const ReturnBadge = ({ value }) => {
  if (value === null || value === undefined) {
    return <span className="text-slate-400">—</span>;
  }
  const positive = value >= 0;
  return (
    <span className={cn('font-medium', positive ? 'text-emerald-600' : 'text-red-500')}>
      {formatPct(value)}
    </span>
  );
};

const FundExplorer = () => {
  const { isUS } = useJurisdiction();
  const [funds, setFunds] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [market, setMarket] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadFunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fundsApi.list({ market: market === 'all' ? undefined : market });
      setFunds(result.funds || []);
      setLastUpdated(result.last_updated || null);
    } catch (err) {
      setError(err.message || 'Failed to load funds');
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

  const filteredFunds = useMemo(() => {
    if (!search.trim()) return funds;
    const q = search.trim().toLowerCase();
    return funds.filter(
      (f) => f.ticker.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  }, [funds, search]);

  const openDetail = async (ticker) => {
    setSelectedTicker(ticker);
    setDetail(null);
    setDetailLoading(true);
    try {
      const result = await fundsApi.getDetail(ticker);
      setDetail(result);
    } catch (err) {
      toast.error(err.message || 'Failed to load fund detail');
      setSelectedTicker(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedTicker(null);
    setDetail(null);
  };

  if (selectedTicker) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="fund-detail-view">
        <Button variant="ghost" className="mb-4" onClick={closeDetail} data-testid="fund-back-btn">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fund Explorer
        </Button>

        {detailLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!detailLoading && detail && (
          <>
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold" data-testid="fund-detail-name">{detail.name}</h1>
                  <Badge variant="outline">{detail.ticker}</Badge>
                  <Badge>{detail.market}</Badge>
                </div>
                <p className="text-slate-500 mt-1">{detail.category}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" data-testid="fund-detail-price">{detail.price.toLocaleString()}</div>
                <div className={cn('flex items-center justify-end gap-1 text-sm', detail.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {detail.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {detail.change >= 0 ? '+' : ''}{detail.change.toLocaleString()} ({formatPct(detail.change_percent)})
                </div>
                {detail.last_updated && (
                  <div className="flex items-center justify-end gap-1 text-xs text-slate-500 mt-1" data-testid="fund-detail-last-updated">
                    <Clock className="h-3 w-3" />
                    Updated {formatDateTime(detail.last_updated, isUS)}
                  </div>
                )}
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4" />
                  5-Year Price History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72" data-testid="fund-price-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.history}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={70} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
                        formatter={(value) => [value, 'Close']}
                      />
                      <Line type="monotone" dataKey="close" stroke="#0ea5e9" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trailing Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4" data-testid="fund-returns-grid">
                  {RETURN_FIELDS.map(({ key, label }) => (
                    <div key={key} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-xs text-slate-500 mb-1">{label}</div>
                      <ReturnBadge value={detail.returns[key]} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="fund-explorer-page">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Fund Explorer</h1>
          <p className="text-slate-500">
            Browse and compare performance of curated JSE-listed and US-listed ETFs.
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500" data-testid="fund-last-updated">
            <Clock className="h-3.5 w-3.5" />
            Updated {formatDateTime(lastUpdated, isUS)}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by ticker, name, or category..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="fund-search-input"
          />
        </div>
        <Tabs value={market} onValueChange={setMarket}>
          <TabsList data-testid="fund-market-tabs">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="SA">South Africa</TabsTrigger>
            <TabsTrigger value="US">United States</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="p-6 text-center text-red-500">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-2" data-testid="fund-list">
          {filteredFunds.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-slate-500">
                No funds match your search.
              </CardContent>
            </Card>
          )}
          {filteredFunds.map((fund) => (
            <Card
              key={fund.ticker}
              className="cursor-pointer hover:border-sky-400 transition-colors"
              onClick={() => openDetail(fund.ticker)}
              data-testid={`fund-row-${fund.ticker}`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{fund.name}</span>
                    <Badge variant="outline" className="shrink-0">{fund.ticker}</Badge>
                  </div>
                  <div className="text-sm text-slate-500">{fund.category} · {fund.market}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">{fund.price.toLocaleString()}</div>
                  <div className={cn('flex items-center justify-end gap-1 text-sm', fund.change_percent >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {fund.change_percent >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {formatPct(fund.change_percent)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FundExplorer;
