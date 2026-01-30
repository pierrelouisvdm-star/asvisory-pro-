import React from 'react';
import { Info } from 'lucide-react';

export const Disclaimer = () => {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md mb-6">
      <Info className="h-3 w-3 flex-shrink-0" />
      <span>For illustrative purposes only</span>
    </div>
  );
};
