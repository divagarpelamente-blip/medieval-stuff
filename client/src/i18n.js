import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { en } from './utils/locales/en';
// Secondary locales frozen to optimize token overhead
// import { ptBR } from './utils/locales/pt-BR';
// import { fr } from './utils/locales/fr';
// import { es } from './utils/locales/es';
// import { de } from './utils/locales/de';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en }
    },
    lng: 'en', // Locked to English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already escapes from xss
      prefix: '{', // allows reusing current translation strings with '{amount}'
      suffix: '}'
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'eldoria_language',
      caches: ['localStorage']
    }
  });

export default i18n;
