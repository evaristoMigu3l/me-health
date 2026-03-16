import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { useTranslation } from '../hooks/useTranslation';

const measurementTypes = ['Blood Pressure', 'Heart Rate', 'Weight', 'BMI', 'Blood Sugar', 'Temperature', 'Cholesterol', 'Other'];

export default function AddMeasurementScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? t('edit_measurement') : t('add_measurement')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>{t('type')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {measurementTypes.map((tItem) => (
                        <TouchableOpacity
                            key={tItem}
                            style={[styles.chip, type === tItem && styles.chipActive]}
                            onPress={() => {
                                setType(tItem);
                                if (tItem === 'Weight') setUnit('kg');
                                else if (tItem === 'Blood Pressure') setUnit('mmHg');
                                else if (tItem === 'Heart Rate') setUnit('bpm');
                                else if (tItem === 'Temperature') setUnit('°C');
                                else setUnit('unit');
                            }}
                        >
                            <Text style={[styles.chipText, type === tItem && styles.chipTextActive]}>{t(tItem.toLowerCase().replace(' ', '_') as any) || tItem}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {type === 'Weight' && (
                    <View style={styles.unitContainer}>
                        <Text style={styles.label}>{t('unit')}</Text>
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

                <Text style={styles.label}>{t('reading')} ({unit})</Text>
                <TextInput placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    placeholder={t('enter_value')}
                    value={reading}
                    onChangeText={setReading}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>{t('date')}</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.dateButtonText}>{date.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !reading.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!reading.trim()}>
                    <Text style={styles.buttonText}>{id ? t('update') : t('save')}</Text>
                </TouchableOpacity>
            </View>
            <Modal statusBarTranslucent hardwareAccelerated visible={showCalendar} animationType="none" transparent>
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
                                calendarBackground: colors.surface,
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
                            <Text style={styles.closeButtonText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
    input: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20, color: colors.text },
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
