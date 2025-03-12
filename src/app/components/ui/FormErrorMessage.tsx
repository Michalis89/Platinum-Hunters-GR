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
      className="mt-1 flex items-center space-x-2 rounded-lg border border-red-500 bg-red-600/10 p-2 text-red-400"
    >
      <AlertCircle className="h-4 w-4 text-red-400" />
      <span className="text-sm">{message}</span>
    </motion.div>
  );
};

export default FormErrorMessage;
