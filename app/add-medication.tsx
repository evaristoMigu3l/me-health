import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Medication } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const preparations: Medication['preparation'][] = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Inhaler', 'Patch', 'Topical', 'Drop', 'Gummies', 'Implant'];
const medicationTypes = ['Antibiotic', 'Analgesic', 'Antidepressant', 'Supplement', 'Vitamin', 'Other'];
const locations = ['Home', 'Work', 'School', 'Travel'];

export default function AddMedicationScreen() {
    const { colors } = useAppTheme();
    const tagColors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', colors.textSecondary];
    const styles = getStyles(colors);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addMedication, updateMedication, medications } = useHealthStore();

    // Form State
    const [name, setName] = useState('');
    const [preparation, setPreparation] = useState<Medication['preparation']>('Tablet');
    const [dosage, setDosage] = useState('');
    const [timesPerDay, setTimesPerDay] = useState(1);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [selfPrescribed, setSelfPrescribed] = useState(false);
    const [targetCondition, setTargetCondition] = useState('');
    const [location, setLocation] = useState('Home');
    const [subType, setSubType] = useState('Other');
    const [color, setColor] = useState(tagColors[4]); // Default blue
    const [time, setTime] = useState('08:00');

    // Modals
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);

    useEffect(() => {
        if (id) {
            const existing = medications.find(m => m.id === id);
            if (existing) {
                setName(existing.name);
                setPreparation(existing.preparation);
                if (existing.schedule && existing.schedule.length > 0) {
                    setDosage(existing.schedule[0].dosage.toString());
                    setTime(existing.schedule[0].time);
                }
                setTimesPerDay(existing.timesPerDay);
                setStartDate(new Date(existing.startDate));
                if (existing.endDate) setEndDate(new Date(existing.endDate));
                setSelfPrescribed(existing.selfPrescribed || false);
                setTargetCondition(existing.targetCondition || '');
                setLocation(existing.location || 'Home');
                setSubType(existing.type || 'Other');
                setColor(existing.color || tagColors[4]);
            }
        }
    }, [id, medications]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        const data: Medication = {
            id: id || Date.now().toString(),
            name,
            preparation,
            dosageUnit: 'mg',
            startDate: startDate.toISOString(),
            endDate: endDate ? endDate.toISOString() : undefined,
            frequency: 'Daily',
            timesPerDay,
            schedule: [{ time, dosage: parseFloat(dosage) || 1 }],
            status: 'Current',
            selfPrescribed,
            targetCondition,
            location,
            type: subType,
            color,
        };

        if (id) {
            updateMedication(data);
        } else {
            addMedication(data);
        }
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Medication' : 'Add Medication'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Medication Name *</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., Aspirin" value={name} onChangeText={setName} />

                <Text style={styles.label}>Preparation</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {preparations.map((prep) => (
                        <TouchableOpacity key={prep} style={[styles.chip, preparation === prep && styles.chipActive]} onPress={() => setPreparation(prep)}>
                            <Text style={[styles.chipText, preparation === prep && styles.chipTextActive]}>{prep}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, { marginBottom: 20 }]} placeholder="Or type custom preparation" value={preparation} onChangeText={setPreparation} />

                <Text style={styles.label}>Type / Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {medicationTypes.map((t) => (
                        <TouchableOpacity key={t} style={[styles.chip, subType === t && styles.chipActive]} onPress={() => setSubType(t)}>
                            <Text style={[styles.chipText, subType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, { marginBottom: 20 }]} placeholder="Or type custom category" value={subType} onChangeText={setSubType} />

                <Text style={styles.label}>Dosage</Text>
                <View style={styles.dosageRow}>
                    <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, styles.dosageInput]} placeholder="Amount" value={dosage} onChangeText={setDosage} keyboardType="numeric" />
                    <View style={styles.unitBadge}><Text style={styles.unitText}>mg</Text></View>
                </View>

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartCalendar(true)}>
                            <Text style={styles.dateText}>{format(startDate, 'MMM d, yyyy')}</Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>End Date (Optional)</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndCalendar(true)}>
                            <Text style={styles.dateText}>{endDate ? format(endDate, 'MMM d, yyyy') : 'Set Date'}</Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>Target Issue / Condition</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., Headache, Infection" value={targetCondition} onChangeText={setTargetCondition} />

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Location</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {locations.map((loc) => (
                                <TouchableOpacity key={loc} style={[styles.chipSmall, location === loc && styles.chipActive]} onPress={() => setLocation(loc)}>
                                    <Text style={[styles.chipTextSmall, location === loc && styles.chipTextActive]}>{loc}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Time</Text>
                        <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.labelNoMargin}>Self Prescribed</Text>
                    <Switch value={selfPrescribed} onValueChange={setSelfPrescribed} trackColor={{ false: "#E5E7EB", true: "#3B82F6" }} />
                </View>

                <Text style={styles.label}>Color Tag</Text>
                <View style={styles.colorGrid}>
                    {tagColors.map((c) => (
                        <TouchableOpacity key={c} style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]} onPress={() => setColor(c)}>
                            {color === c && <Ionicons name="checkmark" size={16} color="white" />}
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Times per day</Text>
                <View style={styles.frequencyRow}>
                    {[1, 2, 3, 4].map((num) => (
                        <TouchableOpacity key={num} style={[styles.frequencyButton, timesPerDay === num && styles.frequencyButtonActive]} onPress={() => setTimesPerDay(num)}>
                            <Text style={[styles.frequencyText, timesPerDay === num && styles.frequencyTextActive]}>{num}x</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!name.trim()}>
                    <Text style={styles.buttonText}>{id ? 'Update Medication' : 'Add Medication'}</Text>
                </TouchableOpacity>
            </View>

            {/* Date Modals */}
            <Modal visible={showStartCalendar} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Calendar onDayPress={(day: any) => { setStartDate(new Date(day.dateString)); setShowStartCalendar(false); }}
                            markedDates={{ [startDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#3B82F6' } }} />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowStartCalendar(false)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal visible={showEndCalendar} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Calendar onDayPress={(day: any) => { setEndDate(new Date(day.dateString)); setShowEndCalendar(false); }}
                            markedDates={endDate ? { [endDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#3B82F6' } } : {}} />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowEndCalendar(false)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginLeft: 12,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
    },
    chipContainer: {
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.surface,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    chipText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: colors.surface,
    },
    dosageRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dosageInput: {
        flex: 1,
        marginRight: 12,
    },
    unitBadge: {
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    unitText: {
        fontSize: 16,
        color: colors.text,
    },
    frequencyRow: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    frequencyButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    frequencyButtonActive: {
        backgroundColor: '#3B82F6',
    },
    frequencyText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    frequencyTextActive: {
        color: colors.surface,
    },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    dateText: { fontSize: 14, color: colors.text },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    labelNoMargin: { fontSize: 14, fontWeight: '600', color: colors.text },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    colorCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    colorCircleActive: { borderWidth: 2, borderColor: colors.text },
    chipSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.border, marginRight: 6 },
    chipTextSmall: { fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
});
