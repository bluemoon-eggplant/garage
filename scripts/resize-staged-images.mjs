#!/usr/bin/env node

import sharp from 'sharp';
import { execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const MAX_WIDTH = 1600;

const files = process.argv.slice(2);
if (files.length === 0) {
  process.exit(0);
}

let resized = 0;

for (const file of files) {
  try {
    const buffer = await readFile(file);
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || metadata.width <= MAX_WIDTH) {
      console.log(`  skip: ${file} (${metadata.width}px)`);
      continue;
    }

    const output = await sharp(buffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .toBuffer();

    await writeFile(file, output);
    execSync(`git add "${file}"`);
    console.log(`  resized: ${file} (${metadata.width}px → ${MAX_WIDTH}px)`);
    resized++;
  } catch (err) {
    console.error(`  error: ${file} - ${err.message}`);
    process.exit(1);
  }
}

if (resized > 0) {
  console.log(`\n${resized} image(s) resized to max ${MAX_WIDTH}px width.`);
}
