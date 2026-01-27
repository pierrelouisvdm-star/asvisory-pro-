import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
  emerald: '#10b981',
  emeraldLight: '#34d399',
  emeraldDark: '#059669',
  slate: '#334155',
  slateLight: '#64748b',
  slateDark: '#1e293b',
  teal: '#14b8a6',
  cyan: '#06b6d4',
};

const CustomTooltip = ({ active, payload, label, prefix = '$', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {prefix}
            {typeof entry.value === 'number' 
              ? entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : entry.value}
            {suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const GrowthAreaChart = ({ 
  data, 
  dataKeys = [{ key: 'value', name: 'Value', color: CHART_COLORS.emerald }],
  xAxisKey = 'year',
  height = 300,
  prefix = '$',
  className,
  showLegend = true,
  gradientId = 'colorGradient',
}) => {
  return (
    <div className={cn("rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {dataKeys.map((dk, i) => (
              <linearGradient key={dk.key} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${prefix}${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip prefix={prefix} />} />
          {showLegend && <Legend />}
          {dataKeys.map((dk, i) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={dk.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId}-${i})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ComparisonBarChart = ({ 
  data, 
  dataKeys = [{ key: 'value', name: 'Value', color: CHART_COLORS.emerald }],
  xAxisKey = 'name',
  height = 300,
  prefix = '$',
  className,
  showLegend = true,
  layout = 'horizontal',
}) => {
  return (
    <div className={cn("rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          layout={layout}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={layout !== 'vertical'} horizontal={layout === 'vertical'} />
          <XAxis 
            dataKey={layout === 'horizontal' ? xAxisKey : undefined}
            type={layout === 'horizontal' ? 'category' : 'number'}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={layout === 'vertical' ? (value) => `${prefix}${(value / 1000).toFixed(0)}k` : undefined}
          />
          <YAxis 
            dataKey={layout === 'vertical' ? xAxisKey : undefined}
            type={layout === 'vertical' ? 'category' : 'number'}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={layout === 'horizontal' ? (value) => `${prefix}${(value / 1000).toFixed(0)}k` : undefined}
            width={layout === 'vertical' ? 80 : 60}
          />
          <Tooltip content={<CustomTooltip prefix={prefix} />} />
          {showLegend && <Legend />}
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name}
              fill={dk.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MultiLineChart = ({ 
  data, 
  dataKeys = [{ key: 'value', name: 'Value', color: CHART_COLORS.gold }],
  xAxisKey = 'year',
  height = 300,
  prefix = '$',
  className,
  showLegend = true,
}) => {
  return (
    <div className={cn("chart-container w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${prefix}${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip prefix={prefix} />} />
          {showLegend && <Legend />}
          {dataKeys.map((dk) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={dk.color}
              strokeWidth={2}
              dot={{ fill: dk.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: dk.color, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BreakdownPieChart = ({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  prefix = '$',
  className,
}) => {
  const COLORS = [CHART_COLORS.gold, CHART_COLORS.forest, CHART_COLORS.navy, CHART_COLORS.forestLight];

  return (
    <div className={cn("chart-container w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]} 
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
