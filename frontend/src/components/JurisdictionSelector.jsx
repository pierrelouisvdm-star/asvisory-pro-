import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJurisdiction } from '@/context/JurisdictionContext';

export const JurisdictionSelector = ({ className }) => {
  const { jurisdiction, currentJurisdiction, switchJurisdiction, jurisdictions } = useJurisdiction();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          data-testid="jurisdiction-selector"
          className={cn(
            "gap-2 h-9 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800", 
            className
          )}
        >
          <Globe className="h-4 w-4 text-slate-500" />
          <span className="text-lg leading-none">{currentJurisdiction?.flag}</span>
          <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300">{currentJurisdiction?.code}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400">
          Select Region
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {jurisdictions.map((j) => (
          <DropdownMenuItem
            key={j.code}
            onClick={() => switchJurisdiction(j.code)}
            data-testid={`jurisdiction-option-${j.code}`}
            disabled={!j.available}
            className={cn(
              "gap-3 cursor-pointer rounded-md",
              jurisdiction === j.code && j.available && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
              !j.available && "opacity-60 cursor-not-allowed"
            )}
          >
            <span className="text-lg leading-none">{j.flag}</span>
            <div className="flex-1">
              <span className="font-medium">{j.name}</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">({j.currency})</span>
            </div>
            {j.available ? (
              jurisdiction === j.code && <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700">
                Coming Soon
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
