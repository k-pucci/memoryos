// src/components/ui/button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'default', 
  size = 'default',
  children,
  className = '',
  ...props 
}, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-slate-700 text-white hover:bg-slate-700';
      case 'ghost':
        return 'text-gray-400 hover:bg-slate-800 hover:text-white';
      default:
        return 'bg-purple-500 text-white hover:bg-purple-600';
    }
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'icon':
        return 'p-2 aspect-square';
      default:
        return 'px-4 py-2';
    }
  };
  
  return (
    <button
      ref={ref}
      className={`rounded-md transition-colors ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;