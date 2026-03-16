import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Diagnosis } from '../types/index';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

export default function DiagnosisLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { diagnoses, removeDiagnosis, appointments } = useHealthStore();
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
    const [isDiagnosisModalVisible, setIsDiagnosisModalVisible] = useState(false);

    const statusColors: Record<string, string> = {
        Active: '#EF4444',
        Resolved: '#10B981',
        Recurring: '#F59E0B',
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('diagnoses')}</Text>
                <TouchableOpacity onPress={() => router.push('/add-diagnosis')}><Ionicons name="add" size={24} color="#EF4444" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {diagnoses.length > 0 ? (
                    diagnoses.map(d => (
                        <TouchableOpacity key={d.id} style={[styles.card, { borderLeftColor: statusColors[d.status] || '#EF4444', borderLeftWidth: 4 }]} onPress={() => router.push({ pathname: '/diagnosis-details', params: { id: d.id } })} activeOpacity={0.8}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.condition}>{d.condition}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: (statusColors[d.status] || '#EF4444') + '20' }]}>
                                    <Text style={[styles.statusText, { color: statusColors[d.status] || '#EF4444' }]}>{t(d.status.toLowerCase() as any) || d.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.dateText}>{t('diagnosed')}: {format(parseISO(d.dateOfDiagnosis), 'MMM d, yyyy', { locale: dateLocale })}</Text>
                            {d.treatment ? (
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>{t('treatment')}:</Text>
                                    <Text style={styles.sectionText} numberOfLines={2}>{d.treatment}</Text>
                                </View>
                            ) : null}
                            {d.linkedAppointmentIds && d.linkedAppointmentIds.length > 0 && (
                                <View style={styles.section}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="link" size={14} color={colors.textSecondary} />
                                        <Text style={[styles.sectionLabel, { marginLeft: 4 }]}>{d.linkedAppointmentIds.length} {t('linked_appointments')}</Text>
                                    </View>
                                </View>
                            )}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-diagnosis', params: { id: d.id } })}>
                                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.editText}>{t('edit')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => { if (selectedDiagnosis?.id === d.id) setIsDiagnosisModalVisible(false); removeDiagnosis(d.id); }}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={styles.deleteText}>{t('delete')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>{t('no_diagnoses_recorded')}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal transparent statusBarTranslucent hardwareAccelerated visible={isDiagnosisModalVisible} onRequestClose={() => setIsDiagnosisModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setIsDiagnosisModalVisible(false)}>
                    <View style={styles.detailOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.detailContent}>
                                {selectedDiagnosis && (
                                    <>
                                        <View style={styles.detailHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detailTitle}>{selectedDiagnosis.condition}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: (statusColors[selectedDiagnosis.status] || '#EF4444') + '20', alignSelf: 'flex-start', marginTop: 6 }]}>
                                                    <Text style={[styles.statusText, { color: statusColors[selectedDiagnosis.status] || '#EF4444' }]}>{t(selectedDiagnosis.status.toLowerCase() as any) || selectedDiagnosis.status}</Text>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                                <TouchableOpacity onPress={() => { setIsDiagnosisModalVisible(false); router.push({ pathname: '/add-diagnosis', params: { id: selectedDiagnosis.id } }); }}>
                                                    <Ionicons name="pencil" size={22} color="#3B82F6" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setIsDiagnosisModalVisible(false)}>
                                                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.detailBody}>
                                            <View style={styles.detailRow}>
                                                <Ionicons name="calendar-outline" size={20} color="#EF4444" />
                                                <View style={styles.detailRowContent}>
                                                    <Text style={styles.detailLabel}>{t('date_of_diagnosis')}</Text>
                                                    <Text style={styles.detailValue}>{format(parseISO(selectedDiagnosis.dateOfDiagnosis), 'PPPP', { locale: dateLocale })}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Ionicons name="pulse-outline" size={20} color="#EF4444" />
                                                <View style={styles.detailRowContent}>
                                                    <Text style={styles.detailLabel}>{t('status')}</Text>
                                                    <Text style={[styles.detailValue, { color: statusColors[selectedDiagnosis.status] || '#EF4444' }]}>{t(selectedDiagnosis.status.toLowerCase() as any) || selectedDiagnosis.status}</Text>
                                                </View>
                                            </View>
                                            {selectedDiagnosis.treatment && (
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="medkit-outline" size={20} color="#EF4444" />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('treatment')}</Text>
                                                        <Text style={styles.detailValue}>{selectedDiagnosis.treatment}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            {selectedDiagnosis.linkedAppointmentIds && selectedDiagnosis.linkedAppointmentIds.length > 0 && (
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="link-outline" size={20} color="#EF4444" />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('linked_appointments')}</Text>
                                                        {selectedDiagnosis.linkedAppointmentIds.map(apptId => {
                                                            const appt = appointments.find(a => a.id === apptId);
                                                            return (
                                                                <Text key={apptId} style={styles.detailValue}>
                                                                    {appt ? `${appt.reason || appt.doctorName || t('appointment')} — ${format(parseISO(appt.dateTime), 'MMM d, yyyy', { locale: dateLocale })}` : apptId}
                                                                </Text>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        <TouchableOpacity style={styles.deleteFullBtn} onPress={() => { removeDiagnosis(selectedDiagnosis.id); setIsDiagnosisModalVisible(false); }}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            <Text style={styles.deleteFullText}>{t('delete_diagnosis')}</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    content: { flex: 1 },
    scrollContent: { padding: 16 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    condition: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },
    dateText: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    section: { marginBottom: 8 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
    sectionText: { fontSize: 14, color: colors.text },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    detailContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
    detailTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    detailBody: { gap: 16, marginBottom: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    deleteFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteFullText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
