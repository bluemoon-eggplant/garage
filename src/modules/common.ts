import { getCollection } from 'astro:content';

import { isProd } from '@/utils/environment';
import { isPreviewMode } from '@/utils/preview';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

import type { CollectionEntry, CollectionKey } from 'astro:content';

/*-------------------------------- all entries ------------------------------*/

export interface GetAllEntriesOptions {
  skipSort?: boolean;
  includeDrafts?: boolean;
}

/**
 * Sorts by publishDate desc by default. Newest on top.
 * Omits drafts by default - set by PREVIEW_MODE env var.
 *
 * ONLY place to filter draft posts and projects.
 */
export const getAllEntries = async <T extends CollectionKey>(
  collectionName: T,
  options?: GetAllEntriesOptions
): Promise<CollectionEntry<T>[]> => {
  const { skipSort = false, includeDrafts = isPreviewMode() } = options ?? {};

  const entries = await getCollection<T>(collectionName, ({ data }) => {
    const isProdAndDraft = isProd && data.draft;
    return !isProdAndDraft || includeDrafts;
  });

  if (skipSort) return entries;

  const sortedEntries = sortEntriesByDateDesc(entries);
  return sortedEntries;
};

/*-------------------------- sort by updatedDate or publishDate ------------------------*/

// just for sorting
export const getEntryLastDate = <T extends CollectionKey>(entry: CollectionEntry<T>): Date =>
  entry.data.updatedDate ?? entry.data.publishDate;

export const sortEntriesByDateDesc = <T extends CollectionKey>(entries: CollectionEntry<T>[]) =>
  entries.slice().sort((a, b) => getEntryLastDate(b).valueOf() - getEntryLastDate(a).valueOf());

/*------------------------- lastAccessDate for components -----------------------*/

export interface EntryDates {
  publishDate: Date;
  updatedDate?: Date;
}
export interface EntryDatesResult {
  lastAccessDate: Date;
  isUpdatedDate: boolean;
}

export const getPublishedOrUpdatedDate = ({
  publishDate,
  updatedDate,
}: EntryDates): EntryDatesResult => {
  const result = {
    lastAccessDate: updatedDate ?? publishDate,
    isUpdatedDate: Boolean(updatedDate),
  };

  return result;
};

/*------------------------- for content layer -----------------------*/

export const idToSlug = <T extends { id: unknown }>(item: T): T & { slug: string } => ({
  ...item,
  // Strip year prefix for posts: "2025/05-25-fd3s" → "05-25-fd3s"
  // Strip locale suffix: "fd3s--en" → "fd3s"
  slug: String(item.id).replace(/^\d{4}\//, '').replace(/--en$/, ''),
});

/**
 * Filter collection entries by locale.
 * For default locale (ja): return entries without --en suffix.
 * For 'en': return --en entries where available, fall back to ja entries.
 */
export const filterByLocale = <T extends { id: unknown }>(
  entries: T[],
  locale: Locale = DEFAULT_LOCALE,
  fallbackToDefault = true
): T[] => {
  const jaEntries = entries.filter((e) => !String(e.id).endsWith('--en'));
  if (locale === DEFAULT_LOCALE) return jaEntries;

  const enEntries = entries.filter((e) => String(e.id).endsWith('--en'));
  if (!fallbackToDefault) return enEntries;

  // Merge: use EN where available, fall back to JA
  const enBaseIds = new Set(enEntries.map((e) => String(e.id).replace(/--en$/, '')));
  return jaEntries.map((ja) => {
    const jaId = String(ja.id);
    if (enBaseIds.has(jaId)) {
      return enEntries.find((en) => String(en.id) === `${jaId}--en`)!;
    }
    return ja;
  });
};
