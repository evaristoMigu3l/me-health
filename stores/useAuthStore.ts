import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthState {
    hasPin: boolean;
    isLocked: boolean;
    biometricEnabled: boolean;
    setHasPin: (val: boolean) => void;
    setIsLocked: (val: boolean) => void;
    setBiometricEnabled: (val: boolean) => void;
    savePin: (pin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    clearPin: () => Promise<void>;
    authenticateWithBiometric: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            hasPin: false,
            isLocked: false,
            biometricEnabled: false,
            setHasPin: (val) => set({ hasPin: val }),
            setIsLocked: (val) => set({ isLocked: val }),
            setBiometricEnabled: (val) => set({ biometricEnabled: val }),

            savePin: async (pin) => {
                await SecureStore.setItemAsync('app_pin', pin);
                set({ hasPin: true, isLocked: false });
            },

            verifyPin: async (pin) => {
                const stored = await SecureStore.getItemAsync('app_pin');
                return stored === pin;
            },

            clearPin: async () => {
                await SecureStore.deleteItemAsync('app_pin');
                set({ hasPin: false, isLocked: false, biometricEnabled: false });
            },

            authenticateWithBiometric: async () => {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                if (!hasHardware || !isEnrolled) return false;
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to open Me & Health',
                    fallbackLabel: 'Use PIN',
                    cancelLabel: 'Cancel',
                });
                return result.success;
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Don't persist isLocked — always start locked if PIN is set
            partialize: (state) => ({
                hasPin: state.hasPin,
                biometricEnabled: state.biometricEnabled,
            }),
        }
    )
);
