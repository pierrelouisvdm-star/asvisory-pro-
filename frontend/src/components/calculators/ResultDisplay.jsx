import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const ResultDisplay = ({ 
  label, 
  value, 
  prefix = '$', 
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
    default: 'result-highlight',
    premium: 'bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 rounded-xl',
    success: 'bg-gradient-to-br from-forest/15 to-forest/5 border border-forest/30 rounded-xl',
    muted: 'bg-muted/50 border border-border rounded-xl',
  };

  return (
    <div className={cn(
      "px-5 py-4",
      variantClasses[variant],
      className
    )}>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={cn(
          "font-display font-bold text-foreground animate-count-up",
          sizeClasses[size]
        )}>
          {prefix}{formattedValue}{suffix}
        </span>
        {trend && trendValue && (
          <span className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
            trend === 'up' && "text-success bg-success/10",
            trend === 'down' && "text-destructive bg-destructive/10",
            trend === 'neutral' && "text-muted-foreground bg-muted"
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
