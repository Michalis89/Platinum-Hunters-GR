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
  icon = <Search size={20} className="text-[var(--hb-muted)]" aria-hidden="true" />,
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
        className="w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3 pl-10 text-lg text-[var(--hb-text)] placeholder:text-[var(--hb-muted)] placeholder:opacity-80 transition focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[var(--hb-primary)] [&::-webkit-search-cancel-button]:cursor-pointer"
        aria-label={placeholder}
        {...props}
      />
    </div>
  );
}
