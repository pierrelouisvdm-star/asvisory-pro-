import React, { useState, useEffect } from 'react';

// Target: April 15, 2026 — US Tax Day (creates real urgency during tax season)
const DEFAULT_TARGET = '2026-04-15T23:59:59';

export default function CountdownTimer({ targetDate = DEFAULT_TARGET, label = 'Offer expires in' }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calculate());
    const id = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.expired) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap" data-testid="countdown-timer">
      <span className="text-xs text-muted-foreground">{label}</span>
      {[
        { value: timeLeft.days, label: 'd' },
        { value: timeLeft.hours, label: 'h' },
        { value: timeLeft.minutes, label: 'm' },
        { value: timeLeft.seconds, label: 's' },
      ].map(({ value, label: unit }, i) => (
        <React.Fragment key={unit}>
          <div className="text-center">
            <div className="bg-amber-500/20 border border-amber-500/30 rounded px-2 py-0.5 font-mono font-bold text-amber-500 text-sm min-w-[32px] tabular-nums">
              {String(value).padStart(2, '0')}
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5 text-center">{unit}</p>
          </div>
          {i < 3 && <span className="text-amber-500/50 font-bold text-sm mb-2">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
