'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Portal from './Portal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  destructive: {
    iconBg: 'bg-[var(--hb-primary-strong)]/20',
    iconColor: 'text-[var(--hb-accent)]',
    confirmVariant: 'destructive' as const,
  },
  warning: {
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    confirmVariant: 'warning' as const,
  },
  default: {
    iconBg: 'bg-[var(--hb-primary-strong)]/20',
    iconColor: 'text-[var(--hb-primary-strong)]',
    confirmVariant: 'primary' as const,
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Επιβεβαίωση',
  cancelLabel = 'Άκυρο',
  variant = 'destructive',
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={e => {
              if (e.target === e.currentTarget) onCancel();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]"
            >
              {/* Close button */}
              <div className="flex justify-end p-4 pb-0">
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  aria-label="Close"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconBg}`}
                  >
                    <AlertTriangle className={`h-7 w-7 ${config.iconColor}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="mt-5 text-center">
                  <h3 className="text-lg font-semibold text-[var(--hb-headline)]">{title}</h3>
                  <p className="mt-2 text-sm text-[var(--hb-muted)]">{message}</p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant={config.confirmVariant}
                    className="flex-1 rounded-xl"
                    onClick={onConfirm}
                  >
                    {confirmLabel}
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
                    {cancelLabel}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  );
}
