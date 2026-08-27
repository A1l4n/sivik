/*
# Create legislation table for Mauritius Civic Platform v1

## Purpose
Stores Acts and Bills from the Mauritius National Assembly, each with
extracted PDF text, an AI-generated plain-language summary, topic tags,
and a draft/published status gate.

## New Table: legislation
- id (uuid, primary key)
- title (text, not null) — title of the Act or Bill
- doc_type (text, not null) — 'act' | 'bill'
- doc_number (text) — e.g. "Act No. 12 of 2026"
- date_introduced (date) — when a Bill was introduced
- date_passed (date) — when passed by the Assembly
- date_assented (date) — when assented to by the President
- date_gazetted (date) — when published in the Gazette
- date_in_force (date) — when the law takes effect
- status (text, not null, default 'draft') — 'draft' | 'published'
- source_url (text, not null) — link to the official PDF
- source_name (text, not null, default 'Mauritius National Assembly')
- retrieved_at (timestamptz, not null, default now())
- raw_text (text) — extracted PDF text, used for full-text search and re-summarizing
- ai_summary (text) — plain-language AI-generated summary
- ai_topics (text[]) — 2-3 topic tags
- created_at (timestamptz, not null, default now())
- updated_at (timestamptz, not null, default now())

## Indexes
- date_gazetted desc — for the "What's New" feed ordering
- status — for filtering published vs draft
- doc_type — for Act/Bill filtering

## Full-Text Search
- tsvector column `search_vector` generated from title + raw_text
- GIN index on search_vector for fast full-text queries

## Security (RLS)
- This is a public, no-auth platform: the public site reads published
  legislation as the anon role. Writes (ingestion) happen through the
  service role key server-side, not the anon client.
- SELECT policy: TO anon, authenticated — only rows with status = 'published'
  are visible to the public. Drafts are hidden until a human verifies them.
- No INSERT/UPDATE/DELETE policies for anon — ingestion uses the service
  role key which bypasses RLS entirely.

## Notes
1. The draft/published gate is non-negotiable: every new record starts as
   'draft' and is invisible to the public site until manually flipped to
   'published'.
2. updated_at is maintained by a trigger to track when summaries or
   metadata change.
*/

CREATE TABLE IF NOT EXISTS legislation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('act', 'bill')),
  doc_number text,
  date_introduced date,
  date_passed date,
  date_assented date,
  date_gazetted date,
  date_in_force date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  source_url text NOT NULL,
  source_name text NOT NULL DEFAULT 'Mauritius National Assembly',
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  raw_text text,
  ai_summary text,
  ai_topics text[],
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(raw_text, ''))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legislation_date_gazetted
  ON legislation (date_gazetted DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_legislation_status
  ON legislation (status);

CREATE INDEX IF NOT EXISTS idx_legislation_doc_type
  ON legislation (doc_type);

CREATE INDEX IF NOT EXISTS idx_legislation_search
  ON legislation USING GIN (search_vector);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_legislation_updated_at ON legislation;
CREATE TRIGGER trg_legislation_updated_at
  BEFORE UPDATE ON legislation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE legislation ENABLE ROW LEVEL SECURITY;

-- Public can read only published legislation
DROP POLICY IF EXISTS "public_read_published_legislation" ON legislation;
CREATE POLICY "public_read_published_legislation"
  ON legislation FOR SELECT
  TO anon, authenticated
  USING (status = 'published');