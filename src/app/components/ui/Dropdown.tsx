import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Option = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

interface DropdownProps {
  label?: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  zIndex: number;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  isOpen,
  zIndex,
  className,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDropdownOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor="dropdown" className="mb-4 block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setDropdownOpen(prev => !prev);
        }}
        data-testid="dropdown"
        className={`flex w-full items-center justify-between rounded-xl border ${
          dropdownOpen ? 'border-sky-400/70 shadow-sky-400/30' : 'border-slate-800/70 shadow-slate-950/40'
        } bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 shadow-inner transition-all duration-200 hover:border-sky-300/70 hover:bg-slate-900/80`}
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
        aria-label={label || 'Επιλογή φίλτρου'}
      >
        <span className="flex items-center gap-2 text-left leading-tight">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span aria-hidden="true">{selectedOption.icon}</span>}
              <span className="whitespace-normal">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400">Επιλέξτε</span>
          )}
        </span>
        <motion.svg
          className={`h-4 w-4 text-slate-400 transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {dropdownOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-1 w-full overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/95 shadow-xl shadow-slate-950/60 backdrop-blur"
            style={{
              zIndex: zIndex ?? 50,
              maxHeight: '320px',
            }}
            data-testid="dropdown-options"
            role="listbox"
            aria-label={label || 'Επιλογές φίλτρου'}
          >
            {options.map(option => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === selectedValue}
            className={`flex w-full cursor-pointer items-center px-3 py-2 text-sm text-slate-100 transition ${
              option.value === selectedValue
                ? 'bg-slate-800/80 text-sky-200'
                : 'hover:bg-slate-800/70'
            }`}
                onClick={() => {
                  onSelect(option.value);
                  setDropdownOpen(false);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(option.value);
                    setDropdownOpen(false);
                  }
                }}
                tabIndex={0}
              >
                {option.icon && <span aria-hidden="true">{option.icon}</span>}
                <span className="ml-2 truncate">{option.label}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
