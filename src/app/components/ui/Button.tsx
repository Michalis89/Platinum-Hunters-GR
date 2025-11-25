import { ReactNode } from 'react';

// Define possible button variants
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning';

interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly variant?: ButtonVariant;
  readonly type?: 'button' | 'submit' | 'reset';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  tertiary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  warning: 'bg-yellow-500 text-black hover:bg-yellow-600',
};

export function Button({
  children,
  onClick,
  disabled,
  className = '',
  variant = 'primary',
  type = 'button',
}: Readonly<ButtonProps>) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-4 py-2 font-bold transition ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
