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
 *
 * @example filepath: fd3s/index.mdx -> slug: fd3s
 */
const generateId: GenerateIdFn = ({ entry }: { entry: string }) =>
  entry.split('/')[0];

/**
 * For posts with year subfolders: get the immediate parent folder of index.mdx.
 *
 * @example filepath: 2024/01-20-my-history/index.mdx -> slug: 01-20-my-history
 * @example filepath: 01-20-my-history/index.mdx -> slug: 01-20-my-history
 */
const generatePostId: GenerateIdFn = ({ entry }: { entry: string }) =>
  entry.split('/').at(-2)!;

export const postCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: POST, generateId: generatePostId }),
  schema: postSchema,
});

export const garageCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: GARAGE, generateId }),
  schema: garageSchema,
});

export const recordCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: RECORD, generateId }),
  schema: recordSchema,
});

// _schemas folder in collections will be included in type
export const collections = { post: postCollection, garage: garageCollection, record: recordCollection };
