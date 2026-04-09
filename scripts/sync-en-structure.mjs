#!/usr/bin/env node

// Pre-commit: Sync structural parts of JA MDX files to their EN counterparts.
//
// Scope:
//   garage/<slug>/index.mdx  -> index.en.mdx
//   post/<slug>/index.mdx    -> index.en.mdx
//   pages/owner.mdx          -> pages/en/owner.mdx
//
// Synced: frontmatter (garage), imports, <Image> lines, trailing spaces.
// Text translation is NOT handled here.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const RUN_ALL = process.argv.includes('--all');

// ─── File pair detection ──────────────────────────────────────────────

/**
 * Build list of JA→EN file pairs to process.
 * When --all is passed, process every pair regardless of staging.
 */
function getFilePairs() {
  let stagedFiles;
  if (RUN_ALL) {
    try {
      const found = execSync(
        'find src/content/garage -name "index.mdx" -not -name "*.en.mdx" 2>/dev/null; ' +
        'find src/content/post -name "index.mdx" -not -name "*.en.mdx" 2>/dev/null; ' +
        'echo src/pages/owner.mdx',
        { cwd: PROJECT_ROOT, encoding: 'utf-8' }
      ).trim().split('\n').filter(Boolean);
      stagedFiles = found;
    } catch {
      stagedFiles = [];
    }
  } else {
    try {
      stagedFiles = execSync('git diff --cached --name-only', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
      }).trim().split('\n').filter(Boolean);
    } catch {
      stagedFiles = [];
    }
  }

  const pairs = [];

  for (const file of stagedFiles) {
    // Garage: src/content/garage/*/index.mdx
    const garageMatch = file.match(/^src\/content\/garage\/([^/]+)\/index\.mdx$/);
    if (garageMatch) {
      const enFile = file.replace('/index.mdx', '/index.en.mdx');
      const jaAbs = resolve(PROJECT_ROOT, file);
      const enAbs = resolve(PROJECT_ROOT, enFile);
      if (existsSync(enAbs)) {
        pairs.push({ type: 'garage', ja: jaAbs, en: enAbs, jaRel: file, enRel: enFile });
      }
      continue;
    }

    // Post: src/content/post/**/index.mdx
    const postMatch = file.match(/^src\/content\/post\/.+\/index\.mdx$/);
    if (postMatch && !file.endsWith('.en.mdx')) {
      const enFile = file.replace('/index.mdx', '/index.en.mdx');
      const jaAbs = resolve(PROJECT_ROOT, file);
      const enAbs = resolve(PROJECT_ROOT, enFile);
      if (existsSync(enAbs)) {
        pairs.push({ type: 'post', ja: jaAbs, en: enAbs, jaRel: file, enRel: enFile });
      }
      continue;
    }

    // Owner: src/pages/owner.mdx
    if (file === 'src/pages/owner.mdx') {
      const enFile = 'src/pages/en/owner.mdx';
      const jaAbs = resolve(PROJECT_ROOT, file);
      const enAbs = resolve(PROJECT_ROOT, enFile);
      if (existsSync(enAbs)) {
        pairs.push({ type: 'owner', ja: jaAbs, en: enAbs, jaRel: file, enRel: enFile });
      }
      continue;
    }
  }

  return pairs;
}

// ─── Parsers ──────────────────────────────────────────────────────────

/** Split file into { frontmatter, imports, body } */
function parseFile(content) {
  const lines = content.split('\n');

  // Extract frontmatter
  let fmStart = -1, fmEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (fmStart === -1) fmStart = i;
      else { fmEnd = i; break; }
    }
  }

  const frontmatter = fmStart !== -1 && fmEnd !== -1
    ? lines.slice(fmStart, fmEnd + 1)
    : [];
  const afterFm = fmEnd !== -1 ? fmEnd + 1 : 0;

  // Extract import lines (consecutive import/blank lines after frontmatter)
  const imports = [];
  let importEnd = afterFm;
  for (let i = afterFm; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ') || trimmed === '') {
      imports.push(lines[i]);
      importEnd = i + 1;
    } else {
      break;
    }
  }

  const body = lines.slice(importEnd);
  return { frontmatter, imports, body, lines };
}

