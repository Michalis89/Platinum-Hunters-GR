'use client';

import { usePathname } from 'next/navigation';
import { PageContainer } from './PageContainer';

type MainRouteContainerProps = {
  children: React.ReactNode;
};

export default function MainRouteContainer({ children }: MainRouteContainerProps) {
  const pathname = usePathname() ?? '';
  const size = pathname.startsWith('/admin/support') ? 'full' : 'lg';

  return (
    <PageContainer size={size} noPadding>
      {children}
    </PageContainer>
  );
}
