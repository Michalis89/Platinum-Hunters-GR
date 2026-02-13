import Link from 'next/link';

export function LogoBrand({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-lg px-1 transition-transform duration-200 [transition-timing-function:var(--easing-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 active:scale-[0.985]"
    >
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent shadow-sm transition-[filter,transform] duration-200 [transition-timing-function:var(--easing-default)] group-hover:brightness-110">
        <span className="text-xl font-black leading-none text-foreground">H</span>
      </div>
      <span className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
        Hobbistas
      </span>
    </Link>
  );
}
