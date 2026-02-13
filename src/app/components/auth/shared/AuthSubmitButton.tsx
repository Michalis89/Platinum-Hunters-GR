import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

type AuthSubmitButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className'
> &
  VariantProps<typeof buttonVariants> & {
    loading: boolean;
    idleContent: ReactNode;
    loadingContent: ReactNode;
    className?: string;
  };

export function AuthSubmitButton({
  loading,
  idleContent,
  loadingContent,
  disabled,
  ...buttonProps
}: AuthSubmitButtonProps) {
  return (
    <Button {...buttonProps} disabled={Boolean(disabled) || loading}>
      {loading ? loadingContent : idleContent}
    </Button>
  );
}
