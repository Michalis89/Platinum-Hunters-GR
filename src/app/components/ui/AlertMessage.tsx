'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  readonly type: AlertType;
  readonly message: React.ReactNode;
  readonly title?: string;
  readonly duration?: number;
  readonly onClose?: () => void;
  readonly showProgress?: boolean;
}

const alertConfig: Record<
  AlertType,
  {
    icon: typeof CheckCircle;
    gradient: string;
    border: string;
    iconBg: string;
    progressColor: string;
  }
> = {
  success: {
    icon: CheckCircle,
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    progressColor: 'bg-emerald-400',
  },
  error: {
    icon: XCircle,
    gradient: 'from-[var(--hb-primary-strong)]/20 via-[var(--hb-primary-strong)]/10 to-transparent',
    border: 'border-[var(--hb-primary-strong)]/30',
    iconBg: 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-accent)]',
    progressColor: 'bg-[var(--hb-primary-strong)]',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400',
    progressColor: 'bg-amber-400',
  },
  info: {
    icon: Info,
    gradient: 'from-sky-500/20 via-sky-500/10 to-transparent',
    border: 'border-sky-500/30',
    iconBg: 'bg-sky-500/20 text-sky-400',
    progressColor: 'bg-sky-400',
  },
};

export default function AlertMessage({
  type,
  message,
  title,
  duration = 4000,
  onClose,
  showProgress = true,
}: Readonly<AlertProps>) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const config = alertConfig[type];
  const Icon = config.icon;

  const handleClose = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const progressInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const percent = (remaining / duration) * 100;
      setProgress(percent);

      if (percent <= 0) {
        clearInterval(progressInterval);
        handleClose();
      }
    }, 16);

    return () => clearInterval(progressInterval);
  }, [duration, handleClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          className="fixed inset-x-0 top-6 z-50 mx-auto flex w-auto max-w-md px-4"
        >
          <div
            className={`bg-[var(--hb-panel)]/95 relative w-full overflow-hidden rounded-2xl border shadow-[var(--hb-shadow-md)] backdrop-blur-xl ${config.border} `}
          >
            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${config.gradient} pointer-events-none`}
            />

            {/* Content */}
            <div className="relative flex items-start gap-4 p-4">
              {/* Icon container */}
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 pt-0.5">
                {title && (
                  <p className="mb-0.5 text-sm font-semibold text-[var(--hb-headline)]">{title}</p>
                )}
                <div className="text-[var(--hb-text)]/90 text-sm leading-relaxed">{message}</div>
              </div>

              {/* Close button */}
              <Button
                variant={'outline'}
                onClick={handleClose}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center"
                aria-label="Κλείσιμο"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar */}
            {showProgress && duration > 0 && (
              <div className="h-1 w-full bg-[var(--hb-border)]">
                <motion.div
                  className={`h-full ${config.progressColor}`}
                  initial={{ width: '100%' }}
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.016, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { AlertType, AlertProps };
