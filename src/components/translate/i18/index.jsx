import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../en-translate';
import arTranslations from '../ar-translate';

const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslations,
            },
            ar: {
                translation: arTranslations,
            },
        },
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Set initial document direction based on saved language
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

export default i18n;
