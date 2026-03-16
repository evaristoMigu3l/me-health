import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { useTranslation } from '../hooks/useTranslation';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

interface LockScreenProps {
    /** 
     * 'unlock'  — ask for existing PIN to unlock the app
     * 'setup'   — full create+confirm PIN flow, handled entirely inside
     */
    mode: 'unlock' | 'setup';
    onSuccess: () => void;
    onCancel?: () => void;
}

export default function LockScreen({ mode, onSuccess, onCancel }: LockScreenProps) {

    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { verifyPin, savePin, biometricEnabled, authenticateWithBiometric } = useAuthStore();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // For setup mode: track whether we're on step 1 (create) or step 2 (confirm)
    const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
    const [createdPin, setCreatedPin] = useState('');

    const title =
        mode === 'unlock' ? t('enter_pin') :
            setupStep === 'create' ? t('create_pin') :
                t('confirm_pin');

    const subtitle =
        mode === 'unlock' ? '' :
            setupStep === 'create' ? t('pin_usage_notice') :
                t('enter_pin_again');

    useEffect(() => {
        if (mode === 'unlock' && biometricEnabled) {
            handleBiometric();
        }
    }, []);

    async function handleBiometric() {
        const ok = await authenticateWithBiometric();
        if (ok) onSuccess();
    }

    function handleKey(key: string) {
        if (key === '⌫') {
            setPin(p => p.slice(0, -1));
            setError('');
            return;
        }
        if (key === '') return;
        if (pin.length >= 6) return;
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 6) {
            setTimeout(() => handleSubmit(newPin), 80);
        }
    }

    async function handleSubmit(p: string) {
        if (mode === 'unlock') {
            const ok = await verifyPin(p);
            if (ok) {
                onSuccess();
            } else {
                Vibration.vibrate(400);
                setError(t('incorrect_pin'));
                setPin('');
            }

        } else if (mode === 'setup') {
            if (setupStep === 'create') {
                // Store the PIN locally and move to confirm step
                setCreatedPin(p);
                setPin('');
                setError('');
                setSetupStep('confirm');

            } else {
                // Confirm step — compare against createdPin
                if (p === createdPin) {
                    try {
                        await savePin(p);
                        onSuccess();
                    } catch (err) {
                        setError(t('error_save_pin'));
                        setPin('');
                    }
                } else {
                    Vibration.vibrate(400);
                    setError(t('pins_dont_match'));
                    setPin('');
                    // Reset back to create step after a brief delay
                    setTimeout(() => {
                        setSetupStep('create');
                        setCreatedPin('');
                        setError('');
                    }, 1200);
                }
            }
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.inner}>
                {/* Back button for setup confirm step */}
                {mode === 'setup' && setupStep === 'confirm' && (
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => { setSetupStep('create'); setPin(''); setCreatedPin(''); setError(''); }}
                    >
                        <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}

                <View style={styles.iconCircle}>
                    <Ionicons
                        name={mode === 'setup' ? (setupStep === 'confirm' ? 'checkmark-circle' : 'lock-closed') : 'lock-closed'}
                        size={32}
                        color={colors.primary}
                    />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* Step indicator for setup */}
                {mode === 'setup' && (
                    <View style={styles.steps}>
                        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
                        <View style={[styles.stepDot, setupStep === 'confirm' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]} />
                    </View>
                )}

                {/* PIN dots */}
                <View style={styles.dots}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { borderColor: colors.primary },
                                i < pin.length && { backgroundColor: colors.primary }
                            ]}
                        />
                    ))}
                </View>

                {/* Keypad */}
                <View style={styles.keypad}>
                    {KEYS.map((key, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.key, { backgroundColor: colors.surface }, key === '' && { opacity: 0 }]}
                            onPress={() => handleKey(key)}
                            disabled={key === ''}
                            activeOpacity={0.6}
                        >
                            <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Biometric button for unlock */}
                {mode === 'unlock' && biometricEnabled && (
                    <TouchableOpacity style={styles.biometric} onPress={handleBiometric}>
                        <Ionicons name="finger-print-outline" size={32} color={colors.primary} />
                        <Text style={[styles.biometricText, { color: colors.textSecondary }]}>{t('use_biometric')}</Text>
                    </TouchableOpacity>
                )}

                {onCancel && (
                    <TouchableOpacity style={styles.cancel} onPress={onCancel}>
                        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    backBtn: { position: 'absolute', top: 16, left: 16, padding: 8 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
    subtitle: { fontSize: 14, marginBottom: 4, textAlign: 'center' },
    error: { color: '#EF4444', fontSize: 14, marginTop: 6, textAlign: 'center' },
    steps: { flexDirection: 'row', gap: 8, marginTop: 12 },
    stepDot: { width: 8, height: 8, borderRadius: 4 },
    dots: { flexDirection: 'row', gap: 14, marginVertical: 28 },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center', gap: 16 },
    key: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    keyText: { fontSize: 26, fontWeight: '500' },
    biometric: { marginTop: 32, alignItems: 'center', gap: 6 },
    biometricText: { fontSize: 13 },
    cancel: { marginTop: 24 },
});
