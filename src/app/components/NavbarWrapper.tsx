'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const Navbar = dynamic(() => import('./Navbar'), { ssr: false });

export default function NavbarWrapper() {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/admin/support')) {
    return null;
  }

  return (
    <div className="pt-16">
      <Navbar />
    </div>
  );
}
