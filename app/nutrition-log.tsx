import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO, isSameDay } from 'date-fns';
import { PieChart } from 'react-native-gifted-charts';
import { Calendar } from 'react-native-calendars';

export default function NutritionLogScreen() {
    const router = useRouter();
    const { foodEntries, removeFoodEntry } = useHealthStore();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'day' | 'all'>('day');

    const filteredEntries = useMemo(() => {
        if (viewMode === 'all') return foodEntries.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        return foodEntries.filter(e => e.dateTime.split('T')[0] === selectedDate)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [foodEntries, selectedDate, viewMode]);

    const stats = useMemo(() => {
        const totalCalories = filteredEntries.reduce((sum, e) => sum + e.calories, 0);
        const count = filteredEntries.length;
        return { totalCalories, count };
    }, [filteredEntries]);

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredEntries.forEach(e => {
            counts[e.type] = (counts[e.type] || 0) + e.calories; // Calories by type
        });

        const colors = { Breakfast: '#F59E0B', Lunch: '#10B981', Dinner: '#3B82F6', Snack: '#8B5CF6' };
        return Object.entries(counts).map(([name, value]) => ({
            value,
            color: colors[name as keyof typeof colors] || '#9CA3AF',
            text: `${value}`,
            legend: name
        }));
    }, [filteredEntries]);

    // Marked dates for calendar (days with logs)
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        foodEntries.forEach(e => {
            marks[e.dateTime.split('T')[0]] = { marked: true, dotColor: '#F59E0B' };
        });
        marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: '#F59E0B' };
        return marks;
    }, [foodEntries, selectedDate]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Nutrition Log</Text>
                <TouchableOpacity onPress={() => router.push('/add-nutrition')}><Ionicons name="add" size={24} color="#F59E0B" /></TouchableOpacity>
            </View>

            <View style={styles.viewToggle}>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]} onPress={() => setViewMode('day')}><Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>Day View</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'all' && styles.toggleBtnActive]} onPress={() => setViewMode('all')}><Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>All History</Text></TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {viewMode === 'day' && (
                    <View style={styles.calendarContainer}>
                        <Calendar
                            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                            markedDates={markedDates}
                            theme={{
                                todayTextColor: '#F59E0B',
                                arrowColor: '#F59E0B',
                                selectedDayBackgroundColor: '#F59E0B'
                            }}
                        />
                    </View>
                )}

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.totalCalories}</Text>
                        <Text style={styles.statLabel}>Calories</Text>
                    </View>
                    <View style={styles.verticalLine} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.count}</Text>
                        <Text style={styles.statLabel}>Meals</Text>
                    </View>
                </View>

                {chartData.length > 0 && (
                    <View style={styles.chartContainer}>
                        <Text style={styles.sectionTitle}>Calories Breakdown</Text>
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
                    </View>
                )}

                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>{viewMode === 'day' ? format(parseISO(selectedDate), 'MMM d, yyyy') : 'All Entries'}</Text>
                    {filteredEntries.map(e => (
                        <View key={e.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{e.name}</Text>
                                <Text style={styles.cardCalories}>{e.calories} kcal</Text>
                            </View>
                            <View style={styles.cardFooter}>
                                <View style={styles.badge}><Text style={styles.badgeText}>{e.type}</Text></View>
                                <Text style={styles.timeText}>{format(parseISO(e.dateTime), 'h:mm a')}{viewMode === 'all' ? ` • ${format(parseISO(e.dateTime), 'MMM d')}` : ''}</Text>
                                <TouchableOpacity onPress={() => removeFoodEntry(e.id)} style={{ marginLeft: 'auto' }}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    {filteredEntries.length === 0 && <Text style={styles.emptyText}>No entries found.</Text>}
                </View>
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
    toggleBtnActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
    toggleText: { color: '#6B7280', fontWeight: '500' },
    toggleTextActive: { color: '#FFFFFF' },
    content: { flex: 1 },
    calendarContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 8, marginBottom: 16 },
    statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 16, justifyContent: 'space-around', alignItems: 'center' },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    statLabel: { fontSize: 13, color: '#6B7280' },
    verticalLine: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
    chartContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, justifyContent: 'center', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendText: { fontSize: 12, color: '#6B7280' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    cardCalories: { fontSize: 16, fontWeight: '600', color: '#F59E0B' },
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFF7ED', marginRight: 8 },
    badgeText: { fontSize: 12, color: '#F59E0B', fontWeight: '500' },
    timeText: { fontSize: 13, color: '#9CA3AF' },
    emptyText: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', marginTop: 20 },
});
