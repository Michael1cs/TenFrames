import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import ro from './locales/ro.json';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    ro: {translation: ro},
    en: {translation: en},
  },
  lng: 'ro',
  fallbackLng: 'ro',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
