import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import {
  CATEGORY_META,
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
  if (!items.length) {
    return null;
  }

  const { visible, extra } = summarizeItems(items, 3);
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(item => (
          <Badge
            key={item}
            variant="secondary"
            className="border border-border/60 bg-card/70 text-[11px] font-normal text-muted-foreground transition-colors hover:text-foreground"
          >
            {item}
          </Badge>
        ))}
        {extra > 0 && (
          <Badge
            variant="secondary"
            className="border border-border/60 bg-card/70 text-[11px] font-normal text-muted-foreground"
          >
            +{extra} more
          </Badge>
        )}
      </div>
    </div>
  );
}

export function HobbyCard({ category, note, genreAffinity, showPsnId = true }: Readonly<HobbyCardProps>) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const details = getCategoryCardData(category, note ?? {}, genreAffinity, { showPsnId });
  const primaryDetails = details.keyAttributes.filter(item => item.value);

  return (
    <article className="group rounded-2xl border border-border/55 bg-card/60 p-4 transition-all duration-300 hover:border-primary/25 hover:shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)]">
      <details className="group/details" open>
        <summary className="list-none cursor-pointer">
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

          {details.genres.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {summarizeItems(details.genres, 3).visible.map(genre => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="border border-border/60 bg-card/70 text-[11px] font-normal text-muted-foreground"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </summary>

        <div className="space-y-3 pt-1">
          {primaryDetails.length > 0 && (
            <dl className="grid gap-2 sm:grid-cols-2">
              {primaryDetails.map(item => (
                <div key={item.label}>
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{item.label}</dt>
                  <dd className="break-words text-sm text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <CompactPillList items={details.genres} label="Top Genres" />
          {details.listSections.map(section => (
            <CompactPillList key={section.label} items={section.items} label={section.label} />
          ))}

          {details.externalAccounts.length > 0 && (
            <div>
              {details.externalAccountsLabel ? (
                <p className="mb-2 text-xs text-muted-foreground">{details.externalAccountsLabel}</p>
              ) : null}
              <dl className="grid gap-2">
                {details.externalAccounts.map(account => (
                  <div
                    key={account.label}
                    className="rounded-lg border border-border/50 bg-card/65 px-2.5 py-2"
                  >
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {account.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {account.href ? (
                        <a
                          href={account.href}
                          target="_blank"
                          rel="noreferrer"
                          title={account.value}
                          className="block truncate transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {account.value}
                        </a>
                      ) : (
                        <span className="block truncate" title={account.value}>
                          {account.value}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

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
