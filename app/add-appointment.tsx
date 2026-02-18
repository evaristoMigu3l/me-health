import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Appointment } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const types: Appointment['type'][] = ['In Person', 'Virtual', 'Telephone'];
const recurrences: Appointment['recurrence'][] = ['None', 'Weekly', 'Monthly', 'Yearly'];

export default function AddAppointmentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addAppointment, updateAppointment, appointments } = useHealthStore();
    const isEditing = !!params.id;

    const [reason, setReason] = useState('');
    const [location, setLocation] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [type, setType] = useState<Appointment['type']>('In Person');
    const [recurrence, setRecurrence] = useState<Appointment['recurrence']>('None');
    const [reminder, setReminder] = useState('30 min before');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState('09:00');
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        if (params.id) {
            const appointment = appointments.find(a => a.id === params.id);
            if (appointment) {
                setReason(appointment.reason || '');
                setLocation(appointment.location);
                setDoctorName(appointment.doctorName || '');
                setType(appointment.type);
                setRecurrence(appointment.recurrence || 'None');
                setReminder(appointment.reminder);
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

        const appointmentData: Appointment = {
            id: isEditing ? (params.id as string) : Date.now().toString(),
            dateTime: appointmentDate.toISOString(),
            location,
            type,
            doctorName,
            recurrence,
            durationMinutes: 30, // Default for now
            reminder,
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
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Appointment' : 'Add Appointment'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Reason *</Text>
                <TextInput style={styles.input} placeholder="e.g., Annual Checkup" value={reason} onChangeText={setReason} />

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                            <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Time</Text>
                        <TextInput style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <Text style={styles.label}>Doctor Name (Optional)</Text>
                <TextInput style={styles.input} placeholder="e.g., Dr. Smith" value={doctorName} onChangeText={setDoctorName} />

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} placeholder="e.g., City Hospital" value={location} onChangeText={setLocation} />

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

                <Text style={styles.label}>Reminder</Text>
                <TextInput style={styles.input} placeholder="e.g., 30 min before" value={reminder} onChangeText={setReminder} />
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
                            theme={{ todayTextColor: '#14B8A6', arrowColor: '#14B8A6', selectedDayBackgroundColor: '#14B8A6' }}
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
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    typeRow: { flexDirection: 'row', marginBottom: 20 },
    typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    typeButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    typeText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    typeTextActive: { color: '#FFFFFF' },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#14B8A6', fontSize: 16, fontWeight: '600' },
});
