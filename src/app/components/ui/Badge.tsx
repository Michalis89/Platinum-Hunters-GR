import React from 'react';

interface BadgeProps {
  readonly text: string;
  readonly color: string;
}

export default function Badge({ text, color }: BadgeProps) {
  return (
    <span
      className="rounded-lg px-3 py-1 font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );
}
