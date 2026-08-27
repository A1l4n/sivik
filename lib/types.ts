export type DocType = 'act' | 'bill';

export type LegislationStatus = 'draft' | 'published';

export interface Legislation {
  id: string;
  title: string;
  doc_type: DocType;
  doc_number: string | null;
  date_introduced: string | null;
  date_passed: string | null;
  date_assented: string | null;
  date_gazetted: string | null;
  date_in_force: string | null;
  status: LegislationStatus;
  source_url: string;
  source_name: string;
  retrieved_at: string;
  raw_text: string | null;
  ai_summary: string | null;
  ai_topics: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface LegislationListItem {
  id: string;
  title: string;
  doc_type: DocType;
  doc_number: string | null;
  date_gazetted: string | null;
  date_passed: string | null;
  date_introduced: string | null;
  ai_summary: string | null;
  ai_topics: string[] | null;
}
