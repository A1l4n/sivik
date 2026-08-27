'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { MonthlyTrend, TopicCount } from '@/lib/legislation';

const trendConfig = {
  acts: { label: 'Acts', color: 'hsl(var(--chart-1))' },
  bills: { label: 'Bills', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export function LegislationTrendsChart({ data }: { data: MonthlyTrend[] }) {
  const hasData = data.some((d) => d.acts > 0 || d.bills > 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="font-serif text-base font-semibold text-foreground">
        Legislative activity
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Acts and Bills gazetted per month
      </p>
      {hasData ? (
        <ChartContainer
          config={trendConfig}
          className="mt-4 aspect-auto h-64 w-full"
        >
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="acts"
              stackId="a"
              fill="var(--color-acts)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="bills"
              stackId="a"
              fill="var(--color-bills)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}

export function TopicsBarChart({ data }: { data: TopicCount[] }) {
  const config = Object.fromEntries(
    data.map((d, i) => [
      d.topic,
      { label: d.topic, color: `hsl(var(--chart-${(i % 5) + 1}))` },
    ])
  ) satisfies ChartConfig;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="font-serif text-base font-semibold text-foreground">
        Most active topics
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on AI-classified topics across published legislation
      </p>
      {data.length > 0 ? (
        <ChartContainer
          config={config}
          className="mt-4 aspect-auto h-64 w-full"
        >
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="topic"
              type="category"
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        </ChartContainer>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      Not enough published data yet
    </div>
  );
}
