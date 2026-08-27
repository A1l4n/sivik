import { SearchClient } from '@/components/site/search-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
