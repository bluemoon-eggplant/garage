import { DEFAULT_METADATA } from '@/constants/metadata';

import DefaultPostHeroImage from '@/assets/images/default/default-post-hero-image.jpg';
import DefaultProjectHeroImage from '@/assets/images/default/default-project-hero-image.jpg';

export const BASE_FOLDERS = {
  POST: 'src/content/post',
  GARAGE: 'src/content/garage',
  RECORD: 'src/content/record',
} as const;

export const COLLECTIONS = {
  POST: 'post',
  GARAGE: 'garage',
} as const;

export const TAGS = [
  'next.js',
  'react',
  'astro',
  'node.js',
  'javascript',
  'css',
  'python',
  'devops',
  'self-hosting',
] as const;

export const CATEGORIES = [
  {
    name: 'mazda-rx7',
    label: 'Mazda RX-7',
    icon: 'mdi:car-sports',
  },
  {
    name: 'eunos-roadstar',
    label: 'Eunos Roadstar',
    icon: 'mdi:car-convertible',
  },
  {
    name: 'rover-mini',
    label: 'Rover Mini',
    icon: 'mdi:car-side',
  },
  {
    name: 'caterham-7',
    label: 'Caterham 7',
    icon: 'mdi:car-side',
  },
  {
    name: 'kawasaki-zx14',
    label: 'Kawasaki ZX-14',
    icon: 'mdi:motorbike',
  },
  {
    name: 'yamaha-renaissa',
    label: 'YAMAHA Renaissa',
    icon: 'mdi:motorbike',
  },
  {
    name: 'yamaha-maxam',
    label: 'Yamaha MAXAM',
    icon: 'mdi:motorbike',
  },
] as const;

/** Garage directory slug → record/post category name */
export const GARAGE_SLUG_TO_CATEGORY: Record<string, string> = {
  fd3s: 'mazda-rx7',
  roadstar: 'eunos-roadstar',
  mini: 'rover-mini',
  caterham7: 'caterham-7',
  zx14: 'kawasaki-zx14',
  renaissa250: 'yamaha-renaissa',
  maxam: 'yamaha-maxam',
};

// use imported images here
export const DEFAULTS_POST = {
  TITLE: DEFAULT_METADATA.title,
  DESCRIPTION: DEFAULT_METADATA.description,
  NO_HERO: false,
  HERO_IMAGE: DefaultPostHeroImage,
  HERO_ALT: 'Hero image',
  DRAFT: false,
  CATEGORY: CATEGORIES[0].name,
  TOC: true,
} as const;

export const DEFAULTS_GARAGE = {
  TITLE: DEFAULT_METADATA.title,
  DESCRIPTION: DEFAULT_METADATA.description,
  NO_HERO: false,
  HERO_IMAGE: DefaultProjectHeroImage,
  HERO_ALT: 'Hero image',
  DRAFT: false,
  CATEGORY: CATEGORIES[0].name,
  TOC: true,
} as const;
