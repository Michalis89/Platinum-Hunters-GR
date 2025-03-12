import { InputHTMLAttributes } from 'react';

export function Input(props: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 text-white"
    />
  );
}
