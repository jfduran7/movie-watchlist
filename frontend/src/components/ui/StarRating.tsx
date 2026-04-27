import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const StarIcon: React.FC<{ filled: boolean; className: string }> = ({ filled, className }) => (
  <svg
    className={`${className} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 'md' }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isInteractive = onChange !== undefined;
  const displayValue = isInteractive && hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => isInteractive && onChange(star)}
          onMouseEnter={() => isInteractive && setHoverValue(star)}
          onMouseLeave={() => isInteractive && setHoverValue(null)}
          disabled={!isInteractive}
          className={isInteractive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          aria-label={`${star} stars`}
        >
          <StarIcon filled={star <= displayValue} className={sizeStyles[size]} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
