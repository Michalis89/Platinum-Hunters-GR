import React from 'react';
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

export const MobileNavSheet = React.memo(function MobileNavSheet({
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
            className="h-11 w-11 rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] text-[var(--apple-label)] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="hb-dialog-surface w-[92vw] max-w-sm border-[var(--hb-dialog-border)] p-0 text-[var(--apple-label)]"
        >
          <SheetHeader className="border-b border-[var(--apple-nav-pill-border)] px-5 py-4">
            <SheetTitle className="text-left text-sm font-semibold tracking-[-0.015em] text-[var(--apple-label)]">
              Hobbistas Menu
            </SheetTitle>
          </SheetHeader>

          <div className="h-[calc(100vh-72px)] overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
            <div className="space-y-4 pr-1">
              {hobbyItems.length > 0 ? (
                <>
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--apple-secondary-label)]">
                      Library
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
                            <Link href={item.href}>
                              <NavItemContent icon={item.icon} label={item.label} />
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <Separator className="h-[0.5px] bg-[var(--apple-nav-pill-border)]" />
                </>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--apple-secondary-label)]">
                  Quick links
                </h3>
                <div className="grid gap-2">
                  {navItems.map(item => (
                    <Button
                      key={item.href}
                      asChild
                      variant="secondary"
                      className={mobileChipClass(isHrefActive(pathname, item.href), true)}
                    >
                      <Link href={item.href}>
                        <NavItemContent icon={item.icon} label={item.label} />
                      </Link>
                    </Button>
                  ))}
                </div>
              </section>

              <Separator className="h-[0.5px] bg-[var(--apple-nav-pill-border)]" />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--apple-secondary-label)]">Appearance</h3>
                <ThemeToggleButton
                  theme={theme}
                  onToggle={onToggleTheme}
                  iconOnly={false}
                  className="w-full justify-start border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3"
                />
              </section>

              <Separator className="h-[0.5px] bg-[var(--apple-nav-pill-border)]" />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--apple-secondary-label)]">Account</h3>
                {!authResolved ? (
                  <NavbarAuthSkeletonMobile />
                ) : isAuthenticated && user ? (
                  <div className="grid gap-2">
                    <div className="flex h-11 items-center gap-2 rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3">
                      <Avatar className="h-7 w-7 border border-[var(--apple-nav-pill-border)]">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'User'} />
                        <AvatarFallback className="bg-[var(--apple-nav-pill-hover)] text-xs font-semibold text-[var(--apple-label)]">
                          {getUserInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">{user.username}</span>
                    </div>
                    {canQuickAdd ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 justify-start rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]"
                        onClick={() => {
                          closeSheet();
                          onAdd();
                        }}
                      >
                        <Plus className="size-4" />
                        <span>Quick add</span>
                      </Button>
                    ) : null}
                    <Button asChild variant="secondary" className="h-11 justify-start rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]">
                      <Link href="/pages/profile">
                        <User className="size-4" />
                        <span>Profile</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-11 justify-start rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]">
                      <Link href="/pages/profile/edit">
                        <PenLine className="size-4" />
                        <span>Edit profile</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-11 justify-start rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]">
                      <Link href="/pages/support/tickets">
                        <Ticket className="size-4" />
                        <span>My tickets</span>
                      </Link>
                    </Button>
                    {canAccessAdminPanel ? (
                      <Button asChild variant="secondary" className="h-11 justify-start rounded-[var(--apple-radius-control)] border border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]">
                        <Link href="/admin">
                          <ShieldCheck className="size-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 justify-start rounded-[var(--apple-radius-control)] border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] px-3 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]"
                      onClick={() => {
                        closeSheet();
                        void onLogout();
                      }}
                    >
                      <LogOut className="size-4" />
                      <span>Sign out</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 rounded-[var(--apple-radius-control)] border-[var(--apple-nav-pill-border)] bg-[var(--apple-nav-pill-bg)] text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:bg-[var(--apple-nav-pill-hover)] active:scale-[0.98]"
                    >
                      <Link href="/auth/login">
                        <LogIn className="size-4" />
                        <span>Sign in</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="primary"
                      className="h-11 rounded-[var(--apple-radius-control)] border border-transparent bg-[var(--apple-system-blue)] text-[13px] font-medium tracking-[-0.01em] transition-[filter,transform] duration-200 [transition-timing-function:var(--hb-ease)] hover:brightness-110 active:scale-[0.98]"
                    >
                      <Link href="/auth/register">
                        <UserPlus className="size-4" />
                        <span>Create account</span>
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
});

function NavbarAuthSkeletonMobile() {
  return (
    <div className="grid gap-2">
      <div className="h-11 animate-pulse rounded-[var(--apple-radius-control)] bg-[var(--apple-nav-pill-hover)]" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 animate-pulse rounded-[var(--apple-radius-control)] bg-[var(--apple-nav-pill-hover)]" />
        <div className="h-10 animate-pulse rounded-[var(--apple-radius-control)] bg-[var(--apple-nav-pill-hover)]" />
      </div>
    </div>
  );
}
