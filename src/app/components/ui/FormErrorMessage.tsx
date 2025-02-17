import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const FormErrorMessage: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center space-x-2 bg-red-600/10 border border-red-500 text-red-400 rounded-lg p-2 mt-1"
    >
      <AlertCircle className="w-4 h-4 text-red-400" />
      <span className="text-sm">{message}</span>
    </motion.div>
  );
};

export default FormErrorMessage;
