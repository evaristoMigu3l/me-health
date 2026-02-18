import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { PieChart } from 'react-native-gifted-charts';
import { MoodLog } from '../types';

const moodConfig: Record<MoodLog['feeling'], { emoji: string; color: string }> = {
    Happy: { emoji: '😊', color: '#10B981' },
    Neutral: { emoji: '😐', color: '#6B7280' },
    Anxious: { emoji: '😰', color: '#F59E0B' },
    Sad: { emoji: '😢', color: '#3B82F6' },
    Angry: { emoji: '😠', color: '#EF4444' },
    Bored: { emoji: '😑', color: '#8B5CF6' },
};

export default function MoodLogScreen() {
    const router = useRouter();
    const { moodLogs, removeMoodLog } = useHealthStore();
    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('analytics');

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        moodLogs.forEach(m => {
            counts[m.feeling] = (counts[m.feeling] || 0) + 1;
        });

        return Object.entries(counts).map(([feeling, value]) => ({
            value,
            color: moodConfig[feeling as MoodLog['feeling']]?.color || '#9CA3AF',
            text: `${value}`,
            legend: feeling
        }));
    }, [moodLogs]);

    const sortedLogs = useMemo(() => {
        return [...moodLogs].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [moodLogs]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
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
                                        <PieChart data={chartData} donut radius={80} innerRadius={50} showText textColor="white" textSize={10} />
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
                            const config = moodConfig[m.feeling];
                            return (
                                <View key={m.id} style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.emoji}>{config.emoji}</Text>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.cardTitle, { color: config.color }]}>{m.feeling}</Text>
                                            <Text style={styles.timeText}>{format(parseISO(m.dateTime), 'MMM d, h:mm a')}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeMoodLog(m.id)}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
    viewToggle: { flexDirection: 'row', padding: 16, justifyContent: 'center', gap: 12 },
    toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
    toggleBtnActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
    toggleText: { color: '#6B7280', fontWeight: '500' },
    toggleTextActive: { color: '#FFFFFF' },
    content: { flex: 1 },
    chartContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, justifyContent: 'center', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendText: { fontSize: 12, color: '#6B7280' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    emoji: { fontSize: 24 },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    timeText: { fontSize: 12, color: '#9CA3AF' },
    notes: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginTop: 4 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', marginTop: 20 },
});
