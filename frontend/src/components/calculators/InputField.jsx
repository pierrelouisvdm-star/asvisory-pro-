import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const InputField = ({
  label,
  id,
  type = 'number',
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  min,
  max,
  step = 1,
  tooltip,
  className,
  disabled = false,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            prefix && "pl-10",
            suffix && "pr-12"
          )}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export const SliderField = ({
  label,
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix = '',
  suffix = '',
  tooltip,
  className,
  showValue = true,
  formatValue,
}) => {
  const displayValue = formatValue 
    ? formatValue(value) 
    : `${prefix}${value.toLocaleString()}${suffix}`;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {showValue && (
          <span className="text-sm font-semibold text-gold tabular-nums">
            {displayValue}
          </span>
        )}
      </div>
      <Slider
        id={id}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={step}
        className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold [&_[role=slider]]:shadow-gold [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_.relative]:bg-border [&_[data-orientation=horizontal]_.absolute]:bg-gold"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
};

export const SelectField = ({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  tooltip,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 border-2 focus:border-gold focus:ring-2 focus:ring-gold/20">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
