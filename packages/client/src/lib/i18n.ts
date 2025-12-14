/**
 * i18n Configuration
 *
 * Internationalization setup using i18next with:
 * - Browser language detection
 * - HTTP backend for loading translations
 * - React integration via react-i18next
 *
 * Supported languages: EN, FR, ES, DE
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  // Future languages
  // { code: 'es', name: 'Español', flag: '🇪🇸' },
  // { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

// Local storage key for language preference
const LANGUAGE_KEY = 'rsm_language';

/**
 * Get stored language preference
 */
export function getStoredLanguage(): string | null {
  return localStorage.getItem(LANGUAGE_KEY);
}

/**
 * Store language preference
 */
export function setStoredLanguage(lang: string): void {
  localStorage.setItem(LANGUAGE_KEY, lang);
}

// Initialize i18n
i18n
  // Load translations via HTTP
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    // Default language
    fallbackLng: 'en',

    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,

    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Detection configuration
    detection: {
      // Order of detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // Local storage key
      lookupLocalStorage: LANGUAGE_KEY,
    },

    // React configuration
    react: {
      // Wait for translations before rendering
      useSuspense: true,
    },

    // Interpolation configuration
    interpolation: {
      // React already escapes values
      escapeValue: false,
      // Format functions
      format: (value, format, lng) => {
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'EUR',
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        return value;
      },
    },
  });

export default i18n;
