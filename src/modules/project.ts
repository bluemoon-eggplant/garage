import { getAllEntries, idToSlug } from '@/modules/common';
import { COLLECTIONS } from '@/constants/collections';

import type { Project, ProjectCollection } from '@/types/project';

/*-------------------------------- getAllProjects ------------------------------*/

/** Sort by order field (ascending) */
const sortByOrder = (entries: ProjectCollection[]) =>
  entries.slice().sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

/**
 * From this point Project[] instead of CollectionEntry<'project'>[].
 * My custom type with slug, etc.
 * Sorted by order field (lower numbers first).
 */
export const getAllProjects = (): Promise<Project[]> =>
  getAllEntries(COLLECTIONS.PROJECT, { skipSort: true }).then((entries) =>
    sortByOrder(entries).map(idToSlug)
  );
