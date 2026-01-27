import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const CalculatorCard = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className,
  headerAction 
}) => {
  return (
    <Card className={cn(
      "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800">
                <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div>
              <CardTitle className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
