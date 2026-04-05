// Migrate amount:null items to tasks array
// Keep in both tasks+items if removing would lose consumable tags

import * as fs from 'node:fs';
import * as path from 'node:path';

const OUTPUT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'output');

// From src/constants/record.ts CONSUMABLE_TAG_KEYWORDS
const CONSUMABLE_KEYWORDS = [
  'エンジンオイル', 'オイル交換', 'オイルチケット', 'ROTARY-1', '5W-30', '10W-40',
  'オイルエレメント', 'オイルフィルター交換', 'オイルフィルター',
  'エアエレメント', 'エアークリーナー',
  'スパークプラグ', 'スパーク・プラグ', 'プラグ交換', 'プラグ取替', 'プラグセット', 'CR9EIA',
  '冷却水', 'LLC', 'クーラント',
  'ブレーキフルード', 'ブレーキオイル',
  'バッテリー', 'バツテリー', 'BATTERY',
  'タイヤ交換', 'タイヤ組替', 'タイヤ購入', 'ミシュラン', 'DUNLOP', 'PIRELLI',
  'ミッションオイル', 'デフオイル',
];

const CONSUMABLE_EXCLUSIONS = [
  '漏れ', '洗浄', '点検', 'テスト', '診断', '液補充', 'ご希望', '弱い', '燃焼状態', '汚れ', 'ホースバンド',
];

function matchesConsumable(desc) {
  if (CONSUMABLE_EXCLUSIONS.some(ex => desc.includes(ex))) return false;
  return CONSUMABLE_KEYWORDS.some(kw => desc.includes(kw));
}

function isWorkItem(item) {
  return item.amount === null && !/^（/.test(item.description);
}

let totalFiles = 0;
let modifiedFiles = 0;
let totalMoved = 0;
let totalKeptBoth = 0;

for (const category of fs.readdirSync(OUTPUT_DIR)) {
  const catDir = path.join(OUTPUT_DIR, category);
  if (!fs.statSync(catDir).isDirectory()) continue;

  for (const file of fs.readdirSync(catDir).filter(f => f.endsWith('.json'))) {
    totalFiles++;
    const filePath = path.join(catDir, file);
    const record = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const items = record.data.items || [];
    const workItems = items.filter(isWorkItem);
    if (workItems.length === 0) continue;

    const remainingItems = items.filter(i => !isWorkItem(i));
    const existingTasks = record.data.tasks || [];

    const newTasks = [...existingTasks];
    const keepInItems = [];

    for (const wi of workItems) {
      const desc = wi.description;
      // Add to tasks if not already there
      if (!newTasks.includes(desc)) {
        newTasks.push(desc);
      }

      // Check if this item provides a consumable tag
      if (matchesConsumable(desc)) {
        // Check if any remaining item also provides this tag
        const otherHasTag = remainingItems.some(ri => matchesConsumable(ri.description));
        if (!otherHasTag) {
          keepInItems.push(wi);
          totalKeptBoth++;
        } else {
          totalMoved++;
        }
      } else {
        totalMoved++;
      }
    }

    record.data.tasks = newTasks;
    record.data.items = [...keepInItems, ...remainingItems];

    // Reorder: tasks before items
    const { tasks, items: _items, ...rest } = record.data;
    record.data = { ...rest, tasks, items: _items };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n', 'utf-8');
    modifiedFiles++;
    console.log(`${category}/${file}: +${workItems.length} tasks, kept=${keepInItems.length}`);
  }
}

console.log(`\n--- Done ---`);
console.log(`Files: ${totalFiles} total, ${modifiedFiles} modified`);
console.log(`Moved to tasks only: ${totalMoved}`);
console.log(`Kept in both: ${totalKeptBoth}`);
