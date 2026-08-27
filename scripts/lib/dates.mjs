const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

/**
 * Parses the National Assembly site's inconsistent date formats into
 * an ISO date string (YYYY-MM-DD), or null if it can't be parsed
 * confidently. Never throws — an unparseable date should not stop
 * ingestion, it should just leave that field blank for manual review.
 *
 * Handles: "09 December 2025", "17 Mar" (year-less, uses fallbackYear),
 * "20-Mar", "17-Mar-2026", "05 Feb 10" (2-digit year), "*" / "IV*" / ""
 * (footnote markers meaning "date to be fixed by Proclamation" -> null).
 */
export function parseAssemblyDate(raw, fallbackYear) {
  if (!raw) return null;
  const text = String(raw).trim();

  // Footnote markers, asterisks, roman-numeral footnotes, em-dashes etc.
  if (!/\d/.test(text)) return null;

  const cleaned = text.replace(/[^\w\s\-\/]/g, ' ').trim();

  // "09 December 2025" / "17 Mar 2026" / "20 -Mar" / "17-Mar-2026" / "05-Feb-10"
  const parts = cleaned.split(/[\s\-\/]+/).filter(Boolean);
  if (parts.length < 2) return null;

  let month;
  const numericTokens = [];

  for (const part of parts) {
    const monthKey = part.toLowerCase();
    if (MONTHS[monthKey] !== undefined) {
      month = MONTHS[monthKey];
      continue;
    }
    const num = parseInt(part, 10);
    if (!isNaN(num)) numericTokens.push(num);
  }

  if (!month || numericTokens.length === 0) return null;

  // First numeric token is the day. A second one, if present, is the
  // year (2-digit or 4-digit) — it doesn't matter if it's <= 31, since
  // day has already claimed the first slot.
  const day = numericTokens[0];
  let year = numericTokens[1];
  if (year !== undefined && year < 100) year = year < 50 ? 2000 + year : 1900 + year;
  if (!year) year = fallbackYear;
  if (!year || day < 1 || day > 31) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Extracts a 4-digit year from text like "Acts 2026" or "Bills 2025". */
export function extractYearFromHeading(text) {
  const match = String(text).match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}
