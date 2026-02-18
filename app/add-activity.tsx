import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Activity } from '../types';

const categories: Activity['category'][] = ['Basic Activities', 'Cognitive', 'Daily Living', 'Endurance'];

export default function AddActivityScreen() {
    const router = useRouter();
    const addActivity = useHealthStore((state) => state.addActivity);
    const [category, setCategory] = useState<Activity['category']>('Basic Activities');
    const [activity, setActivity] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(30);

    const handleSubmit = () => {
        if (!activity.trim()) return;
        addActivity({
            id: Date.now().toString(),
            category,
            specificActivity: activity,
            dateTime: new Date().toISOString(),
            durationHours: hours,
            durationMinutes: minutes,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Log Activity</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {categories.map((c) => (
                        <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Activity</Text>
                <TextInput style={styles.input} placeholder="e.g., Walking, Yoga" value={activity} onChangeText={setActivity} />

                <Text style={styles.label}>Duration</Text>
                <View style={styles.durationRow}>
                    <View style={styles.durationItem}>
                        <Text style={styles.durationLabel}>Hours</Text>
                        <View style={styles.durationControl}>
                            <TouchableOpacity onPress={() => setHours(Math.max(0, hours - 1))}><Ionicons name="remove" size={20} color="#3B82F6" /></TouchableOpacity>
                            <Text style={styles.durationValue}>{hours}</Text>
                            <TouchableOpacity onPress={() => setHours(hours + 1)}><Ionicons name="add" size={20} color="#3B82F6" /></TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.durationItem}>
                        <Text style={styles.durationLabel}>Minutes</Text>
                        <View style={styles.durationControl}>
                            <TouchableOpacity onPress={() => setMinutes(Math.max(0, minutes - 15))}><Ionicons name="remove" size={20} color="#3B82F6" /></TouchableOpacity>
                            <Text style={styles.durationValue}>{minutes}</Text>
                            <TouchableOpacity onPress={() => setMinutes(Math.min(59, minutes + 15))}><Ionicons name="add" size={20} color="#3B82F6" /></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !activity.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!activity.trim()}>
                    <Text style={styles.buttonText}>Save Activity</Text>
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
    chipContainer: { marginBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    chipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    chipText: { fontSize: 14, color: '#6B7280' },
    chipTextActive: { color: '#FFFFFF' },
    durationRow: { flexDirection: 'row', marginBottom: 20 },
    durationItem: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 4 },
    durationLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8, textAlign: 'center' },
    durationControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    durationValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginHorizontal: 16 },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
