import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'blue' | 'gray';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'red',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    red: 'border-red-500',
    blue: 'border-blue-500',
    gray: 'border-gray-500',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      ></div>
      {text && (
        <p className={`mt-4 text-sm ${color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );
}
