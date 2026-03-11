import { getAllEntries, idToSlug } from '@/modules/common';
import { COLLECTIONS } from '@/constants/collections';

import type { Garage, GarageCollection } from '@/types/garage';

/*-------------------------------- getAllGarageItems ------------------------------*/

/** Sort by order field (ascending) */
const sortByOrder = (entries: GarageCollection[]) =>
  entries.slice().sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

/**
 * From this point Garage[] instead of CollectionEntry<'garage'>[].
 * My custom type with slug, etc.
 * Sorted by order field (lower numbers first).
 */
export const getAllGarageItems = async (): Promise<Garage[]> => {
  const entries = await getAllEntries(COLLECTIONS.GARAGE, { skipSort: true });
  const sorted = sortByOrder(entries);
  return sorted.map(idToSlug);
};
