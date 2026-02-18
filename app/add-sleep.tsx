import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { SleepLog } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const qualities: SleepLog['quality'][] = ['Poor', 'Fair', 'Good', 'Excellent'];

export default function AddSleepScreen() {
    const router = useRouter();
    const addSleepLog = useHealthStore((state) => state.addSleepLog);
    const [hours, setHours] = useState(7);
    const [quality, setQuality] = useState<SleepLog['quality'] | null>(null);
    const [date, setDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const handleSubmit = () => {
        if (!quality) return;
        addSleepLog({
            id: Date.now().toString(),
            dateTime: date.toISOString(),
            hours,
            quality,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Log Sleep</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                        <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Hours of sleep</Text>
                <View style={styles.hoursSelector}>
                    <TouchableOpacity style={styles.hourButton} onPress={() => setHours(Math.max(1, hours - 1))}><Ionicons name="remove" size={24} color="#3B82F6" /></TouchableOpacity>
                    <View style={styles.hoursDisplay}><Text style={styles.hoursValue}>{hours}</Text><Text style={styles.hoursLabel}>hours</Text></View>
                    <TouchableOpacity style={styles.hourButton} onPress={() => setHours(Math.min(24, hours + 1))}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
                </View>

                <Text style={styles.label}>Sleep Quality</Text>
                <View style={styles.qualityRow}>
                    {qualities.map((q) => (
                        <TouchableOpacity key={q} style={[styles.qualityButton, quality === q && styles.qualityButtonActive]} onPress={() => setQuality(q)}>
                            <Text style={[styles.qualityText, quality === q && styles.qualityTextActive]}>{q}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !quality && styles.buttonDisabled]} onPress={handleSubmit} disabled={!quality}>
                    <Text style={styles.buttonText}>Save Sleep</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showCalendar} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Calendar
                            onDayPress={(day: { dateString: string }) => {
                                setDate(new Date(day.dateString));
                                setShowCalendar(false);
                            }}
                            markedDates={{
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#6366F1' }
                            }}
                            theme={{ todayTextColor: '#6366F1', arrowColor: '#6366F1', selectedDayBackgroundColor: '#6366F1' }}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
    hoursSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    hourButton: { padding: 16 },
    hoursDisplay: { alignItems: 'center', paddingHorizontal: 40 },
    hoursValue: { fontSize: 48, fontWeight: 'bold', color: '#1A1A1A' },
    hoursLabel: { fontSize: 16, color: '#6B7280' },
    qualityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    qualityButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 4, borderRadius: 12 },
    qualityButtonActive: { backgroundColor: '#6366F1' },
    qualityText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    qualityTextActive: { color: '#FFFFFF' },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    dateContainer: { marginBottom: 20 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
});
