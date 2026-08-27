import Link from 'next/link';
import { Scale, ArrowRight } from 'lucide-react';

export function Hero({ count }: { count: number }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="bg-grain absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-success" />
            <span>{count} documents tracked</span>
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            Understand the laws that govern{' '}
            <span className="text-primary">Mauritius</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Track Acts and Bills from the National Assembly. Read plain-language
            summaries of what each law changes, see key dates at a glance, and
            link directly to the official source.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Search legislation
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <a
              href="#whats-new"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Browse latest
            </a>
          </div>

          <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
            <Scale className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              Source:{' '}
              <a
                href="https://mauritiusassembly.govmu.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                Mauritius National Assembly
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
