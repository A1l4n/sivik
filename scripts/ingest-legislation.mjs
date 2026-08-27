#!/usr/bin/env node
/**
 * Ingests Acts and Bills from the Mauritius National Assembly into the
 * `legislation` table, as scoped in the v1 build plan. Everything lands
 * with status='draft' — nothing is publicly visible until a human flips
 * it to 'published' (see the README section at the bottom of this file).
 *
 * Usage:
 *   node scripts/ingest-legislation.mjs --dry-run          # parse only, no downloads/AI/DB writes
 *   node scripts/ingest-legislation.mjs --source=acts       # acts | bills | all (default: all)
 *   node scripts/ingest-legislation.mjs --limit=5           # cap how many new docs to process
 *   node scripts/ingest-legislation.mjs --since=2020        # only Acts/Bills gazetted in/after this year
 *   node scripts/ingest-legislation.mjs                     # default run — see SINCE_YEAR_DEFAULT below
 *
 * The Acts page is one long page covering 2009-present. By default this
 * script only processes the current and previous year — matching the
 * v1 scope ("recent legislation", not the full archive) and avoiding an
 * unexpectedly large first run (hundreds of PDFs + AI calls). Widen with
 * --since=YYYY once v1 is proven and you want to backfill history.
 *
 * Required env vars (put these in .env.scripts, NOT .env — these must
 * never reach the browser bundle):
 *   NEXT_PUBLIC_SUPABASE_URL       (already in .env)
 *   SUPABASE_SERVICE_ROLE_KEY      (Project Settings > API > service_role — bypasses RLS, keep secret)
 *   MISTRAL_API_KEY                (console.mistral.ai — free "Experiment" tier, no card required)
 */

import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { config } from 'dotenv';
import { parseAssemblyPage } from './lib/parse-assembly.mjs';

config({ path: '.env' });
config({ path: '.env.scripts', override: false });

const ACTS_URL = 'https://mauritiusassembly.govmu.org/mauritiusassembly/index.php/acts-2/';
const BILLS_URL = 'https://mauritiusassembly.govmu.org/mauritiusassembly/index.php/bills/';
const MAX_RAW_TEXT_CHARS = 15000; // keep the summarizer prompt a sane size
const MISTRAL_MODEL = 'mistral-small-latest';
// Free tier is rate-limited (varies, roughly ~1 req/sec — check your
// console.mistral.ai dashboard for your actual limit). This delay
// between calls keeps a full run from tripping 429s.
const MISTRAL_DELAY_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const sourceArg = (args.find((a) => a.startsWith('--source=')) || '--source=all').split('=')[1];
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const sinceArg = args.find((a) => a.startsWith('--since='));
const sinceYear = sinceArg ? parseInt(sinceArg.split('=')[1], 10) : new Date().getFullYear() - 1;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SivikBot/1.0; +https://sivik.mu)' },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
  return res.text();
}

