import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DevSettings, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const LANGUAGE_STORAGE_KEY = 'appLanguage';

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

export const reloadApp = () => {
  setTimeout(() => {
    try {
      RNRestart.restart();
    } catch (e) {
      try {
        DevSettings.reload();
      } catch (err) {
        console.warn('Could not reload app automatically', err);
      }
    }
  }, 150);
};

export const applyLanguage = async (
  lang: Language,
  shouldReload: boolean = false,
) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    const isRTL = lang === LANGUAGES.ar;
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isRTL);
    await i18n.changeLanguage(lang);
    if (shouldReload) {
      reloadApp();
    }
  } catch (error) {
    console.error('Error applying language:', error);
  }
};

export default i18n;
