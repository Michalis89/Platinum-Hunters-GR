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
  const isLibraryActive = pathname.startsWith('/pages/backlog');

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
      <MenubarTrigger
        className={`${desktopLinkClass(isLibraryActive)} gap-2`}
        aria-label="Open library menu"
      >
        <Layers className="size-4" />
        <span>Library</span>
        <ChevronDown className="ml-0.5 size-4" />
      </MenubarTrigger>
      <MenubarContent className="w-64 p-1.5 text-foreground">
        <MenubarItem
          asChild
          className="px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color] duration-200 [transition-timing-function:var(--easing-default)] focus:bg-[hsl(var(--accent))/10] focus:text-foreground"
        ></MenubarItem>
        <MenubarSeparator className="h-[0.5px] bg-[var(--border)]" />
        {libraryItems.map(item => {
          const active = isHrefActive(pathname, item.href);

          return (
            <MenubarItem
              key={item.href}
              asChild
              className="px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color] duration-200 [transition-timing-function:var(--easing-default)] focus:bg-[hsl(var(--accent))/10] focus:text-foreground"
            >
              <Link
                href={item.href}
                className={active ? 'text-foreground' : 'text-muted-foreground'}
              >
                <NavItemContent icon={item.icon} label={item.label} />
              </Link>
            </MenubarItem>
          );
        })}
      </MenubarContent>
    </MenubarMenu>
  );
}
