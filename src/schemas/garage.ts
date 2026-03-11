import { z } from 'astro:content';

import { DEFAULTS_GARAGE } from '@/constants/collections';

import type { SchemaContext } from 'astro:content';

const { DRAFT, HERO_IMAGE, HERO_ALT, TITLE, DESCRIPTION } = DEFAULTS_GARAGE;

export const garageSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string().default(TITLE),
    description: z.string().default(DESCRIPTION),
    category: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: image().default(HERO_IMAGE),
    heroAlt: z.string().default(HERO_ALT),
    draft: z.boolean().default(DRAFT),
    /** Display order (lower numbers appear first) */
    order: z.number().default(999),
  });
