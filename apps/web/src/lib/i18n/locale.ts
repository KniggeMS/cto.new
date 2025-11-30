export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

/**
 * Get locale from cookie or fallback to browser language
 */
export function getClientLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'NEXT_LOCALE') {
      const locale = value || 'en';
      return SUPPORTED_LOCALES.includes(locale as Locale) ? locale as Locale : DEFAULT_LOCALE;
    }
  }

  // Fallback to browser language or default
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LOCALES.includes(browserLang as Locale) ? browserLang as Locale : DEFAULT_LOCALE;
}

/**
 * Set locale in cookie
 */
export function setLocaleCookie(locale: Locale): void {
  if (typeof window !== 'undefined') {
    document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Strict`;
  }
}