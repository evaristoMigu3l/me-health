import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { PieChart } from 'react-native-gifted-charts';
import { MoodLog } from '../types';

export default function MoodLogScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { moodLogs, removeMoodLog } = useHealthStore();
    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('analytics');

    const moodConfig: Record<MoodLog['feeling'], { emoji: string; color: string }> = {
        Happy: { emoji: '😊', color: '#10B981' },
        Neutral: { emoji: '😐', color: colors.textSecondary },
        Anxious: { emoji: '😰', color: '#F59E0B' },
        Sad: { emoji: '😢', color: '#3B82F6' },
        Angry: { emoji: '😠', color: '#EF4444' },
        Bored: { emoji: '😑', color: '#8B5CF6' },
    };

    const getMoodConfig = (m: MoodLog) => {
        if (moodConfig[m.feeling as keyof typeof moodConfig]) {
            return moodConfig[m.feeling as keyof typeof moodConfig];
        }
        return { emoji: m.emoji || '✨', color: '#6366F1' }; // Fallback for custom
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
                legend: feeling
            };
        });
    }, [moodLogs]);

    const sortedLogs = useMemo(() => {
        return [...moodLogs].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [moodLogs]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Mood Log</Text>
                <TouchableOpacity onPress={() => router.push('/add-mood')}><Ionicons name="add" size={24} color="#EC4899" /></TouchableOpacity>
            </View>

            <View style={styles.viewToggle}>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'analytics' && styles.toggleBtnActive]} onPress={() => setViewMode('analytics')}><Text style={[styles.toggleText, viewMode === 'analytics' && styles.toggleTextActive]}>Analytics</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} onPress={() => setViewMode('list')}><Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>History</Text></TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {viewMode === 'analytics' && (
                    <>
                        <View style={styles.chartContainer}>
                            <Text style={styles.sectionTitle}>Mood Distribution</Text>
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
                                <Text style={styles.emptyText}>No mood logs yet.</Text>
                            )}
                        </View>
                    </>
                )}

                {(viewMode === 'list' || viewMode === 'analytics') && (
                    <View style={styles.listContainer}>
                        <Text style={styles.sectionTitle}>Recent Moods</Text>
                        {sortedLogs.map(m => {
                            const config = getMoodConfig(m);
                            return (
                                <View key={m.id} style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.emoji}>{config.emoji}</Text>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.cardTitle, { color: config.color }]}>{m.feeling}</Text>
                                            <Text style={styles.timeText}>{format(parseISO(m.dateTime), 'MMM d, h:mm a')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity onPress={() => router.push({ pathname: '/add-mood', params: { id: m.id } })}>
                                                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => removeMoodLog(m.id)}>
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {m.notes ? <Text style={styles.notes}>"{m.notes}"</Text> : null}
                                </View>
                            );
                        })}
                        {sortedLogs.length === 0 && <Text style={styles.emptyText}>No logs found.</Text>}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
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
    emoji: { fontSize: 24 },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    timeText: { fontSize: 12, color: colors.textSecondary },
    notes: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginTop: 4 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 20 },
});
