'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const AuthInit = dynamic(() => import('./AuthInit'), { ssr: false });

export default function RouteAwareAuthInit() {
  const pathname = usePathname() ?? '';
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsMobileDevice(
      window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(hover: none)').matches,
    );
  }, []);

  const isMobileHome = pathname === '/home' && isMobileDevice;

  if (pathname.startsWith('/auth/') || isMobileHome) {
    return null;
  }

  return <AuthInit />;
}
