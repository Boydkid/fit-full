import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  href?: string;
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  href,
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-red-600 to-red-400 text-white hover:from-red-700 hover:to-red-500 focus:ring-red-400 shadow-lg',
    secondary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400',
    outline: 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white focus:ring-red-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const disabledClasses = disabled || loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {loading ? 'Loading...' : children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
