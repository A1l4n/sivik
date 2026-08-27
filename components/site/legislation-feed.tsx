'use client';

import { useState, useCallback } from 'react';
import { LegislationCard, LegislationCardSkeleton } from '@/components/site/legislation-card';
import type { LegislationListItem, DocType } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, FileText, Layers } from 'lucide-react';

type FilterType = DocType | 'all';

export function LegislationFeed({
  initialItems,
}: {
  initialItems: LegislationListItem[];
}) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? initialItems
    : initialItems.filter((item) => item.doc_type === filter);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" strokeWidth={2} />
          <span>
            Showing{' '}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{' '}
            {filtered.length === 1 ? 'document' : 'documents'}
          </span>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All
            </TabsTrigger>
            <TabsTrigger value="act" className="gap-1.5">
              <ScrollText className="h-3.5 w-3.5" strokeWidth={2} />
              Acts
            </TabsTrigger>
            <TabsTrigger value="bill" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              Bills
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item, i) => (
            <LegislationCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LegislationFeedSkeleton() {
  return (
    <div>
      <div className="mb-6 h-10 w-72 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <LegislationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <ScrollText className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-lg font-semibold text-foreground">
        No documents yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Published Acts and Bills from the National Assembly will appear here
        once they are ingested and verified.
      </p>
    </div>
  );
}
