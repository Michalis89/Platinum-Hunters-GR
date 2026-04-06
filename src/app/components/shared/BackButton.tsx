'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  fallbackHref = '/home',
  label = 'Back',
  className,
}: BackButtonProps) {
  const router = useRouter();
  const [isStandalone] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS legacy standalone flag
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
  );

  if (!isStandalone) {
    return null;
  }

  const canGoBack = window.history.length > 1;

  return (
    <Button
      type="button"
      variant="secondary"
      icon={<ArrowLeft size={16} />}
      className={className}
      onClick={() => {
        if (canGoBack) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
    >
      {label}
    </Button>
  );
}
