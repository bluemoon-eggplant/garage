#!/usr/bin/env node

/**
 * Pre-commit check: verify that en.ts has all keys present in ja.ts.
 * Exits with code 1 if any keys are missing.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'src', 'i18n');

function extractKeys(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const keys = [];
  // Match lines like:  'some.key': '...',  or  'some.key': "...",
  const regex = /^\s*'([^']+)'\s*:/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

const jaKeys = extractKeys(resolve(srcDir, 'ja.ts'));
const enKeys = extractKeys(resolve(srcDir, 'en.ts'));

const enKeySet = new Set(enKeys);
const missing = jaKeys.filter((key) => !enKeySet.has(key));

const jaKeySet = new Set(jaKeys);
const extra = enKeys.filter((key) => !jaKeySet.has(key));

let hasError = false;

if (missing.length > 0) {
  console.error(`\x1b[31m[i18n] Missing ${missing.length} key(s) in en.ts:\x1b[0m`);
  missing.forEach((key) => console.error(`  - ${key}`));
  hasError = true;
}

if (extra.length > 0) {
  console.error(`\x1b[33m[i18n] Extra ${extra.length} key(s) in en.ts not in ja.ts:\x1b[0m`);
  extra.forEach((key) => console.error(`  - ${key}`));
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

console.log('\x1b[32m[i18n] Translation keys are in sync.\x1b[0m');
