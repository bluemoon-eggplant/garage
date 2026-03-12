const SPREADSHEET_ID = '1wdapx8Xli8JDL_0XaACwCV0zyeWtW5pQ9z2OSBU79Oc';

/** Maps category slug to Google Sheet name/gid */
const SHEET_MAP: Record<string, { sheet?: string; gid?: number }> = {
  'mazda-rx7': { gid: 0 },
  'rover-mini': { sheet: 'Mini' },
  'kawasaki-zx14': { sheet: 'ZZR1400' },
  'eunos-roadstar': { sheet: 'ロードスター' },
  'yamaha-renaissa': { sheet: 'ルネッサ' },
  'caterham-7': { sheet: 'セブン' },
};

export interface SheetRecord {
  date: string;
  amount: number;
  item: string;
  mileage: number | null;
  shop: string;
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  const lines = csv.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function parseAmount(value: string): number {
  // Strip ¥, commas, spaces
  const cleaned = value.replace(/[¥￥,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseMileage(value: string): number | null {
  if (!value.trim()) return null;
  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function buildUrl(config: { sheet?: string; gid?: number }): string {
  const base = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;
  if (config.gid !== undefined) {
    return `${base}&gid=${config.gid}`;
  }
  if (config.sheet) {
    return `${base}&sheet=${encodeURIComponent(config.sheet)}`;
  }
  return base;
}

export async function fetchSheetData(category: string): Promise<SheetRecord[]> {
  const config = SHEET_MAP[category];
  if (!config) return [];

  const url = buildUrl(config);

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const csv = await response.text();
    const rows = parseCSV(csv);

    if (rows.length < 2) return [];

    // Skip header row (index 0), parse data rows
    return rows.slice(1).map((row) => ({
      date: row[0]?.trim() || '',
      amount: parseAmount(row[1] || ''),
      item: row[2]?.trim() || '',
      mileage: parseMileage(row[3] || ''),
      shop: row[4]?.trim() || '',
    }));
  } catch (e) {
    console.error(`Failed to fetch sheet for ${category}:`, e);
    return [];
  }
}

/** Fetch all sheets at once for batch use */
export async function fetchAllSheetData(): Promise<Record<string, SheetRecord[]>> {
  const entries = await Promise.all(
    Object.keys(SHEET_MAP).map(async (category) => {
      const data = await fetchSheetData(category);
      return [category, data] as const;
    })
  );
  return Object.fromEntries(entries);
}
