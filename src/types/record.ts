import type { CollectionEntry } from 'astro:content';

export type RecordCollection = CollectionEntry<'record'>;

export type Record = RecordCollection & {
  slug: RecordCollection['id'];
};
