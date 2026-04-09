#!/usr/bin/env node

/**
 * Extract all unique Japanese strings from record JSON files
 * for translation. Outputs to scripts/output-en/strings-to-translate.json
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, 'output');
const outFile = resolve(__dirname, 'output-en/strings-to-translate.json');

const shops = new Set();
const descriptions = new Set();
const tasks = new Set();

const entries = readdirSync(outputDir, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const catDir = join(outputDir, entry.name);
  const files = readdirSync(catDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const content = JSON.parse(readFileSync(join(catDir, file), 'utf-8'));
    if (content.data.shop) shops.add(content.data.shop);
    for (const item of content.data.items || []) {
      if (item.description) descriptions.add(item.description);
    }
    for (const task of content.data.tasks || []) {
      tasks.add(task);
    }
  }
}

const result = {
  shops: [...shops].sort(),
  descriptions: [...descriptions].sort(),
  tasks: [...tasks].sort(),
};

writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Extracted: ${result.shops.length} shops, ${result.descriptions.length} descriptions, ${result.tasks.length} tasks`);
console.log(`Written to: ${outFile}`);
