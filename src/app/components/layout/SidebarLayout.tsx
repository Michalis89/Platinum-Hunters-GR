import { ReactNode } from 'react';

interface SidebarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function SidebarLayout({ sidebar, children }: Readonly<SidebarLayoutProps>) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="w-full md:w-1/4">{sidebar}</aside>
      <main className="w-full md:w-3/4">{children}</main>
    </div>
  );
}
