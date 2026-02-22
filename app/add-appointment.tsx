import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, Switch } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Appointment } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

export default function AddAppointmentScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addAppointment, updateAppointment, appointments } = useHealthStore();
    const isEditing = !!params.id;

    const [reason, setReason] = useState('');
    const [location, setLocation] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [type, setType] = useState<Appointment['type']>('In Person');
    const [recurrence, setRecurrence] = useState<Appointment['recurrence']>('None');
    const [remindersEnabled, setRemindersEnabled] = useState(true);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [reminderTime, setReminderTime] = useState('08:00');
    const [showReminderCalendar, setShowReminderCalendar] = useState(false);

    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState('09:00');
    const [showCalendar, setShowCalendar] = useState(false);

    const types: Appointment['type'][] = ['In Person', 'Virtual', 'Telephone'];
    const recurrences: Appointment['recurrence'][] = ['None', 'Weekly', 'Monthly', 'Yearly'];

    useEffect(() => {
        if (params.id) {
            const appointment = appointments.find(a => a.id === params.id);
            if (appointment) {
                setReason(appointment.reason || '');
                setLocation(appointment.location);
                setDoctorName(appointment.doctorName || '');
                setType(appointment.type);
                setRecurrence(appointment.recurrence || 'None');

                if (appointment.reminder && appointment.reminder !== 'None') {
                    setRemindersEnabled(true);
                    const parsed = new Date(appointment.reminder);
                    if (!isNaN(parsed.getTime())) {
                        setReminderDate(parsed);
                        setReminderTime(format(parsed, 'HH:mm'));
                    }
                } else {
                    setRemindersEnabled(false);
                }

                const dt = new Date(appointment.dateTime);
                setDate(dt);
                setTime(format(dt, 'HH:mm'));
            }
        }
    }, [params.id, appointments]);

    const handleSubmit = () => {
        if (!reason.trim()) return;
        // Combine date and time
        const [hours, minutes] = time.split(':').map(Number);
        const appointmentDate = new Date(date);
        appointmentDate.setHours(hours || 0, minutes || 0);

        const [rHours, rMinutes] = reminderTime.split(':').map(Number);
        const remDate = new Date(reminderDate);
        remDate.setHours(rHours || 0, rMinutes || 0);

        const appointmentData: Appointment = {
            id: isEditing ? (params.id as string) : Date.now().toString(),
            dateTime: appointmentDate.toISOString(),
            location,
            type,
            doctorName,
            recurrence,
            durationMinutes: 30, // Default for now
            reminder: remindersEnabled ? remDate.toISOString() : 'None',
            reason,
        };

        if (isEditing) {
            updateAppointment(appointmentData);
        } else {
            addAppointment(appointmentData);
        }
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Appointment' : 'Add Appointment'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Reason *</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., Annual Checkup" value={reason} onChangeText={setReason} />

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                            <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Time</Text>
                        <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <Text style={styles.label}>Doctor Name (Optional)</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., Dr. Smith" value={doctorName} onChangeText={setDoctorName} />

                <Text style={styles.label}>Location</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., City Hospital" value={location} onChangeText={setLocation} />

                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                    {types.map((t) => (
                        <TouchableOpacity key={t} style={[styles.typeButton, type === t && styles.typeButtonActive]} onPress={() => setType(t)}>
                            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Recurrence</Text>
                <View style={styles.typeRow}>
                    {recurrences.map((r) => (
                        <TouchableOpacity key={r} style={[styles.typeButton, recurrence === r && styles.typeButtonActive]} onPress={() => setRecurrence(r)}>
                            <Text style={[styles.typeText, recurrence === r && styles.typeTextActive]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.rowBetween, { alignItems: 'center', marginBottom: 20 }]}>
                    <Text style={[styles.label, { marginBottom: 0 }]}>Enable Reminder</Text>
                    <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} trackColor={{ false: colors.border, true: '#14B8A6' }} />
                </View>
                {remindersEnabled && (
                    <View style={styles.rowBetween}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Reminder Date</Text>
                            <TouchableOpacity style={styles.dateButton} onPress={() => setShowReminderCalendar(true)}>
                                <Text style={styles.dateText}>{format(reminderDate, 'MMM d, yyyy')}</Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Reminder Time</Text>
                            <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="HH:MM" value={reminderTime} onChangeText={setReminderTime} />
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !reason.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!reason.trim()}>
                    <Text style={styles.buttonText}>{isEditing ? 'Update Appointment' : 'Save Appointment'}</Text>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#14B8A6' }
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
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showReminderCalendar} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Calendar
                            onDayPress={(day: { dateString: string }) => {
                                setReminderDate(new Date(day.dateString));
                                setShowReminderCalendar(false);
                            }}
                            markedDates={{
                                [reminderDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#14B8A6' }
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
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowReminderCalendar(false)}>
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
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20, color: colors.text },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    typeButton: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', backgroundColor: colors.surface, marginRight: 8, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    typeButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    typeText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    typeTextActive: { color: colors.surface },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    dateText: { fontSize: 14, color: colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#14B8A6', fontSize: 16, fontWeight: '600' },
});
