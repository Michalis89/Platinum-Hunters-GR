'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Sparkles, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Variant = 'success' | 'info' | 'warning' | 'error' | 'neutral';
type Tone = 'soft' | 'solid';
type Layout = 'inline' | 'toast';

interface FeedbackProps {
  readonly variant?: Variant;
  readonly tone?: Tone;
  readonly layout?: Layout;
  readonly title?: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly secondaryActionLabel?: string;
  readonly onSecondaryAction?: () => void;
  readonly onDismiss?: () => void;
  readonly dismissible?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const palette: Record<
  Variant,
  {
    softBg: string;
    solidBg: string;
    ring: string;
    text: string;
    textSolid: string;
    icon: string;
    accent: string;
  }
> = {
  success: {
    softBg: 'bg-emerald-50',
    solidBg: 'bg-emerald-600',
    ring: 'ring-emerald-200',
    text: 'text-emerald-900',
    textSolid: 'text-emerald-50',
    icon: 'text-emerald-500',
    accent: 'from-emerald-400/80 via-emerald-500/60 to-emerald-400/40',
  },
  info: {
    softBg: 'bg-sky-50',
    solidBg: 'bg-sky-600',
    ring: 'ring-sky-200',
    text: 'text-sky-900',
    textSolid: 'text-sky-50',
    icon: 'text-sky-500',
    accent: 'from-sky-400/80 via-sky-500/60 to-sky-400/40',
  },
  warning: {
    softBg: 'bg-amber-50',
    solidBg: 'bg-amber-600',
    ring: 'ring-amber-200',
    text: 'text-amber-900',
    textSolid: 'text-amber-50',
    icon: 'text-amber-500',
    accent: 'from-amber-400/80 via-amber-500/60 to-amber-400/40',
  },
  error: {
    softBg: 'bg-rose-50',
    solidBg: 'bg-rose-600',
    ring: 'ring-rose-200',
    text: 'text-rose-900',
    textSolid: 'text-rose-50',
    icon: 'text-rose-500',
    accent: 'from-rose-400/80 via-rose-500/60 to-rose-400/40',
  },
  neutral: {
    softBg: 'bg-slate-50',
    solidBg: 'bg-slate-800',
    ring: 'ring-slate-200',
    text: 'text-slate-900',
    textSolid: 'text-slate-50',
    icon: 'text-slate-500',
    accent: 'from-slate-400/70 via-slate-500/50 to-slate-400/40',
  },
};

const defaultIcons: Record<Variant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />,
  info: <Info className="h-5 w-5" strokeWidth={2.2} />,
  warning: <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />,
  error: <XCircle className="h-5 w-5" strokeWidth={2.2} />,
  neutral: <Sparkles className="h-5 w-5" strokeWidth={2.2} />,
};

export default function Feedback({
  variant = 'info',
  tone = 'soft',
  layout = 'inline',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onDismiss,
  dismissible = true,
  className,
  children,
}: Readonly<FeedbackProps>) {
  const colors = palette[variant];
  const isSolid = tone === 'solid';
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  const ariaLive = variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';

  return (
    <AnimatePresence>
      <motion.section
        role={role}
        aria-live={ariaLive}
        initial={{ opacity: 0, y: layout === 'toast' ? -10 : -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: layout === 'toast' ? -12 : -8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        className={cn(
          'relative overflow-hidden rounded-xl border shadow-xl ring-1 backdrop-blur-sm',
          isSolid ? `${colors.solidBg} ${colors.textSolid} border-transparent ring-white/10` : `${colors.softBg} ${colors.text} ${colors.ring}`,
          layout === 'toast'
            ? 'fixed right-5 top-5 z-50 w-[min(420px,92vw)] shadow-2xl'
            : 'w-full',
          className
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute -left-12 top-0 h-full w-40 bg-gradient-to-br opacity-60 blur-3xl',
            colors.accent
          )}
          aria-hidden
        />

        <div className="flex items-start gap-3 px-4 py-3 pr-12">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg bg-white/50',
              isSolid ? 'bg-white/10' : 'bg-white/80',
              colors.icon
            )}
          >
            <span className={cn(isSolid ? colors.textSolid : colors.icon, 'shrink-0')}>
              {icon ?? defaultIcons[variant]}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {title && (
              <p className={cn('text-base font-semibold tracking-tight', isSolid ? colors.textSolid : colors.text)}>
                {title}
              </p>
            )}
            {(description || children) && (
              <div className={cn('text-sm leading-relaxed', isSolid ? 'text-white/90' : 'text-slate-700')}>
                {description ?? children}
              </div>
            )}

            {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {actionLabel && onAction && (
                  <Button
                    type="button"
                    onClick={onAction}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                      isSolid
                        ? 'bg-white/15 text-white hover:bg-white/25 focus-visible:ring-white/60'
                        : 'bg-black/5 text-slate-900 hover:bg-black/10 focus-visible:ring-slate-300',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white/30'
                    )}
                  >
                    {actionLabel}
                  </Button>
                )}
                {secondaryActionLabel && onSecondaryAction && (
                  <Button
                    type="button"
                    onClick={onSecondaryAction}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                      isSolid
                        ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/60'
                        : 'bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-300',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white/30 border border-black/5'
                    )}
                  >
                    {secondaryActionLabel}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {dismissible && onDismiss && (
          <Button
            type="button"
            onClick={onDismiss}
            className={cn(
              'absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full transition',
              isSolid
                ? 'text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-white/70'
                : 'text-slate-500 hover:bg-black/5 hover:text-slate-700 focus-visible:ring-slate-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white/30'
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}
      </motion.section>
    </AnimatePresence>
  );
}
