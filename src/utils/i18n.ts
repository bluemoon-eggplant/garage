import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/locales';

/**
 * Strip the base URL prefix from a pathname.
 * With base="/garage": "/garage/en/blog/slug" → "/en/blog/slug"
 * Without base: "/en/blog/slug" → "/en/blog/slug"
 */
function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base) return pathname;
  return pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
}

/**
 * Prepend base URL to a path (for non-localized static paths).
 * withBase('/images/favicon.png') → '/garage/images/favicon.png'
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}

/**
 * Extract the locale from a URL pathname (base-aware).
 * "/garage/en/garage/fd3s" → "en"
 * "/garage/garage/fd3s" → "ja" (default)
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const withoutBase = stripBase(pathname);
  const segments = withoutBase.split('/').filter(Boolean);
  const firstSegment = segments[0] as Locale;
  if (LOCALES.includes(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
    return firstSegment;
  }
  return DEFAULT_LOCALE;
}

/**
 * Strip base and locale prefix from a pathname.
 * Returns a pure app-relative path (no base, no locale).
 * "/garage/en/blog/slug" → "/blog/slug"
 * "/garage/blog/slug" → "/blog/slug"
 */
export function stripLocalePrefix(pathname: string): string {
  const withoutBase = stripBase(pathname);
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (withoutBase.startsWith(`/${locale}/`)) {
      return withoutBase.slice(locale.length + 1);
    }
    if (withoutBase === `/${locale}`) {
      return '/';
    }
  }
  return withoutBase;
}

/**
 * Build a localized path with base prefix.
 * localizedPath('en', '/blog/slug') → '/garage/en/blog/slug'
 * localizedPath('ja', '/blog/slug') → '/garage/blog/slug'
 */
export function localizedPath(locale: Locale | string | undefined, basePath: string): string {
  const lang = (locale as Locale) ?? DEFAULT_LOCALE;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (lang === DEFAULT_LOCALE) return `${base}${basePath}`;
  return `${base}/${lang}${basePath}`;
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
