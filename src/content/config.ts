import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { postSchema } from '@/schemas/post';
import { garageSchema } from '@/schemas/garage';
import { BASE_FOLDERS } from '@/constants/collections';

const { POST, GARAGE } = BASE_FOLDERS;

type GenerateIdFn = Parameters<typeof glob>[0]['generateId'];

/**
 * Format id slug. Remove '/' to avoid catch all [...page].astro route.
 *
 * @example filepath: fd3s/index.mdx -> slug: fd3s
 */
const generateId: GenerateIdFn = ({ entry }: { entry: string }) =>
  entry.split('/')[0];

export const postCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: POST, generateId }),
  schema: postSchema,
});

export const garageCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: GARAGE, generateId }),
  schema: garageSchema,
});

// _schemas folder in collections will be included in type
export const collections = { post: postCollection, garage: garageCollection };
