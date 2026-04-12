import { ROUTES } from '@/constants/routes';
import { getAllEntries, idToSlug } from '@/modules/common';
import { getCategoryProps } from '@/modules/post/category';

import type { Record, RecordCollection } from '@/types/record';
import type { FilterLink } from '@/types/post';

export const getAllRecords = async (): Promise<Record[]> => {
  const entries: RecordCollection[] = await getAllEntries('record');
  return entries.map((entry) => idToSlug(entry));
};

export const getRecordCategoryLinks = (
  records: Record[],
  pathname?: string
): FilterLink[] => {
  const categories = [...new Set(records.map((r) => r.data.category))];

  const itemLinks = categories.map((category) => {
    const count = records.filter((r) => r.data.category === category).length;
    const displayText = getCategoryProps(category).label;

    const originalHref = `${ROUTES.RECORD_CATEGORIES}${category}`;
    const textWithCount = `${displayText} ${count}`;

    const isActive = originalHref === pathname;
    const href = !isActive ? originalHref : ROUTES.RECORD;

    return { href, text: category, count, textWithCount, isActive };
  });

  return itemLinks;
};
