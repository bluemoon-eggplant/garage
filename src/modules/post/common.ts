import { render } from 'astro:content';

import { getAllEntries, idToSlug } from '@/modules/common';
import { COLLECTIONS, GARAGE_SLUG_TO_CATEGORY, CATEGORIES } from '@/constants/collections';

import type { Post, PostCollection } from '@/types/post';

/**
 * Derive publishDate and category from post id path.
 * id format: "2025/05-25-fd3s" → year=2025, month=05, day=25, garageSlug=fd3s
 */
const enrichPostData = (post: PostCollection): PostCollection => {
  const id = String(post.id);
  const parts = id.split('/');

  // Parse year from path prefix (if present)
  const yearStr = parts.length > 1 ? parts[0] : undefined;
  // Slug part: "05-25-fd3s"
  const slugPart = parts.length > 1 ? parts[1] : parts[0];
  const match = slugPart.match(/^(\d{2})-(\d{2})-(.+)$/);

  if (match) {
    const [, month, day, garageSlug] = match;

    if (!post.data.publishDate && yearStr) {
      post.data.publishDate = new Date(`${yearStr}-${month}-${day}`);
    }

    if (!post.data.category) {
      post.data.category = GARAGE_SLUG_TO_CATEGORY[garageSlug] ?? CATEGORIES[0].name;
    }
  }

  return post;
};

/** Sorted posts. Enriches missing publishDate/category/heroImage from directory path + MDX imports. */
export const getAllPosts = async (): Promise<PostCollection[]> => {
  // Load without sorting first — publishDate may be undefined before enrichment
  const posts = await getAllEntries(COLLECTIONS.POST, { skipSort: true });
  const enriched = posts.map(enrichPostData);

  // Dynamic import to avoid circular deps (common → pages → image-path → metadata)
  const { postFirstImageMap } = await import('./thumbnail');
  for (const post of enriched) {
    if (!post.data.heroImage) {
      const img = postFirstImageMap.get(String(post.id));
      if (img) (post.data as any).heroImage = img;
    }
  }

  // Sort after enrichment
  enriched.sort((a, b) => {
    const da = a.data.updatedDate ?? a.data.publishDate ?? new Date(0);
    const db = b.data.updatedDate ?? b.data.publishDate ?? new Date(0);
    return db.valueOf() - da.valueOf();
  });
  return enriched;
};

export const getPostsWithReadingTimeFromPosts = async (
  posts: PostCollection[]
): Promise<Post[]> => {
  const readingTimePromises = posts.map(async (post) => {
    const { remarkPluginFrontmatter } = await render(post);
    const { readingTime } = remarkPluginFrontmatter;
    return { readingTime };
  });
  const readingTimes = await Promise.all(readingTimePromises);

  // other frontmatter props are in post.data...
  // readingTimes is in post.readingTimes
  const postsWithReadingTimeAndSlug = posts.map((post, index) => ({
    ...idToSlug(post),
    ...readingTimes[index],
  }));

  return postsWithReadingTimeAndSlug;
};

/**
 * Prefer over getAllPosts()
 * From this point Post[] instead of CollectionEntry<'post'>[].
 * My custom type with slug, readingTime, etc.
 */
export const getAllPostsWithReadingTime = async (): Promise<Post[]> =>
  getPostsWithReadingTimeFromPosts(await getAllPosts());
