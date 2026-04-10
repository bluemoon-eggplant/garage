#!/usr/bin/env node

// Translate JA MDX files to EN using Claude Code CLI (claude -p).
//
// Usage:
//   node scripts/translate-en.mjs                  # staged JA files
//   node scripts/translate-en.mjs --all            # all JA files
//   node scripts/translate-en.mjs --file <path>    # specific file
//   node scripts/translate-en.mjs --since <commit> # changes since commit
//   node scripts/translate-en.mjs --dry-run        # preview only
//   node scripts/translate-en.mjs --quality        # use sonnet (default: haiku)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const RUN_ALL = process.argv.includes('--all');
const QUALITY = process.argv.includes('--quality');

const fileIdx = process.argv.indexOf('--file');
const FILE_TARGET = fileIdx !== -1 ? process.argv[fileIdx + 1] : null;

const sinceIdx = process.argv.indexOf('--since');
const SINCE_COMMIT = sinceIdx !== -1 ? process.argv[sinceIdx + 1] : null;

const MODEL = QUALITY ? 'sonnet' : 'haiku';

// ─── File pair detection ──────────────────────────────────────────────

function getFilePairs() {
  let files;

  if (FILE_TARGET) {
    // Single file mode
    const rel = FILE_TARGET.startsWith('src/') ? FILE_TARGET : FILE_TARGET;
    files = [rel];
  } else if (RUN_ALL) {
    try {
      files = execSync(
        'find src/content/garage -name "index.mdx" -not -name "*.en.mdx" 2>/dev/null; ' +
        'find src/content/post -name "index.mdx" -not -name "*.en.mdx" 2>/dev/null; ' +
        'echo src/pages/owner.mdx',
        { cwd: PROJECT_ROOT, encoding: 'utf-8' }
      ).trim().split('\n').filter(Boolean);
    } catch {
      files = [];
    }
  } else if (SINCE_COMMIT) {
    try {
      files = execSync(`git diff ${SINCE_COMMIT}..HEAD --name-only`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
      }).trim().split('\n').filter(Boolean);
    } catch {
      files = [];
    }
  } else {
    // Default: staged files
    try {
      files = execSync('git diff --cached --name-only', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
      }).trim().split('\n').filter(Boolean);
    } catch {
      files = [];
    }
  }

  const pairs = [];

  for (const file of files) {
    // Garage
    if (file.match(/^src\/content\/garage\/[^/]+\/index\.mdx$/)) {
      const enFile = file.replace('/index.mdx', '/index.en.mdx');
      pairs.push({ type: 'garage', jaRel: file, enRel: enFile });
      continue;
    }
    // Post
    if (file.match(/^src\/content\/post\/.+\/index\.mdx$/) && !file.endsWith('.en.mdx')) {
      const enFile = file.replace('/index.mdx', '/index.en.mdx');
      pairs.push({ type: 'post', jaRel: file, enRel: enFile });
      continue;
    }
    // Owner
    if (file === 'src/pages/owner.mdx') {
      pairs.push({ type: 'owner', jaRel: file, enRel: 'src/pages/en/owner.mdx' });
      continue;
    }
  }

  return pairs;
}

// ─── Parse ────────────────────────────────────────────────────────────

function parseFile(content) {
  const lines = content.split('\n');
  let fmStart = -1, fmEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (fmStart === -1) fmStart = i;
      else { fmEnd = i; break; }
    }
  }
  const frontmatter = fmStart !== -1 && fmEnd !== -1 ? lines.slice(fmStart, fmEnd + 1) : [];
  const afterFm = fmEnd !== -1 ? fmEnd + 1 : 0;

  const imports = [];
  let importEnd = afterFm;
  for (let i = afterFm; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ') || trimmed === '' || trimmed.startsWith('{/*')) {
      imports.push(lines[i]);
      importEnd = i + 1;
    } else {
      break;
    }
  }

  const body = lines.slice(importEnd);
  return { frontmatter, imports, body };
}

// ─── Prompt building ──────────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `You are translating a Japanese MDX file to English for a personal vehicle/motorcycle garage blog.

RULES:
1. Output ONLY the complete translated MDX file. No explanations, no markdown code fences, no commentary.
2. Preserve ALL of the following EXACTLY as-is (do not translate or modify):
   - All import statements and export statements
   - All JSX component tags and their prop syntax: <Image>, <SpecTable>, <Figure>, <GarageJumpLinks>, <Link>
   - Component props like {...IMAGE_SIZES.FIXED.MDX_LG}, src={VarName}, category="..."
   - Blank lines and overall line structure
   - Trailing two spaces at end of lines (used for <br> in markdown)
3. TRANSLATE the following:
   - Markdown headings (# ## ### etc.)
   - Paragraph prose text
   - Bullet list items (lines starting with * or -)
   - caption="" attribute values inside <Figure> tags
   - SpecTable items: translate the label (first element of each pair), keep values as-is
   - Internal link text like [テキスト](url) - translate the text, keep the url but add /en/ prefix for EN paths
4. Translation style:
   - Natural, conversational English - this is a personal blog, keep the author's voice
   - Keep Japanese proper nouns (place names, brand names) as-is or romanized
   - Car/motorcycle technical terms should use standard English terminology
   - Keep model names, part numbers, and measurements unchanged
5. The output must be valid MDX.`;

const TYPE_INSTRUCTIONS = {
  garage: '\nFrontmatter (between --- markers): Do NOT translate. It is synced by a separate script.',
  post: '\nFrontmatter: Translate the "title" and "description" values to English. Keep all other fields unchanged.',
  owner: '\nFrontmatter: Do NOT translate (already English). Import paths: keep exactly as-is from the existing EN file.',
};

function buildSystemPrompt(type) {
  return SYSTEM_PROMPT_BASE + (TYPE_INSTRUCTIONS[type] || '');
}

function buildUserPrompt(jaContent, enContent, type) {
  let prompt = `=== JAPANESE SOURCE (index.mdx) ===\n${jaContent}\n\n`;

  if (enContent) {
    prompt += `=== EXISTING ENGLISH TRANSLATION (index.en.mdx) ===\n${enContent}\n\n`;
    prompt += 'Update the English translation to match the current Japanese source. ' +
      'Keep existing translations for unchanged sections. Translate new or changed sections fresh.\n\n';
  } else {
    prompt += '=== EXISTING ENGLISH TRANSLATION ===\nNo existing translation — create new.\n\n';
  }

  prompt += 'Output the complete translated English MDX file:';
  return prompt;
}

// ─── Owner special handling ───────────────────────────────────────────

function buildOwnerPrompt(jaContent, enContent) {
  const jaParsed = parseFile(jaContent);
  const jaBody = jaParsed.body.join('\n');

  if (!enContent) {
    return { systemPrompt: buildSystemPrompt('owner'), userPrompt: buildUserPrompt(jaContent, null, 'owner'), enHeader: null };
  }

  const enParsed = parseFile(enContent);
  const enHeader = [...enParsed.frontmatter, '', ...enParsed.imports].join('\n');
  const enBody = enParsed.body.join('\n');

  const systemPrompt = buildSystemPrompt('owner') +
    '\n\nIMPORTANT: Output ONLY the body content (after imports/exports). ' +
    'Do NOT include frontmatter or import statements — they will be prepended separately.';

  let userPrompt = `=== JAPANESE BODY ===\n${jaBody}\n\n`;
  if (enBody.trim()) {
    userPrompt += `=== EXISTING ENGLISH BODY ===\n${enBody}\n\n`;
    userPrompt += 'Update the English body to match. Keep existing translations for unchanged parts.\n\n';
  }
  userPrompt += 'Output the translated body content only (no frontmatter, no imports):';

  return { systemPrompt, userPrompt, enHeader };
}

// ─── Claude CLI invocation ────────────────────────────────────────────

function callClaude(systemPrompt, userPrompt, model) {
  const fullInput = userPrompt;

  // Write system prompt to temp file to avoid shell escaping issues
  const tmpSystem = resolve(PROJECT_ROOT, '.claude/.tmp-system-prompt');
  writeFileSync(tmpSystem, systemPrompt, 'utf-8');

  const cmd = `env -u CLAUDECODE claude -p --model ${model} --no-session-persistence --system-prompt "$(cat ${tmpSystem})"`;

  try {
    const start = Date.now();
    const result = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      input: fullInput,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 180_000,
      env: { ...process.env, CLAUDECODE: undefined },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // Cleanup temp file
    try { execSync(`rm -f ${tmpSystem}`); } catch {}

    return { success: true, output: result, elapsed };
  } catch (err) {
    try { execSync(`rm -f ${tmpSystem}`); } catch {}
    return { success: false, error: err.stderr || err.message, elapsed: '0' };
  }
}

// ─── Output parsing & validation ──────────────────────────────────────

function parseClaudeOutput(raw) {
  let output = raw;

  // Strip markdown code fences if present
  output = output.replace(/^```(?:mdx|markdown|md)?\n/m, '').replace(/\n```\s*$/m, '');

  // Trim leading/trailing whitespace but preserve internal structure
  output = output.trim() + '\n';

  return output;
}

function validateOutput(output, jaContent, type) {
  const warnings = [];

  if (type !== 'owner_body') {
    // Check frontmatter
    const fmCount = (output.match(/^---$/gm) || []).length;
    if (fmCount < 2) {
      return { valid: false, error: 'Missing frontmatter delimiters' };
    }
  }

  // Check section count
  const jaSections = (jaContent.match(/^## /gm) || []).length;
  const enSections = (output.match(/^## /gm) || []).length;
  if (jaSections !== enSections) {
    warnings.push(`section count: JA=${jaSections}, EN=${enSections}`);
  }

  // Check Image tag count
  const jaImages = (jaContent.match(/<Image /g) || []).length;
  const enImages = (output.match(/<Image /g) || []).length;
  if (jaImages !== enImages) {
    warnings.push(`Image count: JA=${jaImages}, EN=${enImages}`);
  }

  return { valid: true, warnings };
}

// ─── Main ─────────────────────────────────────────────────────────────

function main() {
  const pairs = getFilePairs();

  if (pairs.length === 0) {
    console.log('\x1b[33m[translate] No JA files to translate.\x1b[0m');
    process.exit(0);
  }

  let translated = 0;

  for (const pair of pairs) {
    const jaAbs = resolve(PROJECT_ROOT, pair.jaRel);
    const enAbs = resolve(PROJECT_ROOT, pair.enRel);

    if (!existsSync(jaAbs)) {
      console.log(`\x1b[33m[translate] ${pair.jaRel}: JA file not found, skipping.\x1b[0m`);
      continue;
    }

    const jaContent = readFileSync(jaAbs, 'utf-8');
    const enExists = existsSync(enAbs);
    const enContent = enExists ? readFileSync(enAbs, 'utf-8') : null;

    if (DRY_RUN) {
      console.log(`\x1b[36m[translate] ${pair.enRel} (dry-run):\x1b[0m`);
      console.log(`  would translate with ${MODEL}`);
      console.log(`  EN file ${enExists ? 'exists (update)' : 'does not exist (create new)'}`);
      translated++;
      continue;
    }

    console.log(`\x1b[36m[translate] ${pair.enRel}:\x1b[0m`);

    let systemPrompt, userPrompt, enHeader = null;

    if (pair.type === 'owner' && enContent) {
      const ownerPrompt = buildOwnerPrompt(jaContent, enContent);
      systemPrompt = ownerPrompt.systemPrompt;
      userPrompt = ownerPrompt.userPrompt;
      enHeader = ownerPrompt.enHeader;
    } else {
      systemPrompt = buildSystemPrompt(pair.type);
      userPrompt = buildUserPrompt(jaContent, enContent, pair.type);
    }

    // Call Claude
    const result = callClaude(systemPrompt, userPrompt, MODEL);

    if (!result.success) {
      console.log(`  \x1b[31m✗ failed: ${result.error}\x1b[0m`);
      continue;
    }

    let output = parseClaudeOutput(result.output);

    // For owner body-only mode, prepend the existing EN header
    if (enHeader !== null) {
      output = enHeader + '\n' + output;
    }

    // Validate
    const validation = validateOutput(output, jaContent, enHeader !== null ? 'owner_body' : pair.type);

    if (!validation.valid) {
      // Retry once
      console.log(`  ⚠ validation failed (${validation.error}), retrying...`);
      const retry = callClaude(
        systemPrompt + '\n\nCRITICAL: Output the raw MDX file content only. No code fences. No commentary.',
        userPrompt,
        MODEL
      );
      if (retry.success) {
        output = parseClaudeOutput(retry.output);
        if (enHeader !== null) {
          output = enHeader + '\n' + output;
        }
        const v2 = validateOutput(output, jaContent, enHeader !== null ? 'owner_body' : pair.type);
        if (!v2.valid) {
          console.log(`  \x1b[31m✗ retry also failed: ${v2.error}, skipping.\x1b[0m`);
          continue;
        }
        if (v2.warnings) {
          for (const w of v2.warnings) console.log(`  ⚠ ${w}`);
        }
      } else {
        console.log(`  \x1b[31m✗ retry failed: ${retry.error}, skipping.\x1b[0m`);
        continue;
      }
    } else {
      if (validation.warnings) {
        for (const w of validation.warnings) console.log(`  ⚠ ${w}`);
      }
    }

    // Write file
    writeFileSync(enAbs, output, 'utf-8');
    console.log(`  ✓ translated (${MODEL}, ${result.elapsed}s)`);

    // Stage
    try {
      execSync(`git add "${pair.enRel}"`, { cwd: PROJECT_ROOT });
      console.log('  → written and staged');
    } catch {
      console.log('  → written (staging failed)');
    }

    translated++;
  }

  if (translated > 0) {
    console.log(`\x1b[32m[translate] ${translated} EN file(s) translated.\x1b[0m`);
  }
}

main();
