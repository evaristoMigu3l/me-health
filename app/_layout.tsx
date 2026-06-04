import "../global.css";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, View, Modal, LogBox } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import LockScreen from '../components/LockScreen';
import * as SplashScreen from 'expo-splash-screen';
import { migrateAttachmentsToPersistentStorage } from '../utils/migrateAttachments';

// Ignore specific warnings from expo-notifications in Expo Go
LogBox.ignoreLogs(['warnOfExpoGoPushUsage', 'Calling getDevicePushTokenAsync']);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isDark, colors } = useAppTheme();
    const { hasPin, isLocked, setIsLocked } = useAuthStore();
    const appStateRef = useRef(AppState.currentState);
    const backgroundTime = useRef<number | null>(null);

    // Lock on first launch if PIN exists
    useEffect(() => {
        if (hasPin) setIsLocked(true);
    }, []);

    // Migrate old cache-based attachment URIs to persistent storage (runs once)
    useEffect(() => {
        migrateAttachmentsToPersistentStorage();
    }, []);

    // Lock when app stays in background for more than 60 seconds
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
                backgroundTime.current = Date.now();
            } else if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
                if (hasPin && backgroundTime.current) {
                    const elapsed = Date.now() - backgroundTime.current;
                    // 5-minute grace period prevents locking when quickly using file pickers/camera
                    if (elapsed > 300000) {
                        setIsLocked(true);
                    }
                }
                backgroundTime.current = null;
            }
            appStateRef.current = nextState;
        });
        return () => sub.remove();
    }, [hasPin, setIsLocked]);

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
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'none' }}>
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
