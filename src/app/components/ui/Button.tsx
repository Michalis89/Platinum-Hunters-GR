import { ReactNode } from 'react';

interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function Button({ children, onClick, disabled, className = '' }: Readonly<ButtonProps>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
