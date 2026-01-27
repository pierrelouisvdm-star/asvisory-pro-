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
      "calculator-card overflow-hidden",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-forest/10 ring-1 ring-gold/20">
                <Icon className="h-6 w-6 text-gold" />
              </div>
            )}
            <div>
              <CardTitle className="font-display text-xl font-semibold text-foreground">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm text-muted-foreground mt-1">
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
