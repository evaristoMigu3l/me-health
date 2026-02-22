import "../global.css";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View, Modal } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import LockScreen from '../components/LockScreen';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isDark, colors } = useAppTheme();
    const { hasPin, isLocked, setIsLocked } = useAuthStore();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    // Lock on first launch if PIN exists
    useEffect(() => {
        if (hasPin) setIsLocked(true);
    }, []);

    // Lock when app goes to background
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appState === 'active' && nextState.match(/inactive|background/) && hasPin) {
                setIsLocked(true);
            }
            setAppState(nextState);
        });
        return () => sub.remove();
    }, [appState, hasPin]);

    // Hide splash screen after successful mount
    useEffect(() => {
        // A small timeout ensures React Native has painted the first frame 
        // with the correct theme colors, preventing any white flashes.
        const timer = setTimeout(() => {
            SplashScreen.hideAsync();
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    const customTheme = isDark ? {
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary }
    } : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary }
    };

    return (
        <ThemeProvider value={customTheme}>
            {/* App always stays mounted — no flicker on unlock */}
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
            </View>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Lock screen rendered as an overlay Modal — app tree stays alive underneath */}
            <Modal
                visible={isLocked && hasPin}
                transparent={false}
                animationType="none"
                statusBarTranslucent
                hardwareAccelerated
                onRequestClose={() => { /* prevent back button closing lock */ }}
            >
                <LockScreen mode="unlock" onSuccess={() => setIsLocked(false)} />
            </Modal>
        </ThemeProvider>
    );
}
