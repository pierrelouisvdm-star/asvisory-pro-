import React from 'react';
import { useCurrency, currencies } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DollarSign, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CurrencySelector = ({ className }) => {
  const { currency, setCurrency, currentCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 h-9", className)}>
          <span className="font-semibold">{currentCurrency.symbol}</span>
          <span className="hidden sm:inline text-muted-foreground">{currency}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(currencies).map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className={cn(
              "gap-3 cursor-pointer",
              currency === curr.code && "bg-gold/10 text-gold"
            )}
          >
            <span className="font-semibold w-6">{curr.symbol}</span>
            <span>{curr.code}</span>
            <span className="text-muted-foreground text-xs">- {curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
