import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Symptom } from '../types';

export default function AddSymptomScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addSymptom, updateSymptom, symptoms } = useHealthStore();
    const [name, setName] = useState('');
    const [intensity, setIntensity] = useState(50);
    const [place, setPlace] = useState('');
    const [notes, setNotes] = useState('');
    const [dateStarted, setDateStarted] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const existing = symptoms.find(s => s.id === id);
            if (existing) {
                setName(existing.name);
                setIntensity(existing.intensity);
                setPlace(existing.place || '');
                setNotes(existing.notes || '');
                setDateStarted(existing.dateStarted);
            }
        }
    }, [id, symptoms]);

    const getIntensityLabel = (val: number): Symptom['intensityLabel'] => {
        if (val < 25) return 'Mild';
        if (val < 50) return 'Moderate';
        if (val < 75) return 'Severe';
        return 'Very Severe';
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        const data: Symptom = {
            id: id || Date.now().toString(),
            name,
            intensity,
            intensityLabel: getIntensityLabel(intensity),
            dateStarted: dateStarted || new Date().toISOString(),
            notes,
            place,
        };

        if (id) {
            updateSymptom(data);
        } else {
            addSymptom(data);
        }
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Symptom' : 'Add Symptom'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Symptom Name *</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., Headache, Fatigue" value={name} onChangeText={setName} />

                <Text style={styles.label}>Intensity: {getIntensityLabel(intensity)} ({intensity})</Text>
                <View style={styles.sliderContainer}>
                    <View style={styles.sliderLabels}>
                        {[0, 25, 50, 75, 100].map((val) => (
                            <TouchableOpacity key={val} onPress={() => setIntensity(val)}>
                                <Text style={[styles.sliderLabel, intensity === val && styles.sliderLabelActive]}>{val}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.sliderTrack}>
                        <View style={[styles.sliderFill, { width: `${intensity}%`, backgroundColor: intensity >= 75 ? '#EF4444' : intensity >= 50 ? '#F59E0B' : '#10B981' }]} />
                    </View>
                </View>

                <Text style={styles.label}>Location/Place</Text>
                <View style={styles.inputWithIcon}>
                    <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                    <TextInput placeholderTextColor={colors.textSecondary} style={styles.inputNoBorder} placeholder="e.g., Home, Office" value={place} onChangeText={setPlace} />
                </View>

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} placeholder="Additional details..." value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!name.trim()}>
                    <Text style={styles.buttonText}>{id ? 'Update Symptom' : 'Add Symptom'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 , color: colors.text },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    inputNoBorder: { flex: 1, paddingVertical: 16, marginLeft: 8, fontSize: 16 },
    textArea: { minHeight: 100 },
    sliderContainer: { marginBottom: 20 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sliderLabel: { fontSize: 12, color: colors.textSecondary },
    sliderLabelActive: { color: '#3B82F6', fontWeight: '600' },
    sliderTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    sliderFill: { height: '100%', borderRadius: 4 },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
});
