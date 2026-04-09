import { getAllEntries, idToSlug, filterByLocale } from '@/modules/common';
import { COLLECTIONS } from '@/constants/collections';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

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
export const getAllGarageItems = async (locale: Locale = DEFAULT_LOCALE): Promise<Garage[]> => {
  const entries = await getAllEntries(COLLECTIONS.GARAGE, { skipSort: true });
  const localeEntries = filterByLocale(entries, locale);
  const sorted = sortByOrder(localeEntries);
  return sorted.map(idToSlug);
};
