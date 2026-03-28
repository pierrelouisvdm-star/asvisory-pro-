import React from 'react';

export const AdvisoryProLogo = ({ 
  className = '', 
  size = 'default',
  showText = true,
  iconOnly = false 
}) => {
  // Size configurations
  const sizes = {
    small: { icon: 32, text: 'text-lg' },
    default: { icon: 40, text: 'text-2xl' },
    large: { icon: 56, text: 'text-4xl' },
    hero: { icon: 72, text: 'text-5xl sm:text-6xl' }
  };
  
  const { icon: iconSize, text: textSize } = sizes[size] || sizes.default;

  if (iconOnly) {
    return (
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Shield outline */}
        <path 
          d="M24 4L6 12V22C6 33.1 13.68 43.32 24 46C34.32 43.32 42 33.1 42 22V12L24 4Z" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* A shape / Arrow pointing up */}
        <path 
          d="M24 14L15 32H19.5L24 22L28.5 32H33L24 14Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* Horizontal bar of the A */}
        <path 
          d="M18 27H30" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Shield Icon */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield outline */}
        <path 
          d="M24 4L6 12V22C6 33.1 13.68 43.32 24 46C34.32 43.32 42 33.1 42 22V12L24 4Z" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* A shape / Arrow pointing up */}
        <path 
          d="M24 14L15 32H19.5L24 22L28.5 32H33L24 14Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* Horizontal bar of the A */}
        <path 
          d="M18 27H30" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
      
      {/* Text */}
      {showText && (
        <div className={`font-bold tracking-tight ${textSize}`}>
          <span className="text-slate-200">ADVISORY</span>
          <span className="text-white">PRO</span>
        </div>
      )}
    </div>
  );
};

// Compact version for header/navbar
export const AdvisoryProLogoCompact = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        width={32} 
        height={32} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 text-white"
      >
        {/* Shield outline */}
        <path 
          d="M24 4L6 12V22C6 33.1 13.68 43.32 24 46C34.32 43.32 42 33.1 42 22V12L24 4Z" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* A shape */}
        <path 
          d="M24 14L15 32H19.5L24 22L28.5 32H33L24 14Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* Horizontal bar */}
        <path 
          d="M18 27H30" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
      
      <div className="font-bold tracking-tight text-xl">
        <span className="text-slate-300">ADVISORY</span>
        <span className="text-white">PRO</span>
      </div>
    </div>
  );
};

export default AdvisoryProLogo;
