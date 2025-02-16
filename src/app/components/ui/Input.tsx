import { InputHTMLAttributes } from "react";

export function Input(props: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input
      {...props}
      className="w-full p-2 border border-gray-700 bg-gray-900 text-white rounded-lg"
    />
  );
}
