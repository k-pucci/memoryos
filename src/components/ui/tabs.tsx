// src/components/ui/tabs.tsx
import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs = ({
  children,
  defaultValue,
  value,
  onValueChange,
  className = '',
}: {
  children: React.ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) => {
  const [tabValue, setTabValue] = useState(value || defaultValue);
  
  const handleValueChange = (newValue: string) => {
    if (!value) {
      setTabValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ value: value || tabValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={`flex space-x-1 p-1 rounded-md bg-slate-800 ${className}`}>{children}</div>;
};

export const TabsTrigger = ({
  children,
  value,
  className = '',
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs');
  }
  
  const isActive = context.value === value;
  
  return (
    <button
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive 
          ? 'bg-slate-700 text-white' 
          : 'text-gray-400 hover:text-white'
      } ${className}`}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  children,
  value,
  className = '',
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs');
  }
  
  if (context.value !== value) {
    return null;
  }
  
  return <div className={className}>{children}</div>;
};