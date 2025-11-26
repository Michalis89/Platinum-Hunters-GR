import { Search } from 'lucide-react';
import { InputHTMLAttributes } from 'react';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Αναζήτηση...',
  icon = <Search size={20} className="text-gray-400" aria-hidden="true" />,
  className = '',
  ...props
}: Readonly<SearchBarProps>) {
  return (
    <div className={`relative w-full max-w-lg ${className}`} role="search">
      <div className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
        {icon}
      </div>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 pl-10 text-lg text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={placeholder}
        {...props}
      />
    </div>
  );
}
