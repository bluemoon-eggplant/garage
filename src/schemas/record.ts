import { z } from 'astro:content';

export const recordSchema = () =>
  z.object({
    title: z.string(),
    category: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  });
