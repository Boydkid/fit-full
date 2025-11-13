import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  shadow?: boolean;
}

export default function Card({
  children,
  className = '',
  hover = false,
  shadow = true,
}: CardProps) {
  const baseClasses = 'bg-white rounded-2xl';
  const hoverClasses = hover ? 'hover:scale-105 transition-transform duration-300' : '';
  const shadowClasses = shadow ? 'shadow-lg' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${shadowClasses} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
