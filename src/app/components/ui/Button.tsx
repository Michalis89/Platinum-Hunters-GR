import { ReactNode } from "react";

interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function Button({ children, onClick, disabled, className = "" }: Readonly<ButtonProps>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
