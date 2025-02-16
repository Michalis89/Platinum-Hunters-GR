import React from "react";

interface BadgeProps {
  readonly text: string;
  readonly color: string;
}

export default function Badge({ text, color }: BadgeProps) {
  return (
    <span
      className="px-3 py-1 rounded-lg font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );
}
