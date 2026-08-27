import { getServerClient } from './supabase-server';
import type { Legislation, LegislationListItem, DocType } from './types';

const LIST_SELECT =
  'id, title, doc_type, doc_number, date_gazetted, date_passed, date_introduced, ai_summary, ai_topics';

export async function fetchRecentLegislation(
  docType?: DocType | 'all',
  limit = 20
): Promise<LegislationListItem[]> {
  const supabase = getServerClient();
  let query = supabase
    .from('legislation')
    .select(LIST_SELECT)
    .eq('status', 'published')
    .order('date_gazetted', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (docType && docType !== 'all') {
    query = query.eq('doc_type', docType);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchRecentLegislation error:', error.message);
    return [];
  }
  return (data || []) as LegislationListItem[];
}

export async function fetchLegislationById(id: string): Promise<Legislation | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('legislation')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('fetchLegislationById error:', error.message);
    return null;
  }
  return (data as Legislation) || null;
}

export async function searchLegislation(
  query: string,
  docType?: DocType | 'all',
  limit = 30
): Promise<LegislationListItem[]> {
  if (!query.trim()) return [];

  const supabase = getServerClient();
  const tsQuery = query.trim().split(/\s+/).join(' & ');

  let q = supabase
    .from('legislation')
    .select(LIST_SELECT)
    .eq('status', 'published')
    .textSearch('search_vector', tsQuery)
    .order('date_gazetted', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (docType && docType !== 'all') {
    q = q.eq('doc_type', docType);
  }

  const { data, error } = await q;
  if (error) {
    console.error('searchLegislation error:', error.message);
    return [];
  }
  return (data || []) as LegislationListItem[];
}

export async function fetchLegislationCount(): Promise<number> {
  const supabase = getServerClient();
  const { count, error } = await supabase
    .from('legislation')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (error) {
    console.error('fetchLegislationCount error:', error.message);
    return 0;
  }
  return count || 0;
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  acts: number;
  bills: number;
}

/**
 * Acts vs Bills gazetted per month, for the last `monthsBack` months.
 * Aggregated in JS rather than SQL — fine at this data volume, and keeps
 * the schema untouched. Revisit with a Postgres view if the table grows large.
 */
export async function fetchLegislationTrends(
  monthsBack = 6
): Promise<MonthlyTrend[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('legislation')
    .select('doc_type, date_gazetted')
    .eq('status', 'published')
    .not('date_gazetted', 'is', null);

  if (error) {
    console.error('fetchLegislationTrends error:', error.message);
    return [];
  }

  const now = new Date();
  const buckets = new Map<string, MonthlyTrend>();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, {
      month: key,
      monthLabel: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      acts: 0,
      bills: 0,
    });
  }

  for (const row of data || []) {
    if (!row.date_gazetted) continue;
    const d = new Date(row.date_gazetted);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (row.doc_type === 'act') bucket.acts += 1;
    else bucket.bills += 1;
  }

  return Array.from(buckets.values());
}

export interface TopicCount {
  topic: string;
  count: number;
}

/** Most common AI-classified topics across published legislation. */
export async function fetchTopTopics(limit = 6): Promise<TopicCount[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('legislation')
    .select('ai_topics')
    .eq('status', 'published')
    .not('ai_topics', 'is', null);

  if (error) {
    console.error('fetchTopTopics error:', error.message);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data || []) {
    for (const topic of row.ai_topics || []) {
      counts.set(topic, (counts.get(topic) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
