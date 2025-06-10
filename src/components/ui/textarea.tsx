// src/components/ui/textarea.tsx
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ 
  className = '', 
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={`min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-800 text-white px-3 py-2 ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;