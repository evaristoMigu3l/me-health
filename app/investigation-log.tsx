import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

export default function InvestigationLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { investigations, removeInvestigation, appointments } = useHealthStore();

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('exams_investigations')}</Text>
                <TouchableOpacity onPress={() => router.push('/add-investigation')}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>

            <FlatList
                data={investigations.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>{t('no_exams_recorded')}</Text>
                    </View>
                }
                renderItem={({ item: i }) => {
                    const linkedAppt = i.linkedAppointmentId ? appointments.find(a => a.id === i.linkedAppointmentId) : null;
                    return (
                        <View style={styles.card}>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/exam-details', params: { id: i.id } })}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{i.type}</Text>
                                    <View style={[styles.statusBadge, i.status === 'Completed' ? styles.statusCompleted : i.status === 'Pending' ? styles.statusPending : styles.statusScheduled]}>
                                        <Text style={[styles.statusText, i.status === 'Completed' ? styles.statusTextCompleted : i.status === 'Pending' ? styles.statusTextPending : styles.statusTextScheduled]}>{t(i.status.toLowerCase() as any) || i.status}</Text>
                                    </View>
                                </View>
                                <Text style={styles.dateText}>{format(parseISO(i.dateTime), 'MMM d, yyyy', { locale: dateLocale })}</Text>

                                {i.result ? (
                                    <View style={styles.resultContainer}>
                                        <Text style={styles.resultLabel}>{t('result')}:</Text>
                                        <Text style={styles.resultText}>{i.result}</Text>
                                    </View>
                                ) : null}

                                {i.attachments && i.attachments.length > 0 && (
                                    <View style={styles.attachmentsContainer}>
                                        <Text style={styles.sectionLabel}>{t('attachments')}:</Text>
                                        {i.attachments.map((file, idx) => (
                                            <View key={idx} style={styles.attachmentChip}>
                                                <Ionicons name="document-text" size={12} color={colors.textSecondary} />
                                                <Text style={styles.attachmentText} numberOfLines={1}>{decodeURIComponent(file).split('/').pop()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {linkedAppt && (
                                    <View style={styles.linkContainer}>
                                        <Ionicons name="link" size={14} color={colors.textSecondary} />
                                        <Text style={styles.linkText}>
                                            {t('linked_to')}: {linkedAppt.reason || linkedAppt.doctorName || t('appointment')} ({format(parseISO(linkedAppt.dateTime), 'MMM d', { locale: dateLocale })})
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-investigation', params: { id: i.id } })}>
                                    <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.editText}>{t('edit')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeInvestigation(i.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={styles.deleteText}>{t('delete')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.border },
    statusCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
    statusScheduled: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
    statusText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    statusTextCompleted: { color: '#10B981' },
    statusTextPending: { color: '#F59E0B' },
    statusTextScheduled: { color: '#3B82F6' },
    dateText: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    resultContainer: { backgroundColor: colors.border, padding: 12, borderRadius: 8, marginBottom: 12 },
    resultLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
    resultText: { fontSize: 15, color: colors.text },
    linkContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    linkText: { fontSize: 13, color: colors.textSecondary, marginLeft: 6 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
    attachmentsContainer: { marginBottom: 12 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
    attachmentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8, marginBottom: 4, alignSelf: 'flex-start' },
    attachmentText: { fontSize: 12, color: '#4B5563', marginLeft: 4 },
});
