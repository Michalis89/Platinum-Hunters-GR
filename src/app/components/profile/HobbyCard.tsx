import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import {
  CATEGORY_META,
  type ExternalAccount,
  getCategoryCardData,
  summarizeItems,
  type ProfileCategoryKey,
} from './profileData';

type HobbyCardProps = {
  category: ProfileCategoryKey;
  note?: Record<string, unknown>;
  genreAffinity?: Record<string, string[]>;
  showPsnId?: boolean;
};

function CompactPillList({
  items,
  label,
}: Readonly<{
  items: string[];
  label: string;
}>) {
  const cleanedItems = useMemo(() => items.filter(Boolean), [items]);
  const [expanded, setExpanded] = useState(false);

  if (!cleanedItems.length) {
    return null;
  }

  const { visible, extra } = summarizeItems(cleanedItems, 3);
  const visibleItems = expanded ? cleanedItems : visible;

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {visibleItems.map(item => (
          <Badge
            key={item}
            variant="secondary"
            className="border border-border/60 bg-card/70 text-[11px] font-normal text-muted-foreground transition-colors hover:text-foreground"
          >
            {item}
          </Badge>
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(current => !current)}
            className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] font-normal text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {expanded ? `Show less (+${extra} hidden)` : `+${extra} more`}
          </button>
        )}
      </div>
    </div>
  );
}

function ExternalAccountsPills({
  accounts,
  label,
}: Readonly<{
  accounts: ExternalAccount[];
  label?: string;
}>) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div>
      {label ? <p className="mb-2 text-xs text-muted-foreground">{label}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {accounts.map(account => {
          const content = (
            <>
              <span className="uppercase tracking-[0.06em] text-muted-foreground/90">
                {account.label}:
              </span>{' '}
              <span className="text-foreground">{account.value}</span>
            </>
          );

          if (account.href) {
            return (
              <a
                key={account.label}
                href={account.href}
                target="_blank"
                rel="noreferrer"
                title={account.value}
                className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] font-normal transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {content}
              </a>
            );
          }

          return (
            <span
              key={account.label}
              title={account.value}
              className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] font-normal"
            >
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function HobbyCard({
  category,
  note,
  genreAffinity,
  showPsnId = true,
}: Readonly<HobbyCardProps>) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const details = getCategoryCardData(category, note ?? {}, genreAffinity, { showPsnId });
  const primaryDetails = details.keyAttributes.filter(item => item.value);

  return (
    <article className="group rounded-2xl border border-border/55 bg-card/60 p-4 transition-all duration-300 hover:border-primary/25 hover:shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)]">
      <details className="group/details" open>
        <summary className="cursor-pointer list-none">
          <header className="mb-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-foreground">{meta.title}</h4>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
            <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
          </header>
        </summary>

        <div className="space-y-3 pt-1">
          {primaryDetails.length > 0 && (
            <dl className="grid gap-2 sm:grid-cols-2">
              {primaryDetails.map(item => (
                <div key={item.label}>
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="break-words text-sm text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <CompactPillList items={details.genres} label="Favorite Genres" />
          {details.listSections.map(section => (
            <CompactPillList key={section.label} items={section.items} label={section.label} />
          ))}

          <ExternalAccountsPills
            accounts={details.externalAccounts}
            label={details.externalAccountsLabel}
          />

          {primaryDetails.length === 0 &&
            details.genres.length === 0 &&
            details.listSections.every(section => section.items.length === 0) &&
            details.externalAccounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No details saved yet.</p>
            )}
        </div>
      </details>
    </article>
  );
}
