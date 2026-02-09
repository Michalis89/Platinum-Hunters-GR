import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AuthFormContainerProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  cardClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  iconWrapperClassName?: string;
};

export function AuthFormContainer({
  icon,
  title,
  subtitle,
  children,
  cardClassName,
  headerClassName,
  contentClassName,
  titleClassName,
  iconWrapperClassName,
}: AuthFormContainerProps) {
  return (
    <Card
      className={cn(
        'apple-auth-card apple-auth-enter apple-auth-form-frame overflow-hidden border-[var(--apple-separator)] bg-[color-mix(in_srgb,var(--apple-surface)_92%,transparent)]',
        cardClassName,
      )}
    >
      <CardHeader
        className={cn(
          'border-b border-[var(--apple-separator-soft)] bg-transparent px-6 pb-5 pt-6',
          headerClassName,
        )}
      >
        <CardTitle
          className={cn(
            'apple-title-tracking flex items-center gap-3 text-[1.375rem] text-[var(--apple-label)]',
            titleClassName,
          )}
        >
          <span
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_15%,transparent)] text-[var(--apple-system-blue)]',
              iconWrapperClassName,
            )}
          >
            {icon}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-semibold">{title}</span>
            <span className="apple-body-tracking mt-1 text-[0.93rem] font-normal text-[var(--apple-secondary-label)]">
              {subtitle}
            </span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className={cn('space-y-5 px-6 pb-6 pt-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
