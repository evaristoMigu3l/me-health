import "../global.css";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function RootLayout() {
    const { isDark, colors } = useAppTheme();

    // Create a custom theme object based on standard React Navigation themes
    const customTheme = isDark ? {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
        }
    } : {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
        }
    };

    return (
        <ThemeProvider value={customTheme}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
            </View>
            <StatusBar style={isDark ? "light" : "dark"} />
        </ThemeProvider>
    );
}
