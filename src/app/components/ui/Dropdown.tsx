import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === selectedValue);

  return (
    <div className="relative">
      <label htmlFor="dropdown" className="block text-gray-300 text-sm font-medium">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white flex items-center justify-center space-x-2"
      >
        {selectedOption ? (
          <>
            {selectedOption.icon}
            <span>{selectedOption.label}</span>
          </>
        ) : (
          "Επιλέξτε"
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
            className="absolute left-0 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
            style={{ zIndex: zIndex }} // Apply z-index dynamically
          >
            {options.map((option) => (
              <button
                key={option.value}
                className="p-3 hover:bg-gray-700 cursor-pointer flex items-center w-full text-left"
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
