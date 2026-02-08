import Link from 'next/link';

export function LogoBrand({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-[var(--apple-radius-card)] px-1 transition-transform duration-200 [transition-timing-function:var(--hb-ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apple-system-blue)]/45 active:scale-[0.985]"
    >
      <div className="grid h-10 w-10 place-items-center rounded-[var(--apple-radius-card)] bg-[var(--apple-system-blue)] shadow-[var(--apple-nav-shadow)] transition-[filter,transform] duration-200 [transition-timing-function:var(--hb-ease)] group-hover:brightness-110">
        <span className="text-xl font-black leading-none text-slate-950">Η</span>
      </div>
      <span className="text-[13px] font-semibold tracking-[-0.015em] text-[var(--apple-label)]">Hobbistas</span>
    </Link>
  );
}

