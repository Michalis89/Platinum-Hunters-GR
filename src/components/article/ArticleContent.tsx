import { cn } from '@/lib/utils';
import { ARTICLE_PROSE } from '@/components/article/typography';

type ArticleContentProps = {
  html: string;
  className?: string;
};

export function ArticleContent({ html, className }: ArticleContentProps) {
  return (
    <section className={cn(ARTICLE_PROSE, className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
