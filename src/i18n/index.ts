import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const LANGUAGES = {
  en: 'en',
  ar: 'ar',
} as const;

export type Language = keyof typeof LANGUAGES;

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: LANGUAGES.en,
  fallbackLng: LANGUAGES.en,
  interpolation: { escapeValue: false },
});

export default i18n;
