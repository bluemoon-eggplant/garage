import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/locales';

/**
 * Extract the locale from a URL pathname.
 * "/en/garage/fd3s" → "en"
 * "/garage/fd3s" → "ja" (default)
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as Locale;
  if (LOCALES.includes(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
    return firstSegment;
  }
  return DEFAULT_LOCALE;
}

/**
 * Strip the locale prefix from a pathname.
 * "/en/garage/fd3s" → "/garage/fd3s"
 * "/garage/fd3s" → "/garage/fd3s"
 */
export function stripLocalePrefix(pathname: string): string {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

/**
 * Build a localized path. Default locale gets no prefix.
 * localizedPath('en', '/garage/fd3s') → '/en/garage/fd3s'
 * localizedPath('ja', '/garage/fd3s') → '/garage/fd3s'
 */
export function localizedPath(locale: Locale | string | undefined, basePath: string): string {
  const lang = (locale as Locale) ?? DEFAULT_LOCALE;
  if (lang === DEFAULT_LOCALE) return basePath;
  return `/${lang}${basePath}`;
}

/**
 * Get the alternate-locale version of the current pathname.
 * Used by the language toggle component.
 */
export function getAlternateLocalePath(pathname: string): { locale: Locale; path: string } {
  const currentLocale = getLocaleFromPathname(pathname);
  const targetLocale: Locale = currentLocale === 'ja' ? 'en' : 'ja';
  const basePath = stripLocalePrefix(pathname);
  return {
    locale: targetLocale,
    path: localizedPath(targetLocale, basePath),
  };
}
