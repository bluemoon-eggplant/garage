import { ja, type TranslationKey } from './ja';
import { en } from './en';
import { DEFAULT_LOCALE, type Locale } from './locales';

const translations: Record<Locale, Record<TranslationKey, string>> = { ja, en };

/**
 * Get a translated string for the given locale and key.
 * Falls back to default locale (ja) if key is missing.
 */
export function t(locale: Locale | string | undefined, key: TranslationKey): string {
  const lang = (locale as Locale) ?? DEFAULT_LOCALE;
  return translations[lang]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}

/**
 * Create a bound translator for a specific locale.
 * Usage in Astro components: const t = useTranslations(Astro.currentLocale);
 */
export function useTranslations(locale: Locale | string | undefined) {
  const lang = (locale as Locale) ?? DEFAULT_LOCALE;
  return (key: TranslationKey) => t(lang, key);
}

export { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';
export type { TranslationKey } from './ja';
