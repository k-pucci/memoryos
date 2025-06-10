// src/components/ui/separator.tsx
import React from 'react';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(({ 
  className = '', 
  orientation = 'horizontal' 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={`${
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'
      } bg-slate-700 ${className}`}
    />
  );
});

Separator.displayName = 'Separator';

export default Separator;