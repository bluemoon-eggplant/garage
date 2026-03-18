/**
 * 整備領収書PDF → 構造化JSON 抽出スクリプト
 *
 * 使い方:
 *   1. GEMINI_API_KEY を .env に設定
 *   2. scripts/input/<category>/ にPDFを配置
 *   3. npx tsx scripts/extract-receipts.ts
 *
 * 出力: scripts/output/<category>/<YYYYMMDD>-<index>.json (1明細1ファイル)
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- Types ---

interface ExtractedItem {
  description: string;
  amount: number | null;
}

interface ExtractedData {
  date: string;
  totalAmount: number;
  items: ExtractedItem[];
  mileage: number | null;
  shop: string;
}

interface RecordFile {
  source: string;
  category: string;
  data: ExtractedData;
  reviewStatus: 'pending' | 'confirmed';
}

// --- Config ---

const VALID_CATEGORIES = [
  'mazda-rx7',
  'eunos-roadstar',
  'rover-mini',
  'caterham-7',
  'kawasaki-zx14',
  'yamaha-renaissa',
  'yamaha-maxam',
];

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const INPUT_DIR = path.join(SCRIPTS_DIR, 'input');
const OUTPUT_DIR = path.join(SCRIPTS_DIR, 'output');

// Gemini free tier: 15 RPM
const RATE_LIMIT_DELAY_MS = 4500;

const EXTRACTION_PROMPT = `この画像は自動車またはバイクの整備・修理に関する領収書・明細書・請求書です。
以下の情報をJSON形式で抽出してください。

必ず以下の形式で返してください（JSONのみ、説明不要）:

{
  "date": "YYYY/MM/DD",
  "totalAmount": 数値（税込合計金額。記載がなければ個別金額の合計）,
  "items": [
    { "description": "作業内容や部品名", "amount": 数値またはnull }
  ],
  "mileage": 数値またはnull（走行距離km。記載がなければnull）,
  "shop": "店名・整備工場名"
}

注意:
- 金額は数値のみ（¥や,は除去）
- 日付が和暦の場合は西暦に変換
- 複数の作業項目がある場合はitemsに全て列挙
- 読み取れない項目はnullを使用`;

// --- Main ---

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY が .env に設定されていません');
    console.error('Google AI Studio (https://aistudio.google.com/apikey) でAPIキーを取得してください');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Collect already-processed sources from existing output files
  const processedSources = collectProcessedSources();

  // Discover PDFs
  const pdfFiles = discoverPDFs();
  if (pdfFiles.length === 0) {
    console.log('PDFファイルが見つかりません。');
    console.log(`${INPUT_DIR}/<category>/ にPDFを配置してください。`);
    console.log(`有効なカテゴリ: ${VALID_CATEGORIES.join(', ')}`);
    return;
  }

  // Filter out already-processed
  const toProcess = pdfFiles.filter((f) => !processedSources.has(f.relativePath));
  console.log(`PDF: ${pdfFiles.length}件 (未処理: ${toProcess.length}件, 処理済: ${pdfFiles.length - toProcess.length}件)`);

  if (toProcess.length === 0) {
    console.log('全て処理済みです。');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const file = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${file.relativePath} ...`);

    try {
      const data = await extractFromPDF(model, file.absolutePath);

      // Write individual JSON file
      const record: RecordFile = {
        source: file.relativePath,
        category: file.category,
        data,
        reviewStatus: 'pending',
      };
      const outputPath = writeRecordFile(record);
      console.log(`  → ${data.date} / ¥${data.totalAmount.toLocaleString()} / ${data.shop}`);
      console.log(`  → ${outputPath}`);
      successCount++;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`  → Error: ${errorMsg}`);
      errorCount++;
    }

    // Rate limiting (skip delay after last item)
    if (i < toProcess.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  console.log('\n--- 完了 ---');
  console.log(`成功: ${successCount}件 / エラー: ${errorCount}件`);
}

// --- Functions ---

interface PDFFile {
  absolutePath: string;
  relativePath: string;
  category: string;
}

function discoverPDFs(): PDFFile[] {
  const files: PDFFile[] = [];

  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    return files;
  }

  const categories = fs.readdirSync(INPUT_DIR, { withFileTypes: true });
  for (const dir of categories) {
    if (!dir.isDirectory()) continue;
    if (!VALID_CATEGORIES.includes(dir.name)) {
      console.warn(`Warning: 不明なカテゴリ "${dir.name}" をスキップ (有効: ${VALID_CATEGORIES.join(', ')})`);
      continue;
    }

    const categoryDir = path.join(INPUT_DIR, dir.name);
    const entries = fs.readdirSync(categoryDir);
    for (const entry of entries) {
      if (!entry.toLowerCase().endsWith('.pdf')) continue;
      files.push({
        absolutePath: path.join(categoryDir, entry),
        relativePath: `input/${dir.name}/${entry}`,
        category: dir.name,
      });
    }
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return files;
}

async function extractFromPDF(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  pdfPath: string
): Promise<ExtractedData> {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Data = pdfBuffer.toString('base64');

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data,
      },
    },
    EXTRACTION_PROMPT,
  ]);

  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`JSONを抽出できませんでした。応答: ${text.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as ExtractedData;

  if (!parsed.date || typeof parsed.totalAmount !== 'number') {
    throw new Error(`必須フィールドが不足: date=${parsed.date}, totalAmount=${parsed.totalAmount}`);
  }

  return parsed;
}

function writeRecordFile(record: RecordFile): string {
  const categoryDir = path.join(OUTPUT_DIR, record.category);
  fs.mkdirSync(categoryDir, { recursive: true });

  const dateStr = record.data.date.replace(/\//g, '');

  // Find next available index for this category+date
  const existing = fs.readdirSync(categoryDir);
  let index = 0;
  while (existing.includes(`${dateStr}-${index}.json`)) {
    index++;
  }

  const filename = `${dateStr}-${index}.json`;
  const filePath = path.join(categoryDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');

  return `output/${record.category}/${filename}`;
}

function collectProcessedSources(): Set<string> {
  const sources = new Set<string>();

  if (!fs.existsSync(OUTPUT_DIR)) return sources;

  const categories = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
  for (const dir of categories) {
    if (!dir.isDirectory()) continue;

    const categoryDir = path.join(OUTPUT_DIR, dir.name);
    const files = fs.readdirSync(categoryDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = fs.readFileSync(path.join(categoryDir, file), 'utf-8');
        const record = JSON.parse(content) as RecordFile;
        if (record.source) sources.add(record.source);
      } catch {
        // skip invalid files
      }
    }
  }

  return sources;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
