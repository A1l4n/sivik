import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
        Document not found
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        This document may not have been published yet, or the link may be
        incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to What&apos;s New
      </Link>
    </div>
  );
}
