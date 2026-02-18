import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';

export default function OnboardingScreen() {
    const router = useRouter();
    const setProfile = useUserStore((state) => state.setProfile);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;
        setProfile({ name, email, dob: '', gender: 'Male', ethnicity: '' });
        router.replace('/(tabs)');
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's set up your health profile</Text>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !name.trim() && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={!name.trim()}
                >
                    <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    button: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
