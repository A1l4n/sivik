import {
  fetchRecentLegislation,
  fetchLegislationCount,
  fetchLegislationTrends,
  fetchTopTopics,
} from '@/lib/legislation';
import { LegislationFeed } from '@/components/site/legislation-feed';
import { Hero } from '@/components/site/hero';
import {
  LegislationTrendsChart,
  TopicsBarChart,
} from '@/components/site/legislation-charts';
import { TrendingUp, ShieldCheck, FileSearch } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [items, count, trends, topics] = await Promise.all([
    fetchRecentLegislation('all', 24),
    fetchLegislationCount(),
    fetchLegislationTrends(6),
    fetchTopTopics(6),
  ]);

  return (
    <div>
      <Hero count={count} />

      <section className="mx-auto max-w-6xl px-4 pb-4 pt-16 sm:px-6">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            At a glance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What the legislative record looks like right now.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <LegislationTrendsChart data={trends} />
          <TopicsBarChart data={topics} />
        </div>
      </section>

      <section
        id="whats-new"
        className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6"
      >
        <div className="mb-8 border-b border-border/60 pb-6">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            What&apos;s New
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent Acts and Bills from the Mauritius National Assembly, newest
            first.
          </p>
        </div>

        <LegislationFeed initialItems={items} />

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={TrendingUp}
            title="Stay current"
            description="See the latest legislation as soon as it is published and verified."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Human-verified"
            description="Every summary is reviewed before publishing. AI-generated content is always labeled."
          />
          <FeatureCard
            icon={FileSearch}
            title="Full-text search"
            description="Search across all legislation titles and full document text."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof TrendingUp;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
