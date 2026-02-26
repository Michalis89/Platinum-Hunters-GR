import Link from 'next/link';

export function LogoBrand({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-2 rounded-lg px-1 transition-transform duration-200 [transition-timing-function:var(--easing-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 active:scale-[0.99] md:gap-2.5"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg border border-[hsl(var(--accent-primary))/0.35] bg-[hsl(var(--accent-muted))] transition-colors duration-200 [transition-timing-function:var(--easing-default)] group-hover:bg-[hsl(var(--accent-muted))/0.75]">
        <span className="text-lg font-black leading-none text-primary">H</span>
      </div>
      <span className="truncate text-[13px] font-semibold tracking-[-0.015em] text-foreground sm:text-[14px]">
        Hobbistas
      </span>
    </Link>
  );
}
