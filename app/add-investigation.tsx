import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Investigation } from '../types';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';

export default function AddInvestigationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addInvestigation, updateInvestigation, investigations, appointments } = useHealthStore();

    const isEditing = !!params.id;
    const existingExam = isEditing ? investigations.find(i => i.id === params.id) : null;

    const [type, setType] = useState('');
    const [result, setResult] = useState('');
    const [date, setDate] = useState(new Date());
    const [status, setStatus] = useState<Investigation['status']>('Completed');
    const [notes, setNotes] = useState('');
    const [linkedAppointmentId, setLinkedAppointmentId] = useState<string | undefined>(undefined);
    const [attachments, setAttachments] = useState<string[]>([]);

    const [showCalendar, setShowCalendar] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    useEffect(() => {
        if (existingExam) {
            setType(existingExam.type);
            setResult(existingExam.result || '');
            setDate(new Date(existingExam.dateTime));
            setStatus(existingExam.status);
            setNotes(existingExam.notes || '');
            setLinkedAppointmentId(existingExam.linkedAppointmentId);
            setAttachments(existingExam.attachments || []);
        }
    }, [existingExam]);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            // For this demo, we'll store the URI.
            const asset = result.assets[0];
            setAttachments([...attachments, asset.uri]);
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleSubmit = () => {
        if (!type.trim()) return;

        const examData: Investigation = {
            id: isEditing ? (params.id as string) : Date.now().toString(),
            type,
            dateTime: date.toISOString(),
            result,
            status,
            notes,
            linkedAppointmentId,
            attachments,
        };

        if (isEditing) {
            updateInvestigation(examData as Investigation);
        } else {
            addInvestigation(examData);
        }
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Exam' : 'Log Exam'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Exam Type</Text>
                <TextInput style={styles.input} placeholder="e.g., Blood Test, MRI, X-Ray" value={type} onChangeText={setType} />

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>

                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                    {(['Scheduled', 'Pending', 'Completed'] as Investigation['status'][]).map(s => (
                        <TouchableOpacity key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
                            <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Result / Outcome</Text>
                <TextInput style={styles.input} placeholder="Normal, High Cholesterol, Fracture..." value={result} onChangeText={setResult} />

                <Text style={styles.label}>Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Additional details..." value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />

                <Text style={styles.label}>Link to Appointment (Optional)</Text>
                <TouchableOpacity style={styles.linkButton} onPress={() => setShowLinkModal(true)}>
                    <Ionicons name="link" size={20} color="#3B82F6" />
                    <Text style={styles.linkButtonText}>
                        {linkedAppointmentId
                            ? `Linked: ${appointments.find(a => a.id === linkedAppointmentId)?.reason || 'Appointment'}`
                            : 'Select Appointment'}
                    </Text>
                    {linkedAppointmentId && (
                        <TouchableOpacity onPress={() => setLinkedAppointmentId(undefined)} style={{ marginLeft: 'auto' }}>
                            <Ionicons name="close-circle" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Attachments</Text>
                <TouchableOpacity style={styles.attachButton} onPress={handlePickDocument}>
                    <Ionicons name="attach" size={20} color="#3B82F6" />
                    <Text style={styles.attachButtonText}>Add Document / Photo</Text>
                </TouchableOpacity>

                {attachments.length > 0 && (
                    <View style={styles.attachmentList}>
                        {attachments.map((file, index) => (
                            <View key={index} style={styles.attachmentItem}>
                                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                                <Text style={styles.attachmentName} numberOfLines={1}>{decodeURIComponent(file).split('/').pop()}</Text>
                                <TouchableOpacity onPress={() => removeAttachment(index)}>
                                    <Ionicons name="close" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !type.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!type.trim()}>
                    <Text style={styles.buttonText}>{isEditing ? 'Update Exam' : 'Save Exam'}</Text>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#3B82F6' }
                            }}
                            theme={{ todayTextColor: '#3B82F6', arrowColor: '#3B82F6', selectedDayBackgroundColor: '#3B82F6' }}
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
                        <Text style={styles.modalTitle}>Link Appointment</Text>
                        <TouchableOpacity onPress={() => setShowLinkModal(false)}><Ionicons name="close" size={24} color="#1A1A1A" /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={appointments}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.apptItem, linkedAppointmentId === item.id && styles.apptItemSelected]} onPress={() => { setLinkedAppointmentId(item.id); setShowLinkModal(false); }}>
                                <View>
                                    <Text style={styles.apptTitle}>{item.reason || 'Appointment'}</Text>
                                    <Text style={styles.apptDate}>{format(parseISO(item.dateTime), 'MMM d, yyyy h:mm a')}</Text>
                                </View>
                                {linkedAppointmentId === item.id && <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No appointments found.</Text>}
                    />
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
    textArea: { minHeight: 100 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    statusRow: { flexDirection: 'row', marginBottom: 20 },
    statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
    statusChipActive: { backgroundColor: '#3B82F6' },
    statusText: { fontSize: 14, color: '#6B7280' },
    statusTextActive: { color: '#FFFFFF' },
    linkButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12, marginBottom: 20 },
    linkButtonText: { flex: 1, marginLeft: 8, color: '#3B82F6', fontWeight: '600' },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
    apptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', marginBottom: 1, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    apptItemSelected: { backgroundColor: '#EFF6FF' },
    apptTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    apptDate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    listContent: { paddingBottom: 20 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', marginTop: 20 },
    attachButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3B82F6' },
    attachButtonText: { marginLeft: 8, color: '#3B82F6', fontWeight: '600' },
    attachmentList: { marginBottom: 20 },
    attachmentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    attachmentName: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937', marginRight: 8 },
});
