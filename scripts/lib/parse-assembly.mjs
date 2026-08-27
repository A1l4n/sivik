import * as cheerio from 'cheerio';
import { parseAssemblyDate, extractYearFromHeading } from './dates.mjs';

/**
 * Normalizes a header cell's text into a stable key.
 * "Date Introduced" -> "date_introduced", "Date in force" -> "date_in_force"
 */
function normalizeHeader(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Parses the National Assembly Acts (or Bills) listing page.
 *
 * IMPORTANT: this was written from the page's rendered text content,
 * not a live inspection of the raw HTML (this environment can't reach
 * mauritiusassembly.govmu.org). Run with --dry-run first — if the
 * output looks wrong, the most likely fix is adjusting `normalizeHeader`
 * or the first-cell link extraction below to match the real markup.
 *
 * @param {string} html
 * @param {'act'|'bill'} docType
 * @returns {Array<object>} parsed rows, one per Act/Bill
 */
export function parseAssemblyPage(html, docType) {
  const $ = cheerio.load(html);
  const results = [];
  let currentYear = null;

  // Walk headings and tables in document order. Cheerio preserves
  // document order for a compound selector like this.
  const nodes = $('h1, h2, h3, h4, h5, strong, table').toArray();

  for (const node of nodes) {
    const $node = $(node);

    if (node.tagName !== 'table') {
      const text = $node.text().trim();
      const year = extractYearFromHeading(text);
      if (year && /acts|bills/i.test(text)) {
        currentYear = year;
      }
      continue;
    }

    // It's a table — find the header row and map columns.
    const $rows = $node.find('tr');
    if ($rows.length < 2) continue;

    const headerCells = $rows.eq(0).find('th, td').toArray().map((c) => normalizeHeader($(c).text()));
    const hasDateColumns = headerCells.some((h) => h.includes('date'));
    if (!hasDateColumns) continue; // not a legislation table, skip (nav tables etc.)

    for (let i = 1; i < $rows.length; i++) {
      const $cells = $rows.eq(i).find('td');
      if ($cells.length === 0) continue;

      const firstCell = $cells.eq(0);
      const link = firstCell.find('a').first();
      const sourceUrl = link.attr('href') || null;
      const firstCellText = firstCell.text().replace(/\s+/g, ' ').trim();

      if (!firstCellText || /^\*/.test(firstCellText)) continue;

      const docNumberMatch = firstCellText.match(/(?:Act|Bill)\s*No\.?\s*(\d+)/i);
      const docNumber = docNumberMatch ? docNumberMatch[1] : null;
      const title = firstCellText
        .replace(/^(?:Act|Bill)\s*No\.?\s*\d+/i, '')
        .replace(/^of\s+\d{4}/i, '')
        .trim();

      if (!title) continue;

      const row = { title, docNumber, docType, sourceUrl };

      headerCells.forEach((key, idx) => {
        if (idx === 0 || !key.includes('date')) return;
        const raw = $cells.eq(idx).text().trim();
        row[key] = parseAssemblyDate(raw, currentYear);
      });

      results.push({
        title,
        doc_number: docNumber ? `${docType === 'act' ? 'Act' : 'Bill'} No. ${docNumber}` : null,
        doc_type: docType,
        source_url: sourceUrl,
        date_introduced: row.date_introduced || null,
        date_passed: row.date_passed || null,
        date_assented: row.date_assented || null,
        date_gazetted: row.date_gazetted || null,
        date_in_force: row.date_in_force || null,
      });
    }
  }

  return results;
}
