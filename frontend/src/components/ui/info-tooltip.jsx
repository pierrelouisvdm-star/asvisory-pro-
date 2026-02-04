import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * InfoTooltip - A reusable info icon with tooltip/popover
 * Use tooltip for short explanations, popover for longer content
 */
export const InfoTooltip = ({ 
  content, 
  title,
  variant = 'tooltip', // 'tooltip' for hover, 'popover' for click
  size = 'sm',
  className,
  iconClassName,
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconClass = cn(
    sizeClasses[size],
    'text-muted-foreground hover:text-foreground cursor-help transition-colors',
    iconClassName
  );

  if (variant === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn('inline-flex items-center', className)}>
            <Info className={iconClass} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          {title && (
            <h4 className="font-semibold text-sm mb-2 text-foreground">{title}</h4>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed">
            {content}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn('inline-flex items-center', className)}>
            <Info className={iconClass} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          {title && (
            <p className="font-semibold text-sm mb-1">{title}</p>
          )}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * SectionInfo - Info box for section headers with expandable content
 */
export const SectionInfo = ({
  title,
  description,
  tips,
  className,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          'inline-flex items-center justify-center rounded-full',
          'h-5 w-5 bg-blue-500/20 hover:bg-blue-500/30 transition-colors',
          className
        )}>
          <Info className="h-3 w-3 text-blue-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          {title && (
            <h4 className="font-semibold text-foreground">{title}</h4>
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {tips && tips.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Tips:</p>
              <ul className="space-y-1">
                {tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InfoTooltip;
