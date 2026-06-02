import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Investigation } from '../types';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

// Persistent directory for exam attachments (survives cache clears)
const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}exam-attachments/`;

export default function AddInvestigationScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
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

    /**
     * Copies a picked file from the volatile cache directory to
     * FileSystem.documentDirectory (persistent storage that survives
     * cache clears by Android). Returns the new persistent URI.
     */
    const copyToPersistentStorage = async (cacheUri: string, fileName: string): Promise<string> => {
        // Ensure the persistent attachments directory exists
        const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
        }

        // Create a unique filename to avoid collisions
        const uniqueName = `${Date.now()}_${fileName}`;
        const persistentUri = `${ATTACHMENTS_DIR}${uniqueName}`;

        await FileSystem.copyAsync({
            from: cacheUri,
            to: persistentUri,
        });

        return persistentUri;
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            const fileName = asset.name || asset.uri.split('/').pop() || 'attachment';

            // Copy from volatile cache to persistent document directory
            const persistentUri = await copyToPersistentStorage(asset.uri, fileName);
            setAttachments([...attachments, persistentUri]);
        } catch (err) {
            Alert.alert(t('error'), t('error'));
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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? t('edit_exam') : t('log_exam')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>{t('exam_type')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder={t('eg_blood_mri')} value={type} onChangeText={setType} />

                <Text style={styles.label}>{t('date')}</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Text style={styles.dateText}>{format(date, 'MMM d, yyyy', { locale: dateLocale })}</Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <Text style={styles.label}>{t('status')}</Text>
                <View style={styles.statusRow}>
                    {(['Scheduled', 'Pending', 'Completed'] as Investigation['status'][]).map(s => (
                        <TouchableOpacity key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
                            <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{t(s.toLowerCase() as any) || s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>{t('result_outcome')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder={t('normal_high_fracture')} value={result} onChangeText={setResult} />

                <Text style={styles.label}>{t('notes')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} placeholder={t('additional_details')} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />

                <Text style={styles.label}>{t('link_appointment_optional')}</Text>
                <TouchableOpacity style={styles.linkButton} onPress={() => setShowLinkModal(true)}>
                    <Ionicons name="link" size={20} color="#3B82F6" />
                    <Text style={styles.linkButtonText}>
                        {linkedAppointmentId
                            ? `${t('linked')}: ${appointments.find(a => a.id === linkedAppointmentId)?.reason || t('appointment')}`
                            : t('select_appointments')}
                    </Text>
                    {linkedAppointmentId && (
                        <TouchableOpacity onPress={() => setLinkedAppointmentId(undefined)} style={{ marginLeft: 'auto' }}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>{t('attachments')}</Text>
                <TouchableOpacity style={styles.attachButton} onPress={handlePickDocument}>
                    <Ionicons name="attach" size={20} color="#3B82F6" />
                    <Text style={styles.attachButtonText}>{t('add_document_photo')}</Text>
                </TouchableOpacity>

                {attachments.length > 0 && (
                    <View style={styles.attachmentList}>
                        {attachments.map((file, index) => (
                            <View key={index} style={styles.attachmentItem}>
                                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
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
                    <Text style={styles.buttonText}>{isEditing ? t('update') : t('save')}</Text>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#3B82F6' }
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
                            <Text style={styles.closeText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal statusBarTranslucent hardwareAccelerated visible={showLinkModal} animationType="none" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('link_appointment')}</Text>
                        <TouchableOpacity onPress={() => setShowLinkModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={appointments}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.apptItem, linkedAppointmentId === item.id && styles.apptItemSelected]} onPress={() => { setLinkedAppointmentId(item.id); setShowLinkModal(false); }}>
                                <View>
                                    <Text style={styles.apptTitle}>{item.reason || t('appointment')}</Text>
                                    <Text style={styles.apptDate}>{format(parseISO(item.dateTime), 'MMM d, yyyy h:mm a', { locale: dateLocale })}</Text>
                                </View>
                                {linkedAppointmentId === item.id && <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>{t('no_appointments_found')}</Text>}
                    />
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
    textArea: { minHeight: 100 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    dateText: { fontSize: 14, color: colors.text },
    statusRow: { flexDirection: 'row', marginBottom: 20 },
    statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.border, marginRight: 8 },
    statusChipActive: { backgroundColor: '#3B82F6' },
    statusText: { fontSize: 14, color: colors.textSecondary },
    statusTextActive: { color: colors.surface },
    linkButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, marginBottom: 20 },
    linkButtonText: { flex: 1, marginLeft: 8, color: '#3B82F6', fontWeight: '600' },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    apptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, marginBottom: 1, borderBottomWidth: 1, borderBottomColor: colors.border },
    apptItemSelected: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
    apptTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    apptDate: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    listContent: { paddingBottom: 20 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 20 },
    attachButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3B82F6' },
    attachButtonText: { marginLeft: 8, color: '#3B82F6', fontWeight: '600' },
    attachmentList: { marginBottom: 20 },
    attachmentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    attachmentName: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937', marginRight: 8 },
});
