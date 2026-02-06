import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-9 rounded-lg transition-colors",
        "hover:bg-muted",
        className
      )}
      data-testid="theme-toggle"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Sun className={cn(
        "h-4 w-4 transition-all",
        theme === 'dark' ? "scale-0 rotate-90" : "scale-100 rotate-0"
      )} />
      <Moon className={cn(
        "absolute h-4 w-4 transition-all",
        theme === 'dark' ? "scale-100 rotate-0" : "scale-0 -rotate-90"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
