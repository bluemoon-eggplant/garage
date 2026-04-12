#!/usr/bin/env node

/**
 * Pre-commit hook: auto-translate changed i18n values from ja.ts to en.ts.
 *
 * Compares staged ja.ts values against the last committed version.
 * For any changed values, calls Claude CLI (haiku) to translate JA→EN,
 * then updates en.ts in-place and stages it.
 *
 * Skipped if ja.ts is not staged, or if no values changed (only key renames
 * are handled by check-translations.mjs which blocks the commit).
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const JA_PATH = 'src/i18n/ja.ts';
const EN_PATH = 'src/i18n/en.ts';
const JA_ABS = resolve(PROJECT_ROOT, JA_PATH);
const EN_ABS = resolve(PROJECT_ROOT, EN_PATH);

// ─── Parse key-value pairs from i18n file ────────────────────────────

function parseI18nFile(content) {
  const entries = new Map();
  // Match:  'some.key': 'value',  or  'some.key': "value",
  const regex = /^\s*'([^']+)'\s*:\s*(?:'([^']*)'|"([^"]*)")/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    entries.set(match[1], match[2] ?? match[3]);
  }
  return entries;
}

// ─── Detect changed values ───────────────────────────────────────────

function getChangedValues() {
  // Check if ja.ts is staged
  let stagedFiles;
  try {
    stagedFiles = execSync('git diff --cached --name-only', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();
  } catch {
    return [];
  }

  if (!stagedFiles.split('\n').includes(JA_PATH)) {
    return [];
  }

  // Get committed (HEAD) version of ja.ts
  let oldContent;
  try {
    oldContent = execSync(`git show HEAD:${JA_PATH}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
  } catch {
    // No previous commit (initial) — treat all as new
    oldContent = '';
  }

  const oldEntries = parseI18nFile(oldContent);
  const newEntries = parseI18nFile(readFileSync(JA_ABS, 'utf-8'));
  const enEntries = parseI18nFile(readFileSync(EN_ABS, 'utf-8'));

  const changed = [];
  for (const [key, newVal] of newEntries) {
    const oldVal = oldEntries.get(key);
    if (oldVal === undefined || oldVal === newVal) continue;

    // Value changed — check if EN still has the old translation (not manually updated)
    if (enEntries.has(key)) {
      changed.push({ key, jaOld: oldVal, jaNew: newVal, enOld: enEntries.get(key) });
    }
  }

  return changed;
}

// ─── Claude CLI translation ──────────────────────────────────────────

function translateBatch(changes) {
  const lines = changes.map(
    (c) => `Key: ${c.key}\nJA old: ${c.jaOld}\nJA new: ${c.jaNew}\nEN old: ${c.enOld}`
  ).join('\n---\n');

  const prompt = `You are translating UI strings for a vehicle/motorcycle garage website.

For each entry below, the Japanese value was changed. Update the English translation to match the new Japanese value.

RULES:
- Output ONLY the result in the exact format: one line per key as  key: value
- No quotes, no extra text, no explanations
- Keep technical terms, proper nouns, and brand names as-is
- Match the tone and brevity of the existing EN translations
- If the JA value is already in English/romaji (like "Blog", "Record"), keep it as-is in EN

${lines}`;

  try {
    const result = execSync('env -u CLAUDECODE claude -p --model haiku --no-session-persistence', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      input: prompt,
      maxBuffer: 1024 * 1024,
      timeout: 30_000,
      env: { ...process.env, CLAUDECODE: undefined },
    });
    return result.trim();
  } catch (err) {
    console.error(`  \x1b[31m[i18n-sync] Claude CLI failed: ${err.message}\x1b[0m`);
    return null;
  }
}

function parseTranslationResult(result) {
  const map = new Map();
  for (const line of result.split('\n')) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      map.set(match[1].trim(), match[2].trim());
    }
  }
  return map;
}

// ─── Update en.ts ────────────────────────────────────────────────────

function updateEnFile(translations) {
  let content = readFileSync(EN_ABS, 'utf-8');

  for (const [key, newValue] of translations) {
    // Escape single quotes in value
    const escaped = newValue.replace(/'/g, "\\'");
    // Replace the value for this key
    const regex = new RegExp(`('${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*:\\s*)(?:'[^']*'|"[^"]*")`, 'g');
    content = content.replace(regex, `$1'${escaped}'`);
  }

  writeFileSync(EN_ABS, content, 'utf-8');
}

// ─── Main ────────────────────────────────────────────────────────────

function main() {
  const changes = getChangedValues();

  if (changes.length === 0) {
    return; // Silent — nothing to do
  }

  console.log(`\x1b[36m[i18n-sync] ${changes.length} changed JA value(s) detected, translating...\x1b[0m`);

  const result = translateBatch(changes);
  if (!result) {
    console.error('\x1b[31m[i18n-sync] Translation failed, EN values not updated.\x1b[0m');
    // Don't block commit — check-translations.mjs will catch key mismatches
    return;
  }

  const translations = parseTranslationResult(result);

  // Validate we got translations for all keys
  const missing = changes.filter((c) => !translations.has(c.key));
  if (missing.length > 0) {
    console.warn(`\x1b[33m[i18n-sync] Missing translations for: ${missing.map((c) => c.key).join(', ')}\x1b[0m`);
  }

  if (translations.size === 0) {
    console.warn('\x1b[33m[i18n-sync] No translations parsed from Claude output.\x1b[0m');
    return;
  }

  updateEnFile(translations);

  // Stage en.ts
  try {
    execSync(`git add "${EN_PATH}"`, { cwd: PROJECT_ROOT });
  } catch {}

  for (const [key, val] of translations) {
    console.log(`  ✓ ${key}: ${val}`);
  }
  console.log(`\x1b[32m[i18n-sync] EN values updated and staged.\x1b[0m`);
}

main();
