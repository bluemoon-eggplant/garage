import { NAVIGATION_ITEMS } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';

import type { NavigationItem } from '@/types/constants';

export const getActiveNavItemPath = (routePathname: string): NavigationItem['path'] | undefined => {
  let activeNavItem: NavigationItem | undefined = undefined;

  // don't highlight home route

  switch (true) {
    case routePathname === ROUTES.BLOG:
      activeNavItem = getNavItem(ROUTES.BLOG);
      break;
    case routePathname === ROUTES.OWNER:
      activeNavItem = getNavItem(ROUTES.OWNER);
      break;
    case routePathname === ROUTES.GALLERY:
      activeNavItem = getNavItem(ROUTES.GALLERY);
      break;
    case routePathname === ROUTES.LINKS:
      activeNavItem = getNavItem(ROUTES.LINKS);
      break;
    // unused
    case routePathname === ROUTES.RESUME:
      activeNavItem = getNavItem(ROUTES.RESUME);
      break;
    case routePathname.startsWith(ROUTES.GARAGE):
      activeNavItem = getNavItem(ROUTES.GARAGE);
      break;
    case routePathname.startsWith(ROUTES.TAGS):
    case routePathname.startsWith(ROUTES.CATEGORIES):
    case routePathname.startsWith(ROUTES.EXPLORE):
      activeNavItem = getNavItem(ROUTES.EXPLORE);
      break;
    case !routePathname.startsWith(ROUTES.TAGS) &&
      !routePathname.startsWith(ROUTES.CATEGORIES) &&
      !routePathname.startsWith(ROUTES.EXPLORE) &&
      routePathname.startsWith(ROUTES.BLOG):
      activeNavItem = getNavItem(ROUTES.BLOG);
      break;

    default:
      activeNavItem = undefined;
      break;
  }

  const activeNavItemPath = activeNavItem?.path;

  return activeNavItemPath;
};

export const getNavItem = (path: string): NavigationItem | undefined =>
  NAVIGATION_ITEMS.find((navItem) => navItem.path === path);
