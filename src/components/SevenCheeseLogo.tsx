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
  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden ${className}`}
        style={{ height: `${height}px`, width: `${height}px` }}
      >
        <img
          src="/logo-icon.svg"
          alt="7 Cheese Pizza"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center shrink-0 ${className}`}
      style={{ height: `${height}px` }}
    >
      <img
        src="/logo.svg"
        alt="7 Cheese Pizza"
        className="h-full w-auto object-contain max-w-[220px] sm:max-w-[260px]"
      />
    </div>
  );
};
