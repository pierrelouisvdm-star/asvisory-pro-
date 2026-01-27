import React from 'react';
import { useCurrency, currencies } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CurrencySelector = ({ className }) => {
  const { currency, setCurrency, currentCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          data-testid="currency-selector"
          className={cn(
            "gap-2 h-9 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800", 
            className
          )}
        >
          <span className="font-semibold text-slate-900 dark:text-white">{currentCurrency.symbol}</span>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">{currency}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {Object.values(currencies).map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            data-testid={`currency-option-${curr.code}`}
            className={cn(
              "gap-3 cursor-pointer rounded-md",
              currency === curr.code && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
            )}
          >
            <span className="font-semibold w-6">{curr.symbol}</span>
            <span>{curr.code}</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">- {curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
