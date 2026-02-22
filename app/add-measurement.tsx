import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';

const measurementTypes = ['Blood Pressure', 'Heart Rate', 'Weight', 'BMI', 'Blood Sugar', 'Temperature', 'Cholesterol', 'Other'];

export default function AddMeasurementScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addMeasurement, updateMeasurement, measurements } = useHealthStore();
    const [type, setType] = useState('Blood Pressure');
    const [reading, setReading] = useState('');
    const [unit, setUnit] = useState('mmHg');
    const [date, setDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        if (id) {
            const existing = measurements.find(m => m.id === id);
            if (existing) {
                setType(existing.type);
                setReading(existing.reading.toString());
                setUnit(existing.unit);
                setDate(new Date(existing.dateTime));
            }
        }
    }, [id, measurements]);

    const handleSubmit = () => {
        if (!reading.trim()) return;
        const data = {
            id: id || Date.now().toString(),
            type,
            unit,
            reading,
            dateTime: date.toISOString(),
        };

        if (id) {
            updateMeasurement(data);
        } else {
            addMeasurement(data);
        }
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Measurement' : 'Add Measurement'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {measurementTypes.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, type === t && styles.chipActive]}
                            onPress={() => {
                                setType(t);
                                if (t === 'Weight') setUnit('kg');
                                else if (t === 'Blood Pressure') setUnit('mmHg');
                                else if (t === 'Heart Rate') setUnit('bpm');
                                else if (t === 'Temperature') setUnit('°C');
                                else setUnit('unit');
                            }}
                        >
                            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {type === 'Weight' && (
                    <View style={styles.unitContainer}>
                        <Text style={styles.label}>Unit</Text>
                        <View style={styles.unitSelector}>
                            {['kg', 'g', 'lb'].map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                                    onPress={() => setUnit(u)}
                                >
                                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <Text style={styles.label}>Reading ({unit})</Text>
                <TextInput placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    placeholder="Enter value"
                    value={reading}
                    onChangeText={setReading}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.dateButtonText}>{date.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !reading.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!reading.trim()}>
                    <Text style={styles.buttonText}>{id ? 'Update Measurement' : 'Save Measurement'}</Text>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#10B981' }
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
                            <Text style={styles.closeButtonText}>Close</Text>
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
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 , color: colors.text },
    chipContainer: { marginBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, marginRight: 10, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    chipText: { fontSize: 14, color: colors.textSecondary },
    chipTextActive: { color: colors.surface },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    unitContainer: { marginBottom: 20 },
    unitSelector: { flexDirection: 'row', flexWrap: 'wrap' },
    unitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.border, marginRight: 8, borderWidth: 1, borderColor: colors.border },
    unitChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    unitText: { fontSize: 14, color: colors.textSecondary },
    unitTextActive: { color: colors.surface },
    dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    dateButtonText: { marginLeft: 8, fontSize: 16, color: colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeButtonText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
});
