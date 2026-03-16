import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { useHealthStore } from '../../stores/useHealthStore';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';

const moodEmojis: Record<string, string> = { Happy: '😊', Neutral: '😐', Anxious: '😰', Sad: '😢', Angry: '😠', Bored: '😑' };

export default function HomeScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { profile } = useUserStore();
    const { t } = useTranslation();
    const {
        symptoms,
        medications,
        measurements,
        moodLogs,
        sleepLogs,
        activities,
        foodEntries,
        appointments
    } = useHealthStore();

    const currentMedications = useMemo(() => {
        const now = new Date().getTime();
        return medications.filter(m => !m.endDate || new Date(m.endDate).getTime() >= now);
    }, [medications]);

    const totalCalories = foodEntries.reduce((sum: number, f: any) => sum + f.calories, 0);
    const totalSleep = sleepLogs.reduce((sum, s) => sum + s.hours, 0);
    const totalActivity = activities.reduce((sum, a) => sum + a.durationHours * 60 + a.durationMinutes, 0);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>{t('greeting', { name: profile?.name || t('guest') })}</Text>
                    <Text style={styles.subtitle}>{t('health_overview')}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}><Text style={styles.statValue}>{symptoms.length}</Text><Text style={styles.statLabel}>{t('symptoms')}</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{medications.length}</Text><Text style={styles.statLabel}>{t('medications')}</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{measurements.length}</Text><Text style={styles.statLabel}>{t('measurements')}</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-symptom')}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}><Ionicons name="pulse" size={24} color="#EF4444" /></View>
                        <View style={styles.actionContent}><Text style={styles.actionTitle}>{t('log_symptoms')}</Text><Text style={styles.actionSubtitle}>{t('track_feeling')}</Text></View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-medication')}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}><Ionicons name="medkit" size={24} color="#3B82F6" /></View>
                        <View style={styles.actionContent}><Text style={styles.actionTitle}>{t('add_medication')}</Text><Text style={styles.actionSubtitle}>{t('update_schedule')}</Text></View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('today_summary')}</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}><Ionicons name="restaurant" size={20} color="#F59E0B" /><Text style={styles.summaryValue}>{totalCalories}</Text><Text style={styles.summaryLabel}>{t('calories')}</Text></View>
                        <View style={styles.summaryItem}><Ionicons name="moon" size={20} color="#6366F1" /><Text style={styles.summaryValue}>{totalSleep}h</Text><Text style={styles.summaryLabel}>{t('sleep')}</Text></View>
                        <TouchableOpacity style={styles.summaryItem} onPress={() => router.push('/activity-log')} activeOpacity={0.7}><Ionicons name="walk" size={20} color="#8B5CF6" /><Text style={styles.summaryValue}>{Math.floor(totalActivity / 60)}m</Text><Text style={styles.summaryLabel}>{t('activity')}</Text></TouchableOpacity>
                        <View style={styles.summaryItem}><Ionicons name="happy" size={20} color="#EC4899" /><Text style={styles.summaryValue}>{moodLogs.length}</Text><Text style={styles.summaryLabel}>{t('mood')}</Text></View>
                    </View>
                </View>

                {symptoms.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('recent_symptoms')}</Text>
                        {symptoms.slice(0, 2).map((s) => (
                            <TouchableOpacity key={s.id} style={styles.entryCard} onPress={() => router.push({ pathname: '/symptom-details', params: { id: s.id } })} activeOpacity={0.7}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle}>{s.name}</Text>
                                    <View style={[styles.badge, { backgroundColor: s.intensity >= 75 ? 'rgba(239, 68, 68, 0.15)' : s.intensity >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                                        <Text style={[styles.badgeText, { color: s.intensity >= 75 ? '#EF4444' : s.intensity >= 50 ? '#F59E0B' : '#10B981' }]}>{t(s.intensityLabel.toLowerCase().replace(' ', '_') as any) || s.intensityLabel}</Text>
                                    </View>
                                </View>
                                <Text style={styles.entryDate}>{new Date(s.dateStarted).toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {currentMedications.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('current_medications')}</Text>
                        {currentMedications.slice(0, 2).map((m) => (
                            <TouchableOpacity key={m.id} style={styles.entryCard} onPress={() => router.push({ pathname: '/medication-details', params: { id: m.id } })} activeOpacity={0.7}>
                                <View style={styles.entryHeader}><Text style={styles.entryTitle}>{m.name}</Text><Text style={styles.entrySubtitle}>{m.preparation}</Text></View>
                                <Text style={styles.entryDate}>{t('daily_times', { times: m.timesPerDay })}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {activities.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('recent_activities')}</Text>
                        {activities.slice(0, 2).map((a) => (
                            <TouchableOpacity key={a.id} style={styles.entryCard} onPress={() => router.push({ pathname: '/activity-details', params: { id: a.id } })} activeOpacity={0.7}>
                                <View style={styles.entryHeader}><Text style={styles.entryTitle}>{a.specificActivity}</Text><Text style={styles.entrySubtitle}>{a.category}</Text></View>
                                <Text style={styles.entryDate}>{new Date(a.dateTime).toLocaleDateString()} - {a.durationHours > 0 ? `${a.durationHours}h ` : ''}{a.durationMinutes}m</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {moodLogs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('recent_mood')}</Text>
                        <View style={styles.moodRow}>
                            {moodLogs.slice(-7).map((m) => (
                                <TouchableOpacity key={m.id} style={styles.moodItem} onPress={() => router.push({ pathname: '/mood-details', params: { id: m.id } })} activeOpacity={0.7}>
                                    <Text style={styles.moodEmoji}>{moodEmojis[m.feeling] || m.emoji || '✨'}</Text>
                                    <Text style={styles.moodDate}>{new Date(m.dateTime).getDate()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {appointments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('upcoming_appointments')}</Text>
                        {appointments.slice(0, 2).map((a) => (
                            <TouchableOpacity key={a.id} style={styles.entryCard} onPress={() => router.push('/appointment-log')} activeOpacity={0.7}>
                                <View style={styles.entryHeader}><Text style={styles.entryTitle}>{a.reason}</Text><Text style={styles.entrySubtitle}>{a.type}</Text></View>
                                <Text style={styles.entryDate}>{new Date(a.dateTime).toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {symptoms.length === 0 && medications.length === 0 && measurements.length === 0 && moodLogs.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="heart" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyTitle}>{t('no_data')}</Text>
                        <Text style={styles.emptySubtitle}>{t('start_tracking')}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    header: { marginBottom: 20 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
    statsRow: { flexDirection: 'row', marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
    actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    actionContent: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    actionSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    summaryGrid: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 16, justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 },
    summaryLabel: { fontSize: 12, color: colors.textSecondary },
    entryCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    entrySubtitle: { fontSize: 14, color: colors.textSecondary },
    entryDate: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '500' },
    moodRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 16, justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    moodItem: { alignItems: 'center' },
    moodEmoji: { fontSize: 24 },
    moodDate: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    emptyCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
});
