import { NextRequest, NextResponse } from 'next/server';
import { searchLegislation } from '@/lib/legislation';
import type { DocType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') as DocType | 'all') || 'all';

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchLegislation(query, type, 30);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}