/** Extract import specifiers: Map<fromPath, fullLine> */
function extractImports(importLines) {
  const map = new Map();
  for (const line of importLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ')) {
      // Use the from-path as key
      const fromMatch = trimmed.match(/from\s+['"]([^'"]+)['"]/);
      if (fromMatch) {
        map.set(fromMatch[1], line);
      } else {
        // Side-effect import
        const sideMatch = trimmed.match(/import\s+['"]([^'"]+)['"]/);
        if (sideMatch) map.set(sideMatch[1], line);
      }
    }
  }
  return map;
}

/** Extract <Image> lines with their src variable names */
function extractImageLines(bodyLines) {
  const results = [];
  for (let i = 0; i < bodyLines.length; i++) {
    const match = bodyLines[i].match(/^\s*<Image\s[^>]*src=\{(\w+)\}/);
    if (match) {
      results.push({ index: i, line: bodyLines[i], varName: match[1] });
    }
  }
  return results;
}

/** Split body into sections by ## headings. Returns [{heading, startIndex, lines}] */
function splitSections(bodyLines) {
  const sections = [];
  let current = { heading: null, startIndex: 0, lines: [] };

  for (let i = 0; i < bodyLines.length; i++) {
    if (bodyLines[i].match(/^##\s/)) {
      sections.push(current);
      current = { heading: bodyLines[i].trim(), startIndex: i, lines: [] };
    } else {
      current.lines.push(bodyLines[i]);
    }
  }
  sections.push(current);
  return sections;
}

// ─── Sync operations ──────────────────────────────────────────────────

function syncFrontmatter(jaParsed, enLines) {
  // Find EN frontmatter boundaries
  let enFmStart = -1, enFmEnd = -1;
  for (let i = 0; i < enLines.length; i++) {
    if (enLines[i].trim() === '---') {
      if (enFmStart === -1) enFmStart = i;
      else { enFmEnd = i; break; }
    }
  }

  if (enFmStart === -1 || enFmEnd === -1) return { lines: enLines, changed: false };

  const before = enLines.slice(0, enFmStart);
  const after = enLines.slice(enFmEnd + 1);
  const newLines = [...before, ...jaParsed.frontmatter, ...after];

  const oldFm = enLines.slice(enFmStart, enFmEnd + 1).join('\n');
  const newFm = jaParsed.frontmatter.join('\n');

  return { lines: newLines, changed: oldFm !== newFm };
}

function syncImports(jaParsed, enLines) {
  const enParsed = parseFile(enLines.join('\n'));
  const jaImports = extractImports(jaParsed.imports);
  const enImports = extractImports(enParsed.imports);

  const missing = [];
  const warnings = [];

  for (const [path, line] of jaImports) {
    if (!enImports.has(path)) {
      missing.push({ path, line });
    }
  }

  for (const [path] of enImports) {
    if (!jaImports.has(path)) {
      warnings.push(path);
    }
  }

  if (missing.length === 0) return { lines: enLines, missing: [], warnings };

  // Find insertion point: after the last import line in EN
  let insertIdx = -1;
  for (let i = 0; i < enLines.length; i++) {
    const trimmed = enLines[i].trim();
    if (trimmed.startsWith('import ')) {
      insertIdx = i;
    }
  }

  if (insertIdx === -1) {
    // No imports in EN — insert after frontmatter
    for (let i = 0; i < enLines.length; i++) {
      if (enLines[i].trim() === '---') insertIdx = i;
    }
    insertIdx += 1; // after second ---
  } else {
    insertIdx += 1; // after last import
  }

  const newLines = [
    ...enLines.slice(0, insertIdx),
    ...missing.map((m) => m.line),
    ...enLines.slice(insertIdx),
  ];

  return { lines: newLines, missing, warnings };
}

function syncImageComponents(jaBody, enLines) {
  const enParsed = parseFile(enLines.join('\n'));
  const enBody = enParsed.body;

  const jaSections = splitSections(jaBody);
  const enSections = splitSections(enBody);

  const enImageVars = new Set();
  for (const line of enBody) {
    const match = line.match(/^\s*<Image\s[^>]*src=\{(\w+)\}/);
    if (match) enImageVars.add(match[1]);
  }

  const insertions = [];

  // Match sections by index (they correspond 1:1 when section count matches)
  const maxSections = Math.min(jaSections.length, enSections.length);
  for (let s = 0; s < maxSections; s++) {
    const jaSec = jaSections[s];
    const enSec = enSections[s];

    // Find Image lines in JA section
    const jaImages = [];
    const allJaLines = [jaSec.heading, ...jaSec.lines].filter(Boolean);
    for (let i = 0; i < allJaLines.length; i++) {
      const match = allJaLines[i].match(/^\s*<Image\s[^>]*src=\{(\w+)\}/);
      if (match && !enImageVars.has(match[1])) {
        jaImages.push({ relOffset: i, line: allJaLines[i], varName: match[1] });
      }
    }

    if (jaImages.length === 0) continue;

    // Calculate absolute position in EN body for insertion
    const enSecAbsStart = enSec.startIndex;
    for (const img of jaImages) {
      // Insert at same relative offset within section, clamped to section length
      const enSecLen = 1 + enSec.lines.length; // heading + content
      const insertRel = Math.min(img.relOffset, enSecLen);
      const absPos = enSecAbsStart + insertRel;
      insertions.push({ absPos, line: img.line, varName: img.varName });
    }
  }

  if (insertions.length === 0) return { lines: enLines, inserted: [] };

  // Convert body positions to full-file positions
  const bodyStartInFile = enLines.length - enParsed.body.length;

  // Sort insertions by position descending to insert from bottom up (avoid offset shift)
  insertions.sort((a, b) => b.absPos - a.absPos);

  const newLines = [...enLines];
  for (const ins of insertions) {
    const filePos = bodyStartInFile + ins.absPos;
    newLines.splice(filePos, 0, ins.line);
  }

  return { lines: newLines, inserted: insertions };
}

function syncTrailingSpaces(jaBody, enLines) {
  const enParsed = parseFile(enLines.join('\n'));
  const enBody = enParsed.body;

  const jaSections = splitSections(jaBody);
  const enSections = splitSections(enBody);

  const bodyStartInFile = enLines.length - enBody.length;
  let modified = 0;
  const newLines = [...enLines];

  const maxSections = Math.min(jaSections.length, enSections.length);
  for (let s = 0; s < maxSections; s++) {
    const jaSec = jaSections[s];
    const enSec = enSections[s];

    // Include heading in the line list
    const jaAll = jaSec.heading ? [jaSec.heading, ...jaSec.lines] : [...jaSec.lines];
    const enAll = enSec.heading ? [enSec.heading, ...enSec.lines] : [...enSec.lines];

    const maxLines = Math.min(jaAll.length, enAll.length);
    for (let i = 0; i < maxLines; i++) {
      const jaLine = jaAll[i];
      const jaHasTrailing = jaLine !== jaLine.trimEnd();

      const enAbsIdx = bodyStartInFile + enSec.startIndex + (enSec.heading ? i : i);
      if (enAbsIdx >= newLines.length) continue;

      const enLine = newLines[enAbsIdx];
      const enHasTrailing = enLine !== enLine.trimEnd();

      if (jaHasTrailing && !enHasTrailing) {
        // Add trailing spaces
        newLines[enAbsIdx] = enLine.trimEnd() + '  ';
        modified++;
      } else if (!jaHasTrailing && enHasTrailing) {
        // Remove extra trailing spaces
        newLines[enAbsIdx] = enLine.trimEnd();
        modified++;
      }
    }
  }

  return { lines: newLines, modified };
}

function checkSectionCount(jaBody, enBody) {
  const jaH2 = jaBody.filter((l) => l.match(/^##\s/)).length;
  const enH2 = enBody.filter((l) => l.match(/^##\s/)).length;
  if (jaH2 !== enH2) {
    return { mismatch: true, ja: jaH2, en: enH2 };
  }
  return { mismatch: false };
}

// ─── Main ─────────────────────────────────────────────────────────────

const pairs = await getFilePairs();

if (pairs.length === 0) {
  if (!RUN_ALL) {
    // Silent exit — no JA MDX files staged
    process.exit(0);
  }
  console.log('[sync] No JA/EN pairs found.');
  process.exit(0);
}

let totalModified = 0;

for (const pair of pairs) {
  const jaContent = readFileSync(pair.ja, 'utf-8');
  let enContent = readFileSync(pair.en, 'utf-8');

  const jaParsed = parseFile(jaContent);
  let enLines = enContent.split('\n');
  const logs = [];
  let fileModified = false;

  // 1. Frontmatter sync (garage only)
  if (pair.type === 'garage') {
    const result = syncFrontmatter(jaParsed, enLines);
    if (result.changed) {
      enLines = result.lines;
      fileModified = true;
      logs.push('  ✓ frontmatter synced');
    }
  }

  // 2. Import sync (garage + post)
  if (pair.type === 'garage' || pair.type === 'post') {
    const result = syncImports(jaParsed, enLines);
    if (result.missing.length > 0) {
      enLines = result.lines;
      fileModified = true;
      const names = result.missing.map((m) => {
        const nameMatch = m.line.match(/import\s+(\w+)/);
        return nameMatch ? nameMatch[1] : m.path;
      });
      logs.push(`  ✓ added ${result.missing.length} missing import(s) (${names.join(', ')})`);
    }
    if (result.warnings.length > 0) {
      for (const w of result.warnings) {
        logs.push(`  ⚠ EN has import not in JA: ${w}`);
      }
    }
  }

  // 3. Image component sync (garage + post)
  if (pair.type === 'garage' || pair.type === 'post') {
    const result = syncImageComponents(jaParsed.body, enLines);
    if (result.inserted.length > 0) {
      enLines = result.lines;
      fileModified = true;
      const names = result.inserted.map((i) => i.varName);
      logs.push(`  ✓ inserted ${result.inserted.length} <Image> component(s) (${names.join(', ')})`);
    }
  }

  // 4. Trailing space sync (all types)
  {
    const jaBodyForTrailing = parseFile(jaContent).body;
    const result = syncTrailingSpaces(jaBodyForTrailing, enLines);
    if (result.modified > 0) {
      enLines = result.lines;
      fileModified = true;
      logs.push(`  ✓ trailing spaces synced (${result.modified} lines)`);
    }
  }

  // 5. Section count check
  {
    const enParsed = parseFile(enLines.join('\n'));
    const check = checkSectionCount(jaParsed.body, enParsed.body);
    if (check.mismatch) {
      logs.push(`  ⚠ section count mismatch: JA=${check.ja}, EN=${check.en} — translation may be needed`);
    }
  }

  // Write and stage
  if (fileModified) {
    const newContent = enLines.join('\n');
    if (DRY_RUN) {
      console.log(`\x1b[36m[sync] ${pair.enRel} (dry-run):\x1b[0m`);
      logs.forEach((l) => console.log(l));
    } else {
      writeFileSync(pair.en, newContent, 'utf-8');
      try {
        execSync(`git add "${pair.enRel}"`, { cwd: PROJECT_ROOT });
      } catch {
        // File may not be trackable
      }
      console.log(`\x1b[36m[sync] ${pair.enRel}:\x1b[0m`);
      logs.forEach((l) => console.log(l));
      console.log('  → re-staged');
    }
    totalModified++;
  } else if (logs.length > 0) {
    // Warnings only
    console.log(`\x1b[36m[sync] ${pair.enRel}:\x1b[0m`);
    logs.forEach((l) => console.log(l));
  }
}

if (totalModified > 0) {
  console.log(`\x1b[32m[sync] ${totalModified} EN file(s) updated.\x1b[0m`);
} else {
  console.log('\x1b[32m[sync] EN structure is in sync.\x1b[0m');
}
