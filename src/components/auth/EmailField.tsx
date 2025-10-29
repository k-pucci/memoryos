// components/auth/EmailField.tsx

import React from "react";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function EmailField({ 
  value, 
  onChange, 
  placeholder = "Enter your email",
  required = true 
}: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Email</label>
      <div className="relative">
        <Mail 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
        />
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-background border-border text-foreground"
          required={required}
        />
      </div>
    </div>
  );
}