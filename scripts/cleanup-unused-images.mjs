// Cleanup unused images in _images/ directories
// Used = imported in any MDX file (garage index, blog posts, design page)
// Called from pre-commit hook

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const GARAGE_DIR = path.join(PROJECT_ROOT, 'src/content/garage');
const POST_DIR = path.join(PROJECT_ROOT, 'src/content/post');
const DESIGN_FILE = path.join(PROJECT_ROOT, 'src/pages/design/images.mdx');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const IMPORT_RE = /_images\/([^'"]+)/g;

// --- Collect used image filenames from all MDX files ---

function collectUsedImages() {
  const used = new Set();

  const scanFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    const re = new RegExp(IMPORT_RE.source, IMPORT_RE.flags);
    while ((match = re.exec(content)) !== null) {
      used.add(match[1]);
    }
  };

  // 1. Garage index MDX files
  if (fs.existsSync(GARAGE_DIR)) {
    for (const slug of fs.readdirSync(GARAGE_DIR)) {
      scanFile(path.join(GARAGE_DIR, slug, 'index.mdx'));
    }
  }

  // 2. Blog post MDX files
  if (fs.existsSync(POST_DIR)) {
    for (const year of fs.readdirSync(POST_DIR)) {
      const yearPath = path.join(POST_DIR, year);
      if (!fs.statSync(yearPath).isDirectory()) continue;
      for (const postSlug of fs.readdirSync(yearPath)) {
        scanFile(path.join(yearPath, postSlug, 'index.mdx'));
      }
    }
  }

  // 3. Design page
  scanFile(DESIGN_FILE);

  return used;
}

// --- List all images in _images/ directories ---

function collectAllImages() {
  const allImages = [];

  if (!fs.existsSync(GARAGE_DIR)) return allImages;

  for (const slug of fs.readdirSync(GARAGE_DIR)) {
    const imagesDir = path.join(GARAGE_DIR, slug, '_images');
    if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory()) continue;

    for (const file of fs.readdirSync(imagesDir)) {
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      allImages.push({
        filename: file,
        fullPath: path.join(imagesDir, file),
        relativePath: path.relative(PROJECT_ROOT, path.join(imagesDir, file)),
      });
    }
  }

  return allImages;
}

// --- Main ---

const dryRun = process.argv.includes('--dry-run');

const usedImages = collectUsedImages();
const allImages = collectAllImages();

const unused = allImages.filter((img) => !usedImages.has(img.filename));

if (unused.length === 0) {
  console.log('Pre-commit cleanup: unused images: 0');
  process.exit(0);
}

if (dryRun) {
  console.log(`Unused images (${unused.length}):`);
  for (const img of unused) {
    console.log(`  ${img.relativePath}`);
  }
  process.exit(0);
}

console.log(`Pre-commit cleanup: deleting ${unused.length} unused images`);

for (const img of unused) {
  console.log(`  del ${img.relativePath}`);
  fs.unlinkSync(img.fullPath);
  try {
    execSync(`git rm --cached --quiet "${img.relativePath}"`, { cwd: PROJECT_ROOT });
  } catch {
    // not tracked by git
  }
}

console.log('done');
