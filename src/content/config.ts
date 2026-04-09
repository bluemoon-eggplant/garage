import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { postSchema } from '@/schemas/post';
import { garageSchema } from '@/schemas/garage';
import { recordSchema } from '@/schemas/record';
import { BASE_FOLDERS } from '@/constants/collections';

const { POST, GARAGE, RECORD } = BASE_FOLDERS;

type GenerateIdFn = Parameters<typeof glob>[0]['generateId'];

/**
 * Format id slug. Remove '/' to avoid catch all [...page].astro route.
 * Supports locale-suffixed files: index.en.mdx → "fd3s--en"
 *
 * @example filepath: fd3s/index.mdx -> slug: fd3s
 * @example filepath: fd3s/index.en.mdx -> slug: fd3s--en
 */
const generateId: GenerateIdFn = ({ entry }: { entry: string }) => {
  const dir = entry.split('/')[0];
  const isEn = entry.endsWith('.en.mdx');
  return isEn ? `${dir}--en` : dir;
};

/**
 * For posts with year subfolders: keep year/slug as id so we can derive publishDate.
 * Supports locale-suffixed files: index.en.mdx → "2025/05-25-fd3s--en"
 *
 * @example filepath: 2025/05-25-fd3s/index.mdx -> id: 2025/05-25-fd3s
 * @example filepath: 2025/05-25-fd3s/index.en.mdx -> id: 2025/05-25-fd3s--en
 */
const generatePostId: GenerateIdFn = ({ entry }: { entry: string }) => {
  const parts = entry.split('/');
  const filename = parts.pop()!;
  const isEn = filename.endsWith('.en.mdx');
  const basePath = parts.join('/');
  return isEn ? `${basePath}--en` : basePath;
};

export const postCollection = defineCollection({
  loader: glob({ pattern: '**/index{,.en}.mdx', base: POST, generateId: generatePostId }),
  schema: postSchema,
});

export const garageCollection = defineCollection({
  loader: glob({ pattern: '**/index{,.en}.mdx', base: GARAGE, generateId }),
  schema: garageSchema,
});

export const recordCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: RECORD, generateId }),
  schema: recordSchema,
});

// _schemas folder in collections will be included in type
export const collections = { post: postCollection, garage: garageCollection, record: recordCollection };
