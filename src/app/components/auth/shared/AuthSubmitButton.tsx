import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type AuthSubmitButtonProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  loading: boolean;
  idleContent: ReactNode;
  loadingContent: ReactNode;
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
