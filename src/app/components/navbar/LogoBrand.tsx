import Link from 'next/link';

export function LogoBrand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hb-ring)]">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)]">
        <span className="text-xl font-black leading-none text-slate-950">Η</span>
      </div>
      <span className="text-sm font-semibold tracking-tight text-[var(--hb-headline)]">Hobbistas</span>
    </Link>
  );
}

