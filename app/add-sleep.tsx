import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { SleepLog } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const qualities: SleepLog['quality'][] = ['Poor', 'Fair', 'Good', 'Excellent'];

export default function AddSleepScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addSleepLog, updateSleepLog, sleepLogs } = useHealthStore();
    const [hours, setHours] = useState(7);
    const [quality, setQuality] = useState<SleepLog['quality'] | null>(null);
    const [date, setDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        if (id) {
            const existing = sleepLogs.find(s => s.id === id);
            if (existing) {
                setHours(existing.hours);
                setQuality(existing.quality);
                setDate(new Date(existing.dateTime));
            }
        }
    }, [id, sleepLogs]);

    const handleSubmit = () => {
        if (!quality) return;
        const data = {
            id: id || Date.now().toString(),
            dateTime: date.toISOString(),
            hours,
            quality,
        };

        if (id) {
            updateSleepLog(data);
        } else {
            addSleepLog(data);
        }
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Sleep' : 'Log Sleep'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                        <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
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
                    <Text style={styles.buttonText}>{id ? 'Update Sleep' : 'Save Sleep'}</Text>
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
                            theme={{ calendarBackground: colors.surface,
                                textSectionTitleColor: colors.textSecondary,
                                selectedDayBackgroundColor: colors.primary || '#14B8A6',
                                selectedDayTextColor: colors.surface,
                                todayTextColor: colors.primary || '#14B8A6',
                                dayTextColor: colors.text,
                                textDisabledColor: colors.border,
                                dotColor: colors.primary || '#14B8A6',
                                selectedDotColor: colors.surface,
                                arrowColor: colors.text,
                                monthTextColor: colors.text,
                                indicatorColor: colors.text,
                            }}
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

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 16 },
    hoursSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    hourButton: { padding: 16 },
    hoursDisplay: { alignItems: 'center', paddingHorizontal: 40 },
    hoursValue: { fontSize: 48, fontWeight: 'bold', color: colors.text },
    hoursLabel: { fontSize: 16, color: colors.textSecondary },
    qualityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    qualityButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 4, borderRadius: 12 },
    qualityButtonActive: { backgroundColor: '#6366F1' },
    qualityText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    qualityTextActive: { color: colors.surface },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    dateContainer: { marginBottom: 20 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    dateText: { fontSize: 14, color: colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
});
