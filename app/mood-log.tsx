import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { PieChart } from 'react-native-gifted-charts';
import { MoodLog } from '../types/index';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';

export default function MoodLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { moodLogs, removeMoodLog } = useHealthStore();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('analytics');
    const [selectedMood, setSelectedMood] = useState<MoodLog | null>(null);
    const [isMoodModalVisible, setIsMoodModalVisible] = useState(false);

    const dateLocale = language === 'pt' ? ptBR : enUS;

    const moodConfig: Record<string, { emoji: string; color: string }> = {
        Happy: { emoji: '😊', color: '#10B981' },
        Neutral: { emoji: '😐', color: colors.textSecondary },
        Anxious: { emoji: '😰', color: '#F59E0B' },
        Sad: { emoji: '😢', color: '#3B82F6' },
        Angry: { emoji: '😠', color: '#EF4444' },
        Bored: { emoji: '😑', color: '#8B5CF6' },
    };

    const getMoodConfig = (m: MoodLog) => {
        if (moodConfig[m.feeling]) {
            return moodConfig[m.feeling];
        }
        return { emoji: m.emoji || '✨', color: '#6366F1' };
    };

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        moodLogs.forEach(m => {
            counts[m.feeling] = (counts[m.feeling] || 0) + 1;
        });

        return Object.entries(counts).map(([feeling, value]) => {
            const tempLog: MoodLog = { id: '', dateTime: '', feeling, notes: '' };
            return {
                value,
                color: getMoodConfig(tempLog).color,
                text: `${value}`,
                legend: t(feeling.toLowerCase() as any) || feeling
            };
        });
    }, [moodLogs, t]);

    const sortedLogs = useMemo(() => {
        return [...moodLogs].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [moodLogs]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('mood_log') || 'Mood Log'}</Text>
                <TouchableOpacity onPress={() => router.push('/add-mood')}><Ionicons name="add" size={24} color="#EC4899" /></TouchableOpacity>
            </View>

            <View style={styles.viewToggle}>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'analytics' && styles.toggleBtnActive]} onPress={() => setViewMode('analytics')}><Text style={[styles.toggleText, viewMode === 'analytics' && styles.toggleTextActive]}>{t('analytics') || 'Analytics'}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} onPress={() => setViewMode('list')}><Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>{t('history') || 'History'}</Text></TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {viewMode === 'analytics' && (
                    <>
                        <View style={styles.chartContainer}>
                            <Text style={styles.sectionTitle}>{t('mood_distribution') || 'Mood Distribution'}</Text>
                            {moodLogs.length > 0 ? (
                                <>
                                    <View style={{ alignItems: 'center' }}>
                                        <PieChart innerCircleColor={colors.surface} data={chartData} donut radius={80} innerRadius={50} showText textColor={colors.text} showTextBackground={true} textBackgroundColor={colors.surface} textBackgroundRadius={12} textSize={11} fontWeight="bold" />
                                    </View>
                                    <View style={styles.legendContainer}>
                                        {chartData.map((d, i) => (
                                            <View key={i} style={styles.legendItem}>
                                                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                                                <Text style={styles.legendText}>{d.legend}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.emptyText}>{t('no_logs') || 'No logs yet.'}</Text>
                            )}
                        </View>
                    </>
                )}

                {(viewMode === 'list' || viewMode === 'analytics') && (
                    <View style={styles.listContainer}>
                        <Text style={styles.sectionTitle}>{t('recent_moods') || 'Recent Moods'}</Text>
                        {sortedLogs.map(m => {
                            const config = getMoodConfig(m);
                            return (
                                <TouchableOpacity key={m.id} style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]} onPress={() => router.push({ pathname: '/mood-details', params: { id: m.id } })} activeOpacity={0.8}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.emoji}>{config.emoji}</Text>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.cardTitle, { color: config.color }]}>{t(m.feeling.toLowerCase() as any) || m.feeling}</Text>
                                            <Text style={styles.timeText}>{format(parseISO(m.dateTime), 'MMM d, HH:mm', { locale: dateLocale })}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity onPress={() => router.push({ pathname: '/add-mood', params: { id: m.id } })}>
                                                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => { if (selectedMood?.id === m.id) setIsMoodModalVisible(false); removeMoodLog(m.id); }}>
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {m.notes ? <Text style={styles.notes} numberOfLines={2}>"{m.notes}"</Text> : null}
                                    <Text style={styles.tapHint}>{t('tap_to_view_details') || 'Tap to view details'}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {sortedLogs.length === 0 && <Text style={styles.emptyText}>{t('no_logs') || 'No logs found.'}</Text>}
                    </View>
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal transparent statusBarTranslucent hardwareAccelerated visible={isMoodModalVisible} onRequestClose={() => setIsMoodModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setIsMoodModalVisible(false)}>
                    <View style={styles.detailOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.detailContent}>
                                {selectedMood && (() => {
                                    const config = getMoodConfig(selectedMood);
                                    return (
                                        <>
                                            <View style={styles.detailHeader}>
                                                <Text style={styles.detailEmoji}>{config.emoji}</Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.detailTitle, { color: config.color }]}>{t(selectedMood.feeling.toLowerCase() as any) || selectedMood.feeling}</Text>
                                                    <Text style={styles.detailSubtitle}>{format(parseISO(selectedMood.dateTime), 'PPP', { locale: dateLocale })}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                                    <TouchableOpacity onPress={() => { setIsMoodModalVisible(false); router.push({ pathname: '/add-mood', params: { id: selectedMood.id } }); }}>
                                                        <Ionicons name="pencil" size={22} color="#3B82F6" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => setIsMoodModalVisible(false)}>
                                                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <View style={styles.detailBody}>
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="time-outline" size={20} color="#EC4899" />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('date_time') || 'Date & Time'}</Text>
                                                        <Text style={styles.detailValue}>{format(parseISO(selectedMood.dateTime), 'PPPP', { locale: dateLocale })} at {format(parseISO(selectedMood.dateTime), 'HH:mm')}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="happy-outline" size={20} color="#EC4899" />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('feeling') || 'Feeling'}</Text>
                                                        <Text style={[styles.detailValue, { color: config.color }]}>{t(selectedMood.feeling.toLowerCase() as any) || selectedMood.feeling}</Text>
                                                    </View>
                                                </View>
                                                {selectedMood.notes && (
                                                    <View style={styles.detailRow}>
                                                        <Ionicons name="document-text-outline" size={20} color="#EC4899" />
                                                        <View style={styles.detailRowContent}>
                                                            <Text style={styles.detailLabel}>{t('notes') || 'Notes'}</Text>
                                                            <Text style={styles.detailValue}>{selectedMood.notes}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>

                                            <TouchableOpacity style={styles.deleteFullBtn} onPress={() => { removeMoodLog(selectedMood.id); setIsMoodModalVisible(false); }}>
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                <Text style={styles.deleteFullText}>{t('delete_log') || 'Delete Log'}</Text>
                                            </TouchableOpacity>
                                        </>
                                    );
                                })()}
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
    viewToggle: { flexDirection: 'row', padding: 16, justifyContent: 'center', gap: 12 },
    toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    toggleBtnActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
    toggleText: { color: colors.textSecondary, fontWeight: '500' },
    toggleTextActive: { color: colors.surface },
    content: { flex: 1 },
    chartContainer: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, justifyContent: 'center', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendText: { fontSize: 12, color: colors.textSecondary },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    emoji: { fontSize: 28 },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    timeText: { fontSize: 12, color: colors.textSecondary },
    notes: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginTop: 6 },
    tapHint: { fontSize: 11, color: colors.textSecondary, textAlign: 'right', marginTop: 8 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 20 },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    detailContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    detailEmoji: { fontSize: 48 },
    detailTitle: { fontSize: 24, fontWeight: '700' },
    detailSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    detailBody: { gap: 16, marginBottom: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    deleteFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteFullText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