async function extractPdfText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SivikBot/1.0; +https://sivik.mu)' },
  });
  if (!res.ok) throw new Error(`PDF fetch failed (${res.status}): ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return parsed.text.trim();
}

async function summarize(mistralApiKey, title, rawText) {
  const truncated = rawText.slice(0, MAX_RAW_TEXT_CHARS);

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mistralApiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You summarize Mauritius legislation for ordinary citizens, not lawyers. ' +
            'Respond with ONLY a JSON object, no markdown fences, no preamble: ' +
            '{"summary": "2-4 plain-language sentences on what this law does and who it affects", ' +
            '"topics": ["2-4 short topic tags, e.g. Employment, Housing, Taxes, Vehicles"]}. ' +
            'If the text does not contain enough information to summarize confidently, ' +
            'set "summary" to "AI summary unavailable — please read the official document." ' +
            'Never invent dates, penalties, or requirements not present in the text.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nDocument text:\n${truncated}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Mistral API error (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || null,
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 4) : [],
    };
  } catch {
    console.warn(`  Could not parse AI response for "${title}" — leaving summary blank.`);
    return { summary: null, topics: [] };
  }
}

async function main() {
  console.log(`Ingest run — source=${sourceArg} dryRun=${isDryRun} limit=${limit} since=${sinceYear}\n`);

  const pages = [];
  if (sourceArg === 'acts' || sourceArg === 'all') pages.push({ url: ACTS_URL, docType: 'act' });
  if (sourceArg === 'bills' || sourceArg === 'all') pages.push({ url: BILLS_URL, docType: 'bill' });

  let parsedRows = [];
  for (const page of pages) {
    console.log(`Fetching ${page.url}`);
    const html = await fetchText(page.url);
    const rows = parseAssemblyPage(html, page.docType);
    console.log(`  Parsed ${rows.length} ${page.docType}(s)`);
    parsedRows = parsedRows.concat(rows);
  }

  // Only rows with a real PDF link are usable — anything else can't be
  // downloaded, summarized, or deduplicated.
  parsedRows = parsedRows.filter((r) => r.source_url);

  // Scope to recent legislation by default (see header comment) — use
  // whichever date is available, gazetted first since that's the most
  // legally meaningful one.
  const before = parsedRows.length;
  parsedRows = parsedRows.filter((r) => {
    const dateStr = r.date_gazetted || r.date_assented || r.date_passed || r.date_introduced;
    if (!dateStr) return true; // don't silently drop undated rows — let a human look
    return parseInt(dateStr.slice(0, 4), 10) >= sinceYear;
  });
  console.log(`Scoped to --since=${sinceYear}: ${parsedRows.length} of ${before} parsed rows kept.`);

  if (isDryRun) {
    console.log(`\n--dry-run: not touching PDFs, AI, or the database. First 5 parsed rows:\n`);
    console.log(JSON.stringify(parsedRows.slice(0, 5), null, 2));
    console.log(`\nTotal parseable rows: ${parsedRows.length}`);
    return;
  }

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const mistralApiKey = requireEnv('MISTRAL_API_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Skip anything already ingested (by source_url, which is unique).
  const { data: existing, error: existingErr } = await supabase
    .from('legislation')
    .select('source_url');
  if (existingErr) throw existingErr;
  const existingUrls = new Set((existing || []).map((r) => r.source_url));

  const newRows = parsedRows.filter((r) => !existingUrls.has(r.source_url)).slice(0, limit);
  console.log(`\n${newRows.length} new document(s) to process (of ${parsedRows.length} total parsed).\n`);

  let processed = 0;
  let failed = 0;

  for (const row of newRows) {
    console.log(`Processing: ${row.title}`);
    try {
      const rawText = await extractPdfText(row.source_url);
      const { summary, topics } = await summarize(mistralApiKey, row.title, rawText);

      const { error } = await supabase.from('legislation').upsert(
        {
          title: row.title,
          doc_type: row.doc_type,
          doc_number: row.doc_number,
          date_introduced: row.date_introduced,
          date_passed: row.date_passed,
          date_assented: row.date_assented,
          date_gazetted: row.date_gazetted,
          date_in_force: row.date_in_force,
          status: 'draft',
          source_url: row.source_url,
          source_name: 'Mauritius National Assembly',
          raw_text: rawText.slice(0, 50000),
          ai_summary: summary,
          ai_topics: topics,
        },
        { onConflict: 'source_url' }
      );

      if (error) throw error;
      console.log(`  Saved as draft. Topics: ${topics.join(', ') || 'none'}`);
      processed++;
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      failed++;
    }

    // Respect the free tier's rate limit before moving to the next doc.
    await sleep(MISTRAL_DELAY_MS);
  }

  console.log(`\nDone. ${processed} saved as draft, ${failed} failed.`);
  console.log(`Review drafts in Supabase (legislation table, status='draft') before publishing.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
