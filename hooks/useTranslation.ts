import { useThemeStore } from '../stores/useThemeStore';
import { translations, Language } from '../utils/i18n';

export function useTranslation() {
    const { language } = useThemeStore();

    const t = (key: keyof typeof translations, params?: Record<string, string | number>) => {
        const langDict = translations[key];
        if (!langDict) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        let text = langDict[language as Language] || langDict['en'];

        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                text = text.replace(`{${paramKey}}`, String(paramValue));
            });
        }

        return text;
    };

    return { t, language };
}
