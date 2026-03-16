import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Activity } from '../types';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { ptBR, enUS } from 'date-fns/locale';
import { useThemeStore } from '../stores/useThemeStore';

export default function ActivityLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { activities, removeActivity } = useHealthStore();
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);

    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [activities]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('activity')}</Text>
                <TouchableOpacity onPress={() => router.push('/add-activity')}><Ionicons name="add" size={24} color="#8B5CF6" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.listContainer}>
                {sortedActivities.map(a => (
                    <TouchableOpacity key={a.id} style={styles.card} onPress={() => router.push({ pathname: '/activity-details', params: { id: a.id } })} activeOpacity={0.8}>
                        <View style={styles.cardHeader}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{t(a.category.toLowerCase().replace(/ /g, '_') as any) || a.category}</Text>
                            </View>
                            <Text style={styles.timeText}>{format(parseISO(a.dateTime), 'MMM d, HH:mm', { locale: dateLocale })}</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.activityTitle}>{a.specificActivity}</Text>
                            <View style={styles.durationBadge}>
                                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                <Text style={styles.durationText}>
                                    {a.durationHours > 0 ? `${a.durationHours}h ` : ''}{a.durationMinutes}m
                                </Text>
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-activity', params: { id: a.id } })}>
                                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                <Text style={styles.editText}>{t('edit')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => { if (selectedActivity?.id === a.id) setIsActivityModalVisible(false); removeActivity(a.id); }}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                <Text style={styles.deleteText}>{t('delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
                {sortedActivities.length === 0 && <Text style={styles.emptyText}>{t('no_activities')}</Text>}
            </ScrollView>

            {/* Detail Modal */}
            <Modal transparent statusBarTranslucent hardwareAccelerated visible={isActivityModalVisible} onRequestClose={() => setIsActivityModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setIsActivityModalVisible(false)}>
                    <View style={styles.detailOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.detailContent}>
                                {selectedActivity && (
                                    <>
                                        <View style={styles.detailHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detailTitle}>{selectedActivity.specificActivity}</Text>
                                                <View style={[styles.categoryBadge, { marginTop: 6, alignSelf: 'flex-start' }]}>
                                                    <Text style={styles.categoryText}>{t(selectedActivity.category.toLowerCase().replace(/ /g, '_') as any) || selectedActivity.category}</Text>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                                <TouchableOpacity onPress={() => { setIsActivityModalVisible(false); router.push({ pathname: '/add-activity', params: { id: selectedActivity.id } }); }}>
                                                    <Ionicons name="pencil" size={22} color="#3B82F6" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setIsActivityModalVisible(false)}>
                                                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.detailBody}>
                                            <View style={styles.detailRow}>
                                                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                                                <View style={styles.detailRowContent}>
                                                    <Text style={styles.detailLabel}>{t('date')}</Text>
                                                    <Text style={styles.detailValue}>{format(parseISO(selectedActivity.dateTime), 'PPPP', { locale: dateLocale })}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                                                <View style={styles.detailRowContent}>
                                                    <Text style={styles.detailLabel}>{t('duration')}</Text>
                                                    <Text style={styles.detailValue}>
                                                        {selectedActivity.durationHours > 0 ? `${selectedActivity.durationHours} ${t('hours')} ` : ''}{selectedActivity.durationMinutes} {t('minutes')}
                                                    </Text>
                                                </View>
                                            </View>

                                            {selectedActivity.notes && (
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="document-text-outline" size={20} color="#8B5CF6" />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('notes')}</Text>
                                                        <Text style={styles.detailValue}>{selectedActivity.notes}</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        <TouchableOpacity style={styles.deleteFullBtn} onPress={() => { removeActivity(selectedActivity.id); setIsActivityModalVisible(false); }}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            <Text style={styles.deleteFullText}>{t('delete_activity')}</Text>
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
    listContainer: { paddingHorizontal: 16, paddingVertical: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    categoryText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600' },
    timeText: { fontSize: 12, color: colors.textSecondary },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    activityTitle: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 12 },
    durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    durationText: { marginLeft: 4, fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 40 },
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    detailContent: { backgroundColor: colors.surface, borderRadius: 16, width: '100%', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12 },
    detailTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    detailBody: { gap: 14 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    deleteFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444' },
    deleteFullText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
