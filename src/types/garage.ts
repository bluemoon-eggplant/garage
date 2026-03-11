import type { CollectionEntry } from 'astro:content';

export type GarageCollection = CollectionEntry<'garage'>;

export type Garage = GarageCollection & {
  slug: GarageCollection['id']; // Content Layer migration
};
