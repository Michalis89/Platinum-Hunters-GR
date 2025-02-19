import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Option = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

interface DropdownProps {
  label: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  zIndex: number; // Add z-index prop
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  isOpen,
  zIndex,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div className="relative">
      <label htmlFor="dropdown" className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
      >
        {selectedOption ? (
          <>
            {selectedOption.icon}
            <span>{selectedOption.label}</span>
          </>
        ) : (
          'Επιλέξτε'
        )}
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-lg"
            style={{ zIndex: zIndex }} // Apply z-index dynamically
          >
            {options.map(option => (
              <button
                key={option.value}
                className="flex w-full cursor-pointer items-center p-3 text-left hover:bg-gray-700"
                onClick={() => {
                  onSelect(option.value); // Pass the value to onSelect
                  setDropdownOpen(false); // Close dropdown after selection
                }}
                type="button"
              >
                {option.icon} <span className="ml-2">{option.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
