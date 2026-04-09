#!/usr/bin/env node

/**
 * Pre-commit check: verify that every garage directory with index.mdx
 * also has index.en.mdx.
 * Exits with code 1 if any English translation files are missing.
 */

import { readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const garageDir = resolve(__dirname, '..', 'src', 'content', 'garage');

const entries = readdirSync(garageDir, { withFileTypes: true });
const missing = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const dirPath = resolve(garageDir, entry.name);
  const jaFile = resolve(dirPath, 'index.mdx');
  const enFile = resolve(dirPath, 'index.en.mdx');

  if (existsSync(jaFile) && !existsSync(enFile)) {
    missing.push(entry.name);
  }
}

if (missing.length > 0) {
  console.error(
    `\x1b[31m[i18n] Missing English translation for ${missing.length} garage page(s):\x1b[0m`
  );
  missing.forEach((name) => console.error(`  - src/content/garage/${name}/index.en.mdx`));
  process.exit(1);
}

console.log('\x1b[32m[i18n] All garage pages have English translations.\x1b[0m');
