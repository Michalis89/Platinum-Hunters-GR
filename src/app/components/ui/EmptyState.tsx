import { ReactNode } from 'react';
import { cn } from '@/utils/utils';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const isCompact = size === 'sm';

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] text-center',
        isCompact ? 'px-4 py-6' : 'px-6 py-20',
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            'mx-auto flex items-center justify-center',
            isCompact ? 'mb-3 h-12 w-12' : 'mb-4 h-16 w-16',
          )}
        >
          {icon}
        </div>
      ) : null}
      <h2
        className={cn(
          'font-semibold text-[var(--hb-headline)]',
          isCompact ? 'mb-1 text-base' : 'mb-2 text-xl',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn('text-[var(--hb-muted)]', isCompact ? 'text-sm' : '')}>
          {description}
        </p>
      ) : null}
      {action ? <div className={cn(isCompact ? 'mt-4' : 'mt-6', 'flex justify-center')}>{action}</div> : null}
    </div>
  );
}
