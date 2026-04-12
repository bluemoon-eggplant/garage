import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  CLASSIFICATION_KEYWORDS,
  CONSUMABLE_TAG_EXCLUSIONS,
  CONSUMABLE_TAG_KEYWORDS,
} from '@/constants/record';

import type {
  ClassifiedItem,
  ConsumableTag,
  MaintenanceCategory,
  MaintenanceRecord,
  MaintenanceTableRow,
} from '@/types/record';

// --- Types for individual record JSON files ---

interface ExtractedItem {
  description: string;
  amount: number | null;
}

interface RecordFile {
  source: string;
  category: string;
  data: {
    date: string;
    totalAmount: number;
    items: ExtractedItem[];
    mileage: number | null;
    shop: string;
    tasks?: string[];
  };
  reviewStatus: string;
}

// --- Translation ---

interface RecordTranslations {
  shops: Record<string, string>;
  descriptions: Record<string, string>;
  tasks: Record<string, string>;
}

let _cachedTranslations: RecordTranslations | null = null;

function loadRecordTranslations(): RecordTranslations {
  if (_cachedTranslations) return _cachedTranslations;
  const filePath = path.resolve(process.cwd(), 'scripts/output-en/translations.json');
  if (!fs.existsSync(filePath)) {
    _cachedTranslations = { shops: {}, descriptions: {}, tasks: {} };
    return _cachedTranslations;
  }
  _cachedTranslations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return _cachedTranslations!;
}

function translateRecord(record: MaintenanceRecord): MaintenanceRecord {
  const t = loadRecordTranslations();
  return {
    ...record,
    shop: t.shops[record.shop] ?? record.shop,
    items: record.items.map((item) => ({
      ...item,
      description: t.descriptions[item.description] ?? item.description,
    })),
    tasks: record.tasks.map((task) => t.tasks[task] ?? task),
  };
}

// --- Data Loading ---

let _cachedRecords: MaintenanceRecord[] | null = null;
let _cachedRecordsEn: MaintenanceRecord[] | null = null;

export function loadAllMaintenanceRecords(locale: string = 'ja'): MaintenanceRecord[] {
  if (locale === 'en' && _cachedRecordsEn && import.meta.env.PROD) return _cachedRecordsEn;
  if (locale !== 'en' && _cachedRecords && import.meta.env.PROD) return _cachedRecords;

  const outputDir = path.resolve(process.cwd(), 'scripts/output');

  if (!fs.existsSync(outputDir)) {
    console.warn('scripts/output/ not found. Run `yarn extract-receipts` first.');
    _cachedRecords = [];
    return _cachedRecords;
  }

  const records: MaintenanceRecord[] = [];

  // Scan category subdirectories
  const entries = fs.readdirSync(outputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const categoryDir = path.join(outputDir, entry.name);
    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.json')).sort();

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(categoryDir, file), 'utf-8');
        const recordFile: RecordFile = JSON.parse(content);

        // Derive ID from filename (e.g. "20090627-0.json" → "mazda-rx7-20090627-0")
        const id = `${entry.name}-${file.replace('.json', '')}`;
        const items = recordFile.data.items.map((item) => classifyItem(item));

        records.push({
          id,
          category: recordFile.category,
          date: recordFile.data.date,
          totalAmount: recordFile.data.totalAmount,
          items,
          mileage: recordFile.data.mileage,
          shop: recordFile.data.shop,
          source: recordFile.source,
          tasks: recordFile.data.tasks ?? [],
        });
      } catch {
        console.warn(`Failed to parse: ${path.join(entry.name, file)}`);
      }
    }
  }

  // Sort by date descending
  records.sort((a, b) => b.date.localeCompare(a.date));

  if (locale === 'en') {
    const translated = records.map(translateRecord);
    _cachedRecordsEn = translated;
    return translated;
  }

  _cachedRecords = records;
  return records;
}

export function getMaintenanceRecord(id: string): MaintenanceRecord | undefined {
  return loadAllMaintenanceRecords().find((r) => r.id === id);
}

// --- Normalization ---

