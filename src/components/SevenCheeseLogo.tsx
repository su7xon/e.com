import React from 'react';

interface SevenCheeseLogoProps {
  variant?: 'full' | 'icon' | 'badge';
  className?: string;
  height?: number;
}

export const SevenCheeseLogo: React.FC<SevenCheeseLogoProps> = ({
  variant = 'full',
  className = '',
  height = 36,
}) => {
  const logoSrc = '/Screenshot_2026-09-09_210354-removebg-preview.png';

  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden ${className}`}
        style={{ height: `${height}px`, width: `${height}px` }}
      >
        <img
          src={logoSrc}
          alt="7 Cheese Pizza"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 shrink-0 ${className}`}
      style={{ height: `${height}px` }}
    >
      <img
        src={logoSrc}
        alt="7 Cheese Pizza"
        className="h-full w-auto object-contain"
      />
      <span className="text-slate-900 font-black tracking-tight leading-none" style={{ fontSize: `${height * 0.42}px` }}>
        7 CHEESE PIZZA
      </span>
    </div>
  );
};
