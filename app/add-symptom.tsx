import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Symptom } from '../types';

export default function AddSymptomScreen() {
    const router = useRouter();
    const addSymptom = useHealthStore((state) => state.addSymptom);
    const [name, setName] = useState('');
    const [intensity, setIntensity] = useState(50);
    const [place, setPlace] = useState('');
    const [notes, setNotes] = useState('');

    const getIntensityLabel = (val: number): Symptom['intensityLabel'] => {
        if (val < 25) return 'Mild';
        if (val < 50) return 'Moderate';
        if (val < 75) return 'Severe';
        return 'Very Severe';
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        addSymptom({
            id: Date.now().toString(),
            name,
            intensity,
            intensityLabel: getIntensityLabel(intensity),
            dateStarted: new Date().toISOString(),
            notes,
            place,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Symptom</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Symptom Name *</Text>
                <TextInput style={styles.input} placeholder="e.g., Headache, Fatigue" value={name} onChangeText={setName} />

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
                    <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                    <TextInput style={styles.inputNoBorder} placeholder="e.g., Home, Office" value={place} onChangeText={setPlace} />
                </View>

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Additional details..." value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!name.trim()}>
                    <Text style={styles.buttonText}>Add Symptom</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginLeft: 12 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    inputNoBorder: { flex: 1, paddingVertical: 16, marginLeft: 8, fontSize: 16 },
    textArea: { minHeight: 100 },
    sliderContainer: { marginBottom: 20 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sliderLabel: { fontSize: 12, color: '#9CA3AF' },
    sliderLabelActive: { color: '#3B82F6', fontWeight: '600' },
    sliderTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
    sliderFill: { height: '100%', borderRadius: 4 },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