/** Normalize half-width katakana to full-width, and lowercase to uppercase */
function normalizeText(text: string): string {
  // Half-width katakana → full-width katakana
  let normalized = text.replace(/[\uFF65-\uFF9F]/g, (ch) => {
    const halfToFull: Record<string, string> = {
      'ｦ': 'ヲ', 'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
      'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ', 'ｰ': 'ー',
      'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
      'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
      'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
      'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
      'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
      'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
      'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
      'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
      'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
      'ﾜ': 'ワ', 'ﾝ': 'ン', 'ﾞ': '゛', 'ﾟ': '゜', '･': '・',
    };
    return halfToFull[ch] ?? ch;
  });

  // Handle small/big kana variations: パツテリー → バッテリー etc.
  // ツ↔ッ normalization for matching
  normalized = normalized.replace(/ツ/g, 'ッ');

  // Strip prolonged sound marks (ー) and middle dots (・) to match セーフティー ↔ セーフティ, ソレノイド・バルブ ↔ ソレノイドバルブ etc.
  normalized = normalized.replace(/[ー・]/g, '');

  // Lowercase ASCII → uppercase for matching
  normalized = normalized.toUpperCase();

  return normalized;
}

function matchesKeyword(description: string, keyword: string): boolean {
  return normalizeText(description).includes(normalizeText(keyword));
}

// --- Classification ---

function classifyItem(item: ExtractedItem): ClassifiedItem {
  const isExcludedFromConsumable = CONSUMABLE_TAG_EXCLUSIONS.some((ex) => matchesKeyword(item.description, ex));
  const consumableTag = isExcludedFromConsumable ? null : matchConsumableTag(item.description);
  const maintenanceCategory = consumableTag
    ? 'consumable'
    : detectCategoryByKeyword(item.description, isExcludedFromConsumable);

  return {
    description: item.description,
    amount: item.amount,
    maintenanceCategory,
    consumableTag: consumableTag ?? undefined,
  };
}

const INSPECTION_PATTERN = /\d+\s*[ヶケカかヵ]?\s*[月年]\s*(?:定期)?点検/;

/** Items ending with 点検 are just visual inspections, not actual work */
const INSPECTION_ONLY_PATTERN = /点検\s*$/;

function detectCategoryByKeyword(description: string, skipConsumable: boolean = false): MaintenanceCategory {
  // Check formal inspection pattern first (e.g. "24ヶ月点検", "12年点検")
  if (INSPECTION_PATTERN.test(description)) {
    return 'inspection';
  }

  // Check inspection-category keywords (安心点検, 車検整備, etc.) before the 点検 skip
  const inspectionKeywords = CLASSIFICATION_KEYWORDS.inspection ?? [];
  if (inspectionKeywords.some((kw) => matchesKeyword(description, kw))) {
    return 'inspection';
  }

  // "ブレーキパット残量 点検" etc. — just checking, not actual work
  if (INSPECTION_ONLY_PATTERN.test(description)) {
    return 'other';
  }

  // "ブレーキ残量(F2.0mm)" etc. — observation notes, not actual work
  if (matchesKeyword(description, '残量')) {
    return 'other';
  }

  for (const [category, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    if (skipConsumable && category === 'consumable') continue;
    if (keywords.some((kw) => matchesKeyword(description, kw))) {
      return category as MaintenanceCategory;
    }
  }
  return 'other';
}

function matchConsumableTag(description: string): ConsumableTag | null {
  for (const [tag, keywords] of Object.entries(CONSUMABLE_TAG_KEYWORDS)) {
    if (keywords.some((kw) => matchesKeyword(description, kw))) {
      return tag as ConsumableTag;
    }
  }
  return null;
}

// --- Table Row Transform ---

export function toTableRow(record: MaintenanceRecord): MaintenanceTableRow {
  const consumableTags: ConsumableTag[] = [];
  const maintenanceTagSet = new Set<MaintenanceCategory>();

  for (const item of record.items) {
    if (item.maintenanceCategory === 'consumable') {
      if (item.consumableTag && !consumableTags.includes(item.consumableTag)) {
        consumableTags.push(item.consumableTag);
      }
    } else if (item.maintenanceCategory !== 'other') {
      maintenanceTagSet.add(item.maintenanceCategory);
    }
  }

  return {
    id: record.id,
    date: record.date.replaceAll('/', '-'),
    amount: record.totalAmount,
    consumableTags,
    maintenanceTags: [...maintenanceTagSet],
    mileage: record.mileage,
    shop: record.shop,
  };
}
