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
        'overflow-hidden border border-border bg-card text-card-foreground shadow-sm',
        cardClassName,
      )}
    >
      <CardHeader
        className={cn('border-b border-border bg-transparent px-6 pb-5 pt-6', headerClassName)}
      >
        <CardTitle
          className={cn(
            'flex items-center gap-3 text-[1.375rem] leading-tight text-foreground',
            titleClassName,
          )}
        >
          <span
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary',
              iconWrapperClassName,
            )}
          >
            {icon}
          </span>

          <span className="flex flex-col leading-tight">
            <span className="font-semibold">{title}</span>
            <span className="mt-1 text-[0.93rem] font-normal text-foreground/75">{subtitle}</span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className={cn('space-y-5 px-6 pb-6 pt-5', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
