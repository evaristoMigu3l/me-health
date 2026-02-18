import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Medication } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const preparations: Medication['preparation'][] = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Inhaler', 'Patch', 'Topical', 'Drop', 'Gummies', 'Implant'];
const medicationTypes = ['Antibiotic', 'Analgesic', 'Antidepressant', 'Supplement', 'Vitamin', 'Other'];
const locations = ['Home', 'Work', 'School', 'Travel'];
const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

export default function AddMedicationScreen() {
    const router = useRouter();
    const addMedication = useHealthStore((state) => state.addMedication);

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
    const [color, setColor] = useState(colors[4]); // Default blue
    const [time, setTime] = useState('08:00');

    // Modals
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        addMedication({
            id: Date.now().toString(),
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
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Medication</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Medication Name *</Text>
                <TextInput style={styles.input} placeholder="e.g., Aspirin" value={name} onChangeText={setName} />

                <Text style={styles.label}>Preparation</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {preparations.map((prep) => (
                        <TouchableOpacity key={prep} style={[styles.chip, preparation === prep && styles.chipActive]} onPress={() => setPreparation(prep)}>
                            <Text style={[styles.chipText, preparation === prep && styles.chipTextActive]}>{prep}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Type / Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {medicationTypes.map((t) => (
                        <TouchableOpacity key={t} style={[styles.chip, subType === t && styles.chipActive]} onPress={() => setSubType(t)}>
                            <Text style={[styles.chipText, subType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Dosage</Text>
                <View style={styles.dosageRow}>
                    <TextInput style={[styles.input, styles.dosageInput]} placeholder="Amount" value={dosage} onChangeText={setDosage} keyboardType="numeric" />
                    <View style={styles.unitBadge}><Text style={styles.unitText}>mg</Text></View>
                </View>

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartCalendar(true)}>
                            <Text style={styles.dateText}>{format(startDate, 'MMM d, yyyy')}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>End Date (Optional)</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndCalendar(true)}>
                            <Text style={styles.dateText}>{endDate ? format(endDate, 'MMM d, yyyy') : 'Set Date'}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>Target Issue / Condition</Text>
                <TextInput style={styles.input} placeholder="e.g., Headache, Infection" value={targetCondition} onChangeText={setTargetCondition} />

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
                        <TextInput style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.labelNoMargin}>Self Prescribed</Text>
                    <Switch value={selfPrescribed} onValueChange={setSelfPrescribed} trackColor={{ false: "#E5E7EB", true: "#3B82F6" }} />
                </View>

                <Text style={styles.label}>Color Tag</Text>
                <View style={styles.colorGrid}>
                    {colors.map((c) => (
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
                    <Text style={styles.buttonText}>Add Medication</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
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
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipContainer: {
        marginBottom: 20,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    chipText: {
        fontSize: 14,
        color: '#6B7280',
    },
    chipTextActive: {
        color: '#FFFFFF',
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
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    unitText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    frequencyRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
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
        color: '#6B7280',
    },
    frequencyTextActive: {
        color: '#FFFFFF',
    },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    labelNoMargin: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    colorCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    colorCircleActive: { borderWidth: 2, borderColor: '#1A1A1A' },
    chipSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 6 },
    chipTextSmall: { fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
});
