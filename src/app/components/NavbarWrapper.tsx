'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

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
