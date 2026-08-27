'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, ScrollText, FileText, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LegislationListItem, DocType } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Link from 'next/link';

type FilterType = DocType | 'all';

export function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as FilterType) || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>(initialType);
  const [results, setResults] = useState<LegislationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(
    async (q: string, type: FilterType) => {
      if (!q.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      try {
        const params = new URLSearchParams({ q });
        if (type !== 'all') params.set('type', type);
        router.replace(`/search?${params.toString()}`);

        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}${type !== 'all' ? `&type=${type}` : ''}`
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Run initial search if query param present
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, filter);
  };

  const handleFilterChange = (value: string) => {
    const newFilter = value as FilterType;
    setFilter(newFilter);
    if (query.trim()) performSearch(query, newFilter);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    router.replace('/search');
  };

  return (
    <div>
      <div className="mb-8 border-b border-border/60 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Search legislation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across all published Acts and Bills by title or full document
          text.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-4">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or keyword..."
          className="h-14 pl-12 pr-12 text-base"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
      </form>

      <div className="mb-6">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
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

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      )}

      {!loading && hasSearched && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? 'result' : 'results'} for{' '}
            <span className="font-semibold text-foreground">&ldquo;{initialQuery || query}&rdquo;</span>
          </p>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Search className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">
                No results found
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try different keywords or remove the Act/Bill filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((item, i) => (
                <SearchResultRow key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !hasSearched && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Search className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Start searching
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Enter keywords to search across all published legislation.
          </p>
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  item,
  index,
}: {
  item: LegislationListItem;
  index: number;
}) {
  const isAct = item.doc_type === 'act';
  const date = item.date_gazetted || item.date_passed || item.date_introduced;

  return (
    <Link
      href={`/document/${item.id}`}
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isAct
              ? 'bg-primary/10 text-primary'
              : 'bg-warning/10 text-warning'
          }`}
        >
          {isAct ? (
            <ScrollText className="h-5 w-5" strokeWidth={2} />
          ) : (
            <FileText className="h-5 w-5" strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant={isAct ? 'default' : 'secondary'} className="uppercase">
              {isAct ? 'Act' : 'Bill'}
            </Badge>
            {item.doc_number && (
              <span className="text-xs text-muted-foreground">
                {item.doc_number}
              </span>
            )}
            {date && (
              <span className="text-xs text-muted-foreground">
                {formatDate(date)}
              </span>
            )}
          </div>
          <h3 className="font-serif text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {item.title}
          </h3>
          {item.ai_summary && (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {item.ai_summary}
            </p>
          )}
        </div>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
          strokeWidth={2}
        />
      </div>
    </Link>
  );
}
