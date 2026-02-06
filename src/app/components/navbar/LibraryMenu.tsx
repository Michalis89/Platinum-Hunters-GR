import Link from 'next/link';
import { ChevronDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isHrefActive, type HobbyItem } from './navbar.data';
import { desktopLinkClass, NavItemContent } from './navbar.helpers';

type LibraryMenuProps = {
  hobbyItems: HobbyItem[];
  pathname: string;
};

export function LibraryMenu({ hobbyItems, pathname }: LibraryMenuProps) {
  const isLibraryActive = pathname.startsWith('/pages/backlog') || pathname === '/pages/hobbies';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={desktopLinkClass(isLibraryActive)}
          aria-label="Άνοιγμα μενού βιβλιοθήκης"
        >
          <Layers className="size-4" />
          <span>Βιβλιοθήκη</span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className="w-64 rounded-2xl border-[var(--hb-border)] bg-[var(--hb-panel)] p-1.5 text-[var(--hb-text)]"
      >
        <DropdownMenuItem
          asChild
          className="rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-primary-strong)]"
        >
          <Link href="/pages/hobbies">
            <Layers className="size-4" />
            <span>Όλες οι κατηγορίες</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[var(--hb-border)]" />
        {hobbyItems.map(item => {
          const active = isHrefActive(pathname, item.href);
          if (!item.children?.length) {
            return (
              <DropdownMenuItem
                key={item.href}
                asChild
                className="rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-primary-strong)]"
              >
                <Link href={item.href} className={active ? 'text-[var(--hb-primary-strong)]' : undefined}>
                  <NavItemContent icon={item.icon} label={item.label} />
                </Link>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuSub key={item.href}>
              <DropdownMenuSubTrigger
                className="rounded-lg px-2.5 py-2 focus:bg-white/5 data-[state=open]:bg-white/5 data-[state=open]:text-[var(--hb-primary-strong)]"
              >
                <NavItemContent
                  icon={item.icon}
                  label={item.label}
                  className={active ? 'text-[var(--hb-primary-strong)]' : undefined}
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56 rounded-2xl border-[var(--hb-border)] bg-[var(--hb-panel)] p-1.5 text-[var(--hb-text)]">
                  {item.children.map(child => (
                    <DropdownMenuItem
                      key={child.href}
                      asChild
                      className="rounded-lg px-2.5 py-2 focus:bg-white/5 focus:text-[var(--hb-primary-strong)]"
                    >
                      <Link href={child.href}>
                        <NavItemContent icon={child.icon} label={child.label} />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

