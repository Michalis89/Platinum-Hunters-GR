interface BadgeProps {
  readonly text: string;
  readonly color: string;
}

export default function Badge({ text, color }: BadgeProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-600 text-white',
    yellow: 'bg-yellow-600  text-white',
    red: 'bg-red-600 text-white',
    blue: 'bg-blue-600 text-white',
    gray: 'bg-gray-600 text-white',
  };

  const classes = colorClasses[color] || 'bg-gray-600 text-white';

  return <span className={`rounded-lg px-3 py-1 font-semibold ${classes}`}>{text}</span>;
}
