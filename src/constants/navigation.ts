import { ROUTES } from '@/constants/routes';

/** Doesn't contain Home nav item. */
export const NAVIGATION_ITEMS = [
  {
    title: 'History',
    path: ROUTES.EXPLORE,
  },
  // {
  //   title: 'Tags',
  //   path: ROUTES.TAGS,
  // },
  // {
  //   title: 'Categories',
  //   path: ROUTES.CATEGORIES,
  // },
  {
    title: 'Garage',
    path: ROUTES.GARAGE,
  },
  {
    title: 'Owner',
    path: ROUTES.OWNER,
  },
  {
    title: 'Gallery',
    path: ROUTES.GALLERY,
  },
  // {
  //   title: 'Links',
  //   path: ROUTES.LINKS,
  // },
  // {
  //   title: 'Resume',
  //   path: ROUTES.RESUME,
  // },
] as const;
