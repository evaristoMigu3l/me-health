import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';

const measurementTypes = ['Blood Pressure', 'Heart Rate', 'Weight', 'BMI', 'Blood Sugar', 'Temperature', 'Cholesterol', 'Other'];

export default function AddMeasurementScreen() {
    const router = useRouter();
    const addMeasurement = useHealthStore((state) => state.addMeasurement);
    const [type, setType] = useState('Blood Pressure');
    const [reading, setReading] = useState('');
    const [unit, setUnit] = useState('mmHg');
    const [date, setDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const handleSubmit = () => {
        if (!reading.trim()) return;
        addMeasurement({
            id: Date.now().toString(),
            type,
            unit,
            reading,
            dateTime: date.toISOString(),
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Measurement</Text>
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
                <TextInput
                    style={styles.input}
                    placeholder="Enter value"
                    value={reading}
                    onChangeText={setReading}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#4B5563" />
                    <Text style={styles.dateButtonText}>{date.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !reading.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!reading.trim()}>
                    <Text style={styles.buttonText}>Save Measurement</Text>
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
                            theme={{
                                selectedDayBackgroundColor: '#10B981',
                                todayTextColor: '#10B981',
                                arrowColor: '#10B981',
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
    chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    chipText: { fontSize: 14, color: '#6B7280' },
    chipTextActive: { color: '#FFFFFF' },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    unitContainer: { marginBottom: 20 },
    unitSelector: { flexDirection: 'row', flexWrap: 'wrap' },
    unitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    unitChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    unitText: { fontSize: 14, color: '#6B7280' },
    unitTextActive: { color: '#FFFFFF' },
    dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    dateButtonText: { marginLeft: 8, fontSize: 16, color: '#1A1A1A' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeButtonText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
});
