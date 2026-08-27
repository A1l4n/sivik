import Link from 'next/link';
import { Scale } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scale className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-foreground">Sivik</span>
              <span className="text-[11px] text-muted-foreground">
                Mauritius Civic Platform
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              What’s New
            </Link>
            <Link
              href="/search"
              className="hover:text-foreground transition-colors"
            >
              Search
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Sivik is an independent civic platform. Summaries are AI-generated
            and labeled as such — always refer to the official source for
            legal certainty. Data sourced from the{' '}
            <a
              href="https://mauritiusassembly.govmu.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              Mauritius National Assembly
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
