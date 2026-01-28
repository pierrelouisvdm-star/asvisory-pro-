import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const ResultDisplay = ({ 
  label, 
  value, 
  prefix = 'R', 
  suffix = '',
  trend,
  trendValue,
  size = 'default',
  variant = 'default',
  className 
}) => {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  const sizeClasses = {
    sm: 'text-lg',
    default: 'text-2xl',
    lg: 'text-3xl lg:text-4xl',
    xl: 'text-4xl lg:text-5xl',
  };

  const variantClasses = {
    default: 'bg-slate-50 dark:bg-slate-800/50 border border-navy-700 rounded-xl',
    premium: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl',
    muted: 'bg-slate-100 dark:bg-slate-800 border border-navy-700 rounded-xl',
  };

  return (
    <div className={cn(
      "px-5 py-4",
      variantClasses[variant],
      className
    )}>
      <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={cn(
          "font-display font-bold text-white animate-count-up",
          sizeClasses[size]
        )}>
          {prefix}{formattedValue}{suffix}
        </span>
        {trend && trendValue && (
          <span className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
            trend === 'up' && "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
            trend === 'down' && "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30",
            trend === 'neutral' && "text-slate-400 bg-slate-100 dark:bg-slate-800"
          )}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

export const ResultGrid = ({ children, columns = 2, className }) => {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
};
