'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      {!isHome && (
        <div className="pt-16">
          <Navbar />
        </div>
      )}
    </>
  );
}
