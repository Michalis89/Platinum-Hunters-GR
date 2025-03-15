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

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div className={`relative ${className}`}>
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
        className={`flex w-full items-center justify-between space-x-2 rounded-lg border ${
          dropdownOpen ? 'border-blue-400' : 'border-gray-700'
        } bg-gray-800 p-3 text-white transition-all duration-300 hover:bg-gray-700`}
      >
        {selectedOption ? (
          <>
            {selectedOption.icon}
            <span>{selectedOption.label}</span>
          </>
        ) : (
          'Επιλέξτε'
        )}
        <motion.svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-1 w-full overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-lg"
            style={{
              zIndex: zIndex,
              maxHeight: '300px',
            }}
            data-testid="dropdown-options"
          >
            {options.map(option => (
              <button
                key={option.value}
                className={`flex w-full cursor-pointer items-center p-3 text-left ${
                  option.value === selectedValue ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
                onClick={() => {
                  onSelect(option.value);
                  setDropdownOpen(false);
                }}
                type="button"
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
