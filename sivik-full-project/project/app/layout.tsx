import './globals.css';
import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sivik — Mauritius Civic Platform',
    template: '%s — Sivik',
  },
  description:
    'Track Acts and Bills from the Mauritius National Assembly. See what changed, what it means in plain language, and read the official source.',
  openGraph: {
    title: 'Sivik — Mauritius Civic Platform',
    description:
      'Track Acts and Bills from the Mauritius National Assembly. See what changed, what it means, and read the source.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sivik — Mauritius Civic Platform',
    description:
      'Track Acts and Bills from the Mauritius National Assembly. See what changed, what it means, and read the source.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen flex flex-col font-sans bg-grain">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
