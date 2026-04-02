import * as fs from 'node:fs';
import * as path from 'node:path';

import type { ImageMetadata } from 'astro';

/**
 * Auto-thumbnail: derive first image from MDX imports.
 * Uses fs for MDX reading (avoids Vite circular deps),
 * import.meta.glob only for garage images (no JS deps).
 */

const garageImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/garage/**/_images/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

const imageByFilename = new Map<string, ImageMetadata>();
for (const [p, mod] of Object.entries(garageImageModules)) {
  const filename = p.split('/').pop()?.split('.')[0] || '';
  imageByFilename.set(filename, mod.default);
}

const FIRST_IMPORT_RE = /from\s+['"].*_images\/([^'"]+)['"]/;

function buildPostFirstImageMap(): Map<string, ImageMetadata> {
  const postDir = path.resolve(process.cwd(), 'src/content/post');
  const map = new Map<string, ImageMetadata>();
  if (!fs.existsSync(postDir)) return map;

  for (const yearEntry of fs.readdirSync(postDir, { withFileTypes: true })) {
    if (!yearEntry.isDirectory()) continue;
    const yearPath = path.join(postDir, yearEntry.name);

    for (const slugEntry of fs.readdirSync(yearPath, { withFileTypes: true })) {
      if (!slugEntry.isDirectory()) continue;
      const mdxFile = path.join(yearPath, slugEntry.name, 'index.mdx');
      if (!fs.existsSync(mdxFile)) continue;

      const raw = fs.readFileSync(mdxFile, 'utf-8');
      const m = raw.match(FIRST_IMPORT_RE);
      if (!m) continue;

      const imageFilename = m[1].split('.')[0];
      const img = imageByFilename.get(imageFilename);
      if (img) {
        map.set(`${yearEntry.name}/${slugEntry.name}`, img);
      }
    }
  }
  return map;
}

/** post id → first ImageMetadata from MDX imports */
export const postFirstImageMap = buildPostFirstImageMap();
