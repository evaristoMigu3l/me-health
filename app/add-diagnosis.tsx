import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Diagnosis } from '../types';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';

export default function AddDiagnosisScreen() {
    const router = useRouter();
    const { addDiagnosis, appointments } = useHealthStore();
    const [condition, setCondition] = useState('');
    const [date, setDate] = useState(new Date());
    const [status, setStatus] = useState<Diagnosis['status']>('Active');
    const [treatment, setTreatment] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkedAppointmentIds, setLinkedAppointmentIds] = useState<string[]>([]);

    const handleSubmit = () => {
        if (!condition.trim()) return;
        addDiagnosis({
            id: Date.now().toString(),
            condition,
            dateOfDiagnosis: date.toISOString(),
            status,
            treatment,
            linkedAppointmentIds,
        });
        router.back();
    };

    const toggleAppointmentLink = (id: string) => {
        if (linkedAppointmentIds.includes(id)) {
            setLinkedAppointmentIds(linkedAppointmentIds.filter(lid => lid !== id));
        } else {
            setLinkedAppointmentIds([...linkedAppointmentIds, id]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Diagnosis</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Condition</Text>
                <TextInput style={styles.input} placeholder="e.g., Type 2 Diabetes" value={condition} onChangeText={setCondition} />

                <Text style={styles.label}>Date of Diagnosis</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>

                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                    {(['Active', 'Resolved', 'Recurring'] as Diagnosis['status'][]).map(s => (
                        <TouchableOpacity key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
                            <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Treatment Plan (Optional)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Medication, therapy, lifestyle changes..." value={treatment} onChangeText={setTreatment} multiline textAlignVertical="top" />

                <Text style={styles.label}>Link to Appointments (Optional)</Text>
                <TouchableOpacity style={styles.linkButton} onPress={() => setShowLinkModal(true)}>
                    <Ionicons name="link" size={20} color="#EF4444" />
                    <Text style={styles.linkButtonText}>{linkedAppointmentIds.length > 0 ? `${linkedAppointmentIds.length} Linked` : 'Select Appointments'}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !condition.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!condition.trim()}>
                    <Text style={styles.buttonText}>Save Diagnosis</Text>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#EF4444' }
                            }}
                            theme={{ todayTextColor: '#EF4444', arrowColor: '#EF4444', selectedDayBackgroundColor: '#EF4444' }}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showLinkModal} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Link Appointments</Text>
                        <TouchableOpacity onPress={() => setShowLinkModal(false)}><Ionicons name="close" size={24} color="#1A1A1A" /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={appointments}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.apptItem, linkedAppointmentIds.includes(item.id) && styles.apptItemSelected]} onPress={() => toggleAppointmentLink(item.id)}>
                                <View>
                                    <Text style={styles.apptTitle}>{item.reason || 'Appointment'}</Text>
                                    <Text style={styles.apptDate}>{format(parseISO(item.dateTime), 'MMM d, yyyy h:mm a')}</Text>
                                </View>
                                {linkedAppointmentIds.includes(item.id) && <Ionicons name="checkmark-circle" size={24} color="#EF4444" />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No appointments found to link.</Text>}
                    />
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.button} onPress={() => setShowLinkModal(false)}>
                            <Text style={styles.buttonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
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
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    statusRow: { flexDirection: 'row', marginBottom: 20 },
    statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
    statusChipActive: { backgroundColor: '#EF4444' },
    statusText: { fontSize: 14, color: '#6B7280' },
    statusTextActive: { color: '#FFFFFF' },
    textArea: { minHeight: 100 },
    linkButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, marginBottom: 20 },
    linkButtonText: { marginLeft: 8, color: '#EF4444', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
    apptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', marginBottom: 1, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    apptItemSelected: { backgroundColor: '#FEF2F2' },
    apptTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    apptDate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    listContent: { paddingBottom: 20 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', marginTop: 20 },
});
