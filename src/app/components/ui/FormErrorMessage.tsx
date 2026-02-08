import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const FormErrorMessage: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-2 flex items-center gap-2 rounded-[var(--apple-radius-control)] border border-[#ff3b30]/35 bg-[#ff3b30]/10 px-3 py-2 text-sm text-[#ff3b30]"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
};

export default FormErrorMessage;
