import Link from 'next/link';
import { FileText, ScrollText, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LegislationListItem } from '@/lib/types';
import { formatDate } from '@/lib/format';

export function LegislationCard({
  item,
  index = 0,
}: {
  item: LegislationListItem;
  index?: number;
}) {
  const isAct = item.doc_type === 'act';
  const date = item.date_gazetted || item.date_passed || item.date_introduced;

  return (
    <Link href={`/document/${item.id}`} className="group block">
      <article
        className="relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md animate-fade-in-up"
        style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isAct
                  ? 'bg-primary/10 text-primary'
                  : 'bg-warning/10 text-warning'
              }`}
            >
              {isAct ? (
                <ScrollText className="h-4.5 w-4.5" strokeWidth={2} />
              ) : (
                <FileText className="h-4.5 w-4.5" strokeWidth={2} />
              )}
            </div>
            <Badge
              variant={isAct ? 'default' : 'secondary'}
              className="uppercase tracking-wide"
            >
              {isAct ? 'Act' : 'Bill'}
            </Badge>
            {item.doc_number && (
              <span className="text-xs font-medium text-muted-foreground">
                {item.doc_number}
              </span>
            )}
          </div>
          {date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
              <time dateTime={date}>{formatDate(date)}</time>
            </div>
          )}
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug text-foreground text-balance transition-colors group-hover:text-primary">
          {item.title}
        </h3>

        {item.ai_summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.ai_summary}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {item.ai_topics?.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Read
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </div>
      </article>
    </Link>
  );
}

export function LegislationCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}
