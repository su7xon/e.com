import React from 'react';

interface Props {
  isVeg: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VegNonVegIcon: React.FC<Props> = ({ isVeg, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5 p-0.5',
    md: 'w-4 h-4 p-0.5',
    lg: 'w-5 h-5 p-0.5',
  };

  const innerShapeSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (isVeg) {
    return (
      <span
        id={`icon-veg-${size}`}
        className={`inline-flex items-center justify-center border border-green-600 rounded-xs bg-white ${sizeClasses[size]} ${className}`}
        title="Pure Vegetarian"
      >
        <span className={`rounded-full bg-green-600 ${innerShapeSize[size]}`} />
      </span>
    );
  }

  return (
    <span
      id={`icon-nonveg-${size}`}
      className={`inline-flex items-center justify-center border border-red-600 rounded-xs bg-white ${sizeClasses[size]} ${className}`}
      title="Non-Vegetarian"
    >
      <span
        className={`${innerShapeSize[size]} border-l-transparent border-r-transparent border-b-red-600 border-l-[3px] border-r-[3px] border-b-[6px] w-0 h-0`}
      />
    </span>
  );
};
