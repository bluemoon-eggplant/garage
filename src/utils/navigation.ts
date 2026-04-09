import { NAVIGATION_ITEMS } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { stripLocalePrefix } from '@/utils/i18n';

import type { NavigationItem } from '@/types/constants';

export const getActiveNavItemPath = (routePathname: string): NavigationItem['path'] | undefined => {
  let activeNavItem: NavigationItem | undefined = undefined;

  // Strip locale prefix so /en/record/ matches ROUTES.RECORD
  const basePath = stripLocalePrefix(routePathname);

  // don't highlight home route

  switch (true) {
    case basePath === ROUTES.BLOG:
      activeNavItem = getNavItem(ROUTES.BLOG);
      break;
    case basePath === ROUTES.OWNER:
      activeNavItem = getNavItem(ROUTES.OWNER);
      break;
    case basePath === ROUTES.GALLERY:
      activeNavItem = getNavItem(ROUTES.GALLERY);
      break;
    case basePath === ROUTES.LINKS:
      activeNavItem = getNavItem(ROUTES.LINKS);
      break;
    // unused
    case basePath === ROUTES.RESUME:
      activeNavItem = getNavItem(ROUTES.RESUME);
      break;
    case basePath.startsWith(ROUTES.RECORD):
      activeNavItem = getNavItem(ROUTES.RECORD);
      break;
    // garage individual pages don't highlight nav
    // case basePath.startsWith(ROUTES.GARAGE):
    //   activeNavItem = getNavItem(ROUTES.GARAGE);
    //   break;
    case basePath.startsWith(ROUTES.TAGS):
    case basePath.startsWith(ROUTES.CATEGORIES):
    case basePath.startsWith(ROUTES.EXPLORE):
    case basePath.startsWith(ROUTES.BLOG):
      activeNavItem = getNavItem(ROUTES.EXPLORE);
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
