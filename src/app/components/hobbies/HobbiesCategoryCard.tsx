'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Book,
  Code,
  PawPrint,
  Wind,
  ListTodo,
  FileText,
  Star,
  Lock,
  Construction,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import type { HobbyCategory } from '@/config/hobbies';

const ICON_MAP: Record<string, typeof Gamepad2> = {
  Gamepad2,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Book,
  Code,
  PawPrint,
  Wind,
};

type ModuleButtonProps = {
  label: string;
  href: string;
  status: boolean | 'under-construction';
  requiresAuth: boolean;
  isAuthenticated: boolean;
  color: string;
  icon: typeof ListTodo;
};

function ModuleButton({
  label,
  href,
  status,
  requiresAuth,
  isAuthenticated,
  color,
  icon: Icon,
}: ModuleButtonProps) {
  const router = useRouter();

  const isUnderConstruction = status === 'under-construction';
  const isDisabled = status !== true;
  const disabledTitle = isUnderConstruction ? 'Υπό κατασκευή' : 'Μη διαθέσιμο';
  const needsLogin = requiresAuth && !isAuthenticated && status === true;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    if (needsLogin) {
      e.preventDefault();
      const redirectUrl = encodeURIComponent(href);
      router.push(`/pages/auth/login?redirect=${redirectUrl}`);
      return;
    }
  };

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1.5 text-xs font-medium text-[var(--hb-muted)] opacity-50"
        title={disabledTitle}
      >
        <Construction className="h-3 w-3" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`group/btn flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 ${color}`}
    >
      {needsLogin ? <Lock className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      <span>{label}</span>
    </Link>
  );
}

type HobbiesCategoryCardProps = {
  category: HobbyCategory;
};

export function HobbiesCategoryCard({ category }: HobbiesCategoryCardProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const IconComponent = ICON_MAP[category.icon] || Gamepad2;

  return (
    <div className="hover:border-[var(--hb-primary-strong)]/50 group rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--hb-shadow-md-hover)]">
      <div className="mb-4 flex items-start justify-between">
        <div className="bg-[var(--hb-primary-strong)]/10 group-hover:bg-[var(--hb-primary-strong)]/20 flex h-12 w-12 items-center justify-center rounded-xl text-[var(--hb-primary-strong)] transition-colors">
          <IconComponent className="h-6 w-6" />
        </div>
      </div>

      <h3 className="mb-1.5 text-lg font-semibold text-[var(--hb-headline)]">{category.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-[var(--hb-muted)]">{category.description}</p>

      <div className="flex flex-wrap gap-2">
        <ModuleButton
          label="Backlog"
          href={category.routes.backlog}
          status={category.modules.backlog}
          requiresAuth={category.requiresAuth.backlog}
          isAuthenticated={isAuthenticated}
          color="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/20"
          icon={ListTodo}
        />
        <ModuleButton
          label="Άρθρα"
          href={category.routes.news}
          status={category.modules.news}
          requiresAuth={category.requiresAuth.news}
          isAuthenticated={isAuthenticated}
          color="border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-500/50 hover:bg-sky-500/20"
          icon={FileText}
        />
        <ModuleButton
          label="Reviews"
          href={category.routes.reviews}
          status={category.modules.reviews}
          requiresAuth={category.requiresAuth.reviews}
          isAuthenticated={isAuthenticated}
          color="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/20"
          icon={Star}
        />
      </div>
    </div>
  );
}
