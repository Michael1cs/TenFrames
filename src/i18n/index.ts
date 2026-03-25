import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'react-native-localize';
import ro from './locales/ro.json';
import en from './locales/en.json';

const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const appLang = deviceLang === 'ro' ? 'ro' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    ro: {translation: ro},
    en: {translation: en},
  },
  lng: appLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
