// components/auth/ErrorAlert.tsx

import React from "react";

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {message}
    </div>
  );
}