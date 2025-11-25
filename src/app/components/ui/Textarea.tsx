import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, ...props }: Readonly<TextareaProps>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-white">{label}</label>}
      <textarea
        {...props}
        className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 text-white"
      />
    </div>
  );
}
