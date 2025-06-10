// src/components/ui/dialog.tsx
import React, { createContext, useContext, useState } from 'react';

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const Dialog = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(open || false);
  
  const setOpen = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  
  return (
    <DialogContext.Provider value={{ open: open ?? isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = ({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  const context = useContext(DialogContext);
  
  if (!context) {
    throw new Error('DialogTrigger must be used within a Dialog');
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        context.setOpen(true);
      }
    });
  }
  
  return (
    <button onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
};

export const DialogContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const context = useContext(DialogContext);
  
  if (!context) {
    throw new Error('DialogContent must be used within a Dialog');
  }
  
  if (!context.open) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className={`bg-slate-900 rounded-lg p-6 shadow-xl max-w-md mx-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="mb-4">{children}</div>;
};

export const DialogTitle = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <h2 className="text-xl font-bold">{children}</h2>;
};

export const DialogDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <p className="text-gray-400 text-sm">{children}</p>;
};

export const DialogFooter = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={`mt-4 flex justify-end space-x-2 ${className}`}>{children}</div>;
};

export const DialogClose = ({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  const context = useContext(DialogContext);
  
  if (!context) {
    throw new Error('DialogClose must be used within a Dialog');
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        context.setOpen(false);
      }
    });
  }
  
  return (
    <button onClick={() => context.setOpen(false)}>
      {children}
    </button>
  );
};