import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Diagnosis } from '../types';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

export default function AddDiagnosisScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { addDiagnosis, updateDiagnosis, diagnoses, appointments } = useHealthStore();
    const [condition, setCondition] = useState('');
    const [date, setDate] = useState(new Date());
    const [status, setStatus] = useState<Diagnosis['status']>('Active');
    const [treatment, setTreatment] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkedAppointmentIds, setLinkedAppointmentIds] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            const existing = diagnoses.find(d => d.id === id);
            if (existing) {
                setCondition(existing.condition);
                setDate(new Date(existing.dateOfDiagnosis));
                setStatus(existing.status);
                setTreatment(existing.treatment || '');
                setLinkedAppointmentIds(existing.linkedAppointmentIds || []);
            }
        }
    }, [id, diagnoses]);

    const handleSubmit = () => {
        if (!condition.trim()) return;
        const data = {
            id: id || Date.now().toString(),
            condition,
            dateOfDiagnosis: date.toISOString(),
            status,
            treatment,
            linkedAppointmentIds,
        };

        if (id) {
            updateDiagnosis(data);
        } else {
            addDiagnosis(data);
        }
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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? t('edit_diagnosis') : t('add_diagnosis')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>{t('condition')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder={t('eg_diabetes')} value={condition} onChangeText={setCondition} />

                <Text style={styles.label}>{t('date_of_diagnosis')}</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                    <Text style={styles.dateText}>{format(date, 'MMM d, yyyy', { locale: dateLocale })}</Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <Text style={styles.label}>{t('status')}</Text>
                <View style={styles.statusRow}>
                    {(['Active', 'Resolved', 'Recurring'] as Diagnosis['status'][]).map(s => (
                        <TouchableOpacity key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
                            <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{t(s.toLowerCase() as any) || s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>{t('treatment_plan_optional')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} placeholder={t('medication_therapy')} value={treatment} onChangeText={setTreatment} multiline textAlignVertical="top" />

                <Text style={styles.label}>{t('link_appointments_optional')}</Text>
                <TouchableOpacity style={styles.linkButton} onPress={() => setShowLinkModal(true)}>
                    <Ionicons name="link" size={20} color="#EF4444" />
                    <Text style={styles.linkButtonText}>{linkedAppointmentIds.length > 0 ? `${linkedAppointmentIds.length} ${t('linked')}` : t('select_appointments')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !condition.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!condition.trim()}>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#EF4444' }
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
                        <Text style={styles.modalTitle}>{t('link_appointments')}</Text>
                        <TouchableOpacity onPress={() => setShowLinkModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={appointments}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.apptItem, linkedAppointmentIds.includes(item.id) && styles.apptItemSelected]} onPress={() => toggleAppointmentLink(item.id)}>
                                <View>
                                    <Text style={styles.apptTitle}>{item.reason || t('appointment')}</Text>
                                    <Text style={styles.apptDate}>{format(parseISO(item.dateTime), 'MMM d, yyyy h:mm a', { locale: dateLocale })}</Text>
                                </View>
                                {linkedAppointmentIds.includes(item.id) && <Ionicons name="checkmark-circle" size={24} color="#EF4444" />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>{t('no_appointments_found')}</Text>}
                    />
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.button} onPress={() => setShowLinkModal(false)}>
                            <Text style={styles.buttonText}>{t('save')}</Text>
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
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    dateText: { fontSize: 14, color: colors.text },
    statusRow: { flexDirection: 'row', marginBottom: 20 },
    statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.border, marginRight: 8 },
    statusChipActive: { backgroundColor: '#EF4444' },
    statusText: { fontSize: 14, color: colors.textSecondary },
    statusTextActive: { color: colors.surface },
    textArea: { minHeight: 100 },
    linkButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, marginBottom: 20 },
    linkButtonText: { marginLeft: 8, color: '#EF4444', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    apptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, marginBottom: 1, borderBottomWidth: 1, borderBottomColor: colors.border },
    apptItemSelected: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
    apptTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    apptDate: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    listContent: { paddingBottom: 20 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 20 },
});
