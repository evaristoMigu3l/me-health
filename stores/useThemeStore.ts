import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type NotificationSound = 'default' | 'bell.ogg' | 'chime.ogg' | 'digital.ogg' | 'hurt_again.mp3' | 'your_power.mp3';
export type AppLanguage = 'en' | 'pt';

interface ThemeState {
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;
    notificationSound: NotificationSound;
    setNotificationSound: (sound: NotificationSound) => void;
    language: AppLanguage;
    setLanguage: (lang: AppLanguage) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            themePreference: 'system',
            setThemePreference: (preference) => set({ themePreference: preference }),
            notificationSound: 'default',
            setNotificationSound: (sound) => set({ notificationSound: sound }),
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
