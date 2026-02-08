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
  icon = <Search size={18} className="text-[var(--apple-secondary-label)]" aria-hidden="true" />,
  className = '',
  ...props
}: Readonly<SearchBarProps>) {
  return (
    <div className={`relative w-full max-w-lg ${className}`} role="search">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
        {icon}
      </div>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[12px] border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-3 pl-10 text-[15px] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)] transition focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[var(--hb-ring)] [&::-webkit-search-cancel-button]:cursor-pointer"
        aria-label={placeholder}
        {...props}
      />
    </div>
  );
}
