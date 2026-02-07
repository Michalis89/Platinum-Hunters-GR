import Link from 'next/link';
import { ChevronDown, Layers, type LucideIcon } from 'lucide-react';
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { isHrefActive, type HobbyItem } from './navbar.data';
import { desktopLinkClass, NavItemContent } from './navbar.helpers';

type LibraryMenuProps = {
  hobbyItems: HobbyItem[];
  pathname: string;
};

type LibraryOnlyItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function LibraryMenu({ hobbyItems, pathname }: LibraryMenuProps) {
  const isLibraryActive = pathname.startsWith('/pages/backlog') || pathname === '/pages/hobbies';

  const libraryItems: LibraryOnlyItem[] = hobbyItems
    .map(item => {
      const childLibrary = item.children?.find(child => child.href.includes('/pages/backlog'));
      if (childLibrary) {
        return { href: childLibrary.href, label: item.label, icon: item.icon };
      }

      if (item.href.includes('/pages/backlog')) {
        return { href: item.href, label: item.label, icon: item.icon };
      }

      return null;
    })
    .filter((item): item is LibraryOnlyItem => item !== null);

  return (
    <MenubarMenu>
      <MenubarTrigger className={desktopLinkClass(isLibraryActive)} aria-label="Άνοιγμα μενού βιβλιοθήκης">
        <Layers className="size-4" />
        <span>Βιβλιοθήκη</span>
        <ChevronDown className="size-4" />
      </MenubarTrigger>
      <MenubarContent className="w-64 rounded-2xl border-[var(--hb-border)] bg-[var(--hb-panel)] p-1.5 text-[var(--hb-text)]">
        <MenubarItem asChild className="rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-primary-strong)]">
          <Link href="/pages/hobbies">
            <Layers className="size-4" />
            <span>Όλες οι κατηγορίες</span>
          </Link>
        </MenubarItem>
        <MenubarSeparator className="bg-[var(--hb-border)]" />
        {libraryItems.map(item => {
          const active = isHrefActive(pathname, item.href);

          return (
            <MenubarItem
              key={item.href}
              asChild
              className="rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-primary-strong)]"
            >
              <Link href={item.href} className={active ? 'text-[var(--hb-primary-strong)]' : undefined}>
                <NavItemContent icon={item.icon} label={item.label} />
              </Link>
            </MenubarItem>
          );
        })}
      </MenubarContent>
    </MenubarMenu>
  );
}
