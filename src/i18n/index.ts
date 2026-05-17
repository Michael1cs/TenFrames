import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'react-native-localize';
import ro from './locales/ro.json';
import en from './locales/en.json';
import de from './locales/de.json';

const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const appLang =
  deviceLang === 'ro' ? 'ro' :
  deviceLang === 'de' ? 'de' :
  'en';

i18n.use(initReactI18next).init({
  resources: {
    ro: {translation: ro},
    en: {translation: en},
    de: {translation: de},
  },
  lng: appLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
