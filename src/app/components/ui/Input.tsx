import { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: Readonly<InputProps>) {
  const baseClasses =
    'w-full rounded-lg border p-2 text-white bg-gray-900 transition focus:outline-none focus:ring-2 focus:ring-blue-500';
  const errorClasses = error ? 'border-red-500' : 'border-gray-700';

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-white">{label}</label>}
      <input {...props} className={cn(baseClasses, errorClasses, className)} />
    </div>
  );
}
