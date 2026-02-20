import { AvatarImage } from '@/components/ui/avatar-image';
import { Calendar, Clock, Eye, Heart, User } from 'lucide-react';
import type { ArticleRow } from '@/types/database';
import ActionRow from '@/app/components/article/ActionRow.client';
import { FormattedDate } from '@/utils/components/FormattedDate';
import { cn } from '@/lib/utils';
import { ARTICLE_BADGE, ARTICLE_META } from '@/components/article/typography';

type ArticleWithAuthorMeta = ArticleRow & {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface MetaActionsBarProps {
  article: ArticleWithAuthorMeta;
  readTime: string | null;
  dateOptions: Intl.DateTimeFormatOptions;
}

const META_PILL_BASE = ARTICLE_META;

export default function MetaActionsBar({
  article,
  readTime,
  dateOptions,
}: MetaActionsBarProps) {
  return (
    <section className="mt-6 rounded-2xl border border-border/70 bg-card/55 p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {article.published_at && (
            <span className={META_PILL_BASE}>
              <Calendar size={12} />
              <FormattedDate
                date={article.published_at}
                options={dateOptions}
                fallback=""
                className="text-[10px]"
              />
            </span>
          )}

          {readTime && (
            <span className={META_PILL_BASE}>
              <Clock size={12} />
              <span className="text-[10px]">{readTime}</span>
            </span>
          )}

          {article.users && (
            <span className={cn(ARTICLE_BADGE, 'normal-case tracking-normal')}>
              {article.users.avatar_url ? (
                <span className="h-4 w-4 overflow-hidden rounded-full">
                  <AvatarImage
                    src={article.users.avatar_url}
                    alt={article.users.username}
                    size={16}
                    className="rounded-full"
                  />
                </span>
              ) : (
                <User size={12} />
              )}
              <span className="truncate">{article.users.display_name || article.users.username}</span>
            </span>
          )}

          <span className={cn(ARTICLE_BADGE, 'normal-case tracking-normal')}>
            <Eye size={12} />
            <span>{article.views ?? 0} views</span>
          </span>
          <span className={cn(ARTICLE_BADGE, 'normal-case tracking-normal')}>
            <Heart size={12} />
            <span>{article.likes ?? 0} likes</span>
          </span>
        </div>

        <div className="flex justify-center md:ml-4 md:justify-end">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-1.5 py-1 shadow-sm">
            <ActionRow article={article} className="flex items-center gap-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
