import Link from 'next/link';
import { LogIn, LogOut, Menu, PenLine, Plus, ShieldCheck, Ticket, User, UserPlus } from 'lucide-react';
import type { User as UserEntity } from '@/types/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggleButton } from './ThemeToggleButton';
import { isHrefActive, type HobbyItem, type NavbarLinkItem } from './navbar.data';
import { getUserInitials, mobileChipClass, NavItemContent } from './navbar.helpers';

type Theme = 'dark' | 'light';

type MobileNavSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  hobbyItems: HobbyItem[];
  navItems: NavbarLinkItem[];
  authResolved: boolean;
  isAuthenticated: boolean;
  user: UserEntity | null;
  canQuickAdd: boolean;
  canAccessAdminPanel: boolean;
  onAdd: () => void;
  onLogout: () => Promise<void>;
  theme: Theme;
  onToggleTheme: () => void;
};

export function MobileNavSheet({
  open,
  onOpenChange,
  pathname,
  hobbyItems,
  navItems,
  authResolved,
  isAuthenticated,
  user,
  canQuickAdd,
  canAccessAdminPanel,
  onAdd,
  onLogout,
  theme,
  onToggleTheme,
}: MobileNavSheetProps) {
  const closeSheet = () => onOpenChange(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="h-9 w-9 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)]"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[92vw] max-w-sm border-[var(--hb-border)] bg-[var(--hb-surface)] p-0 text-[var(--hb-text)]"
        >
          <SheetHeader className="border-b border-[var(--hb-border)] px-5 py-4">
            <SheetTitle className="text-left text-sm font-semibold tracking-tight text-[var(--hb-headline)]">
              Hobbistas Menu
            </SheetTitle>
          </SheetHeader>

          <div className="h-[calc(100vh-72px)] overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
            <div className="space-y-4 pr-1">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                  Βιβλιοθήκη
                </h3>
                <div className="-mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] touch-pan-x">
                  <div className="flex w-max min-w-max gap-2">
                    {hobbyItems.map(item => (
                      <Button
                        key={item.href}
                        asChild
                        variant="secondary"
                        className={mobileChipClass(isHrefActive(pathname, item.href))}
                      >
                        <Link href={item.href} onClick={closeSheet}>
                          <NavItemContent icon={item.icon} label={item.label} />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </section>

              <Separator className="bg-[var(--hb-border)]" />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                  Γρήγοροι σύνδεσμοι
                </h3>
                <div className="grid gap-2">
                  {navItems.map(item => (
                    <Button
                      key={item.href}
                      asChild
                      variant="secondary"
                      className={mobileChipClass(isHrefActive(pathname, item.href), true)}
                    >
                      <Link href={item.href} onClick={closeSheet}>
                        <NavItemContent icon={item.icon} label={item.label} />
                      </Link>
                    </Button>
                  ))}
                </div>
              </section>

              <Separator className="bg-[var(--hb-border)]" />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-muted)]">Θέμα</h3>
                <ThemeToggleButton
                  theme={theme}
                  onToggle={onToggleTheme}
                  iconOnly={false}
                  className="w-full justify-start border border-[var(--hb-border)] bg-[var(--hb-card)] px-3"
                />
              </section>

              <Separator className="bg-[var(--hb-border)]" />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-muted)]">Λογαριασμός</h3>
                {!authResolved ? (
                  <NavbarAuthSkeletonMobile />
                ) : isAuthenticated && user ? (
                  <div className="grid gap-2">
                    <div className="flex h-11 items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3">
                      <Avatar className="h-7 w-7 border border-[var(--hb-border)]">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
                        <AvatarFallback className="bg-white/5 text-xs font-semibold text-[var(--hb-headline)]">
                          {getUserInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">{user.username}</span>
                    </div>
                    {canQuickAdd ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 justify-start rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3"
                        onClick={() => {
                          closeSheet();
                          onAdd();
                        }}
                      >
                        <Plus className="size-4" />
                        <span>Προσθήκη</span>
                      </Button>
                    ) : null}
                    <Button asChild variant="secondary" className={mobileChipClass(false, true)}>
                      <Link href="/pages/profile" onClick={closeSheet}>
                        <User className="size-4" />
                        <span>Προφίλ</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className={mobileChipClass(false, true)}>
                      <Link href="/pages/profile/edit" onClick={closeSheet}>
                        <PenLine className="size-4" />
                        <span>Επεξεργασία Προφίλ</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className={mobileChipClass(false, true)}>
                      <Link href="/pages/support/tickets" onClick={closeSheet}>
                        <Ticket className="size-4" />
                        <span>Τα tickets μου</span>
                      </Link>
                    </Button>
                    {canAccessAdminPanel ? (
                      <Button asChild variant="secondary" className={mobileChipClass(false, true)}>
                        <Link href="/admin" onClick={closeSheet}>
                          <ShieldCheck className="size-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 justify-start rounded-full px-3"
                      onClick={() => {
                        closeSheet();
                        void onLogout();
                      }}
                    >
                      <LogOut className="size-4" />
                      <span>Έξοδος</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="h-9 rounded-full">
                      <Link href="/pages/auth/login" onClick={closeSheet}>
                        <LogIn className="size-4" />
                        <span>Σύνδεση</span>
                      </Link>
                    </Button>
                    <Button asChild variant="primary" className="h-9 rounded-full">
                      <Link href="/pages/auth/register" onClick={closeSheet}>
                        <UserPlus className="size-4" />
                        <span>Εγγραφή</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavbarAuthSkeletonMobile() {
  return (
    <div className="grid gap-2">
      <div className="h-11 animate-pulse rounded-full bg-white/10" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-9 animate-pulse rounded-full bg-white/10" />
        <div className="h-9 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}
