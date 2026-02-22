import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

type FilterType = 'all' | 'week' | 'month' | 'year';
type SortBy = 'date' | 'hours' | 'quality';

function CustomCalendar({ markedDates, selectedDate, onSelectDate, onClose, styles, colors }: { markedDates: Record<string, any>, selectedDate: string | null, onSelectDate: (d: string) => void, onClose: () => void, styles: any, colors: any }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) });

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.calendarMonth}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}><Ionicons name="chevron-forward" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <View style={styles.weekDays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <Text key={d} style={styles.weekDay}>{d}</Text>)}
            </View>
            <View style={styles.daysGrid}>
                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    const isMarked = markedDates[dateStr];
                    return (
                        <TouchableOpacity key={dateStr} style={[styles.day, isSelected && styles.daySelected]} onPress={() => onSelectDate(dateStr)}>
                            <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{format(day, 'd')}</Text>
                            {isMarked && <View style={[styles.dayDot, { backgroundColor: isMarked.dotColor || '#6366F1' }]} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View style={styles.calendarFooter}>
                <TouchableOpacity style={styles.clearButton} onPress={onClose}><Text style={styles.clearButtonText}>Done</Text></TouchableOpacity>
            </View>
        </View>
    );
}

export default function SleepLogScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { sleepLogs, removeSleepLog } = useHealthStore();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [minHours, setMinHours] = useState(0);
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const qualityColors = { Poor: '#EF4444', Fair: '#F59E0B', Good: '#10B981', Excellent: '#059669' };

    const filteredLogs = useMemo(() => {
        let result = [...sleepLogs];
        const now = new Date();

        if (filterType === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            result = result.filter(s => new Date(s.dateTime) >= weekAgo);
        } else if (filterType === 'month') {
            result = result.filter(s => isWithinInterval(new Date(s.dateTime), { start: startOfMonth(now), end: endOfMonth(now) }));
        } else if (filterType === 'year') {
            result = result.filter(s => new Date(s.dateTime).getFullYear() === now.getFullYear());
        }

        if (selectedDate) {
            result = result.filter(s => format(parseISO(s.dateTime), 'yyyy-MM-dd') === selectedDate);
        }

        if (search) {
            result = result.filter(s => s.quality.toLowerCase().includes(search.toLowerCase()));
        }

        if (minHours > 0) {
            result = result.filter(s => s.hours >= minHours);
        }

        result.sort((a, b) => {
            if (sortBy === 'date') return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
            if (sortBy === 'hours') return b.hours - a.hours;
            return a.quality.localeCompare(b.quality);
        });

        return result;
    }, [sleepLogs, filterType, selectedDate, search, minHours, sortBy]);

    const qualityStats = useMemo(() => {
        const total = filteredLogs.length;
        if (total === 0) return { Poor: 0, Fair: 0, Good: 0, Excellent: 0 };
        const stats = { Poor: 0, Fair: 0, Good: 0, Excellent: 0 };
        filteredLogs.forEach(s => stats[s.quality]++);
        return stats;
    }, [filteredLogs]);

    const markedDates = sleepLogs.reduce((acc, s) => {
        const date = format(parseISO(s.dateTime), 'yyyy-MM-dd');
        acc[date] = { marked: true, dotColor: qualityColors[s.quality] };
        return acc;
    }, {} as Record<string, any>);

    const avgHours = filteredLogs.length > 0 ? (filteredLogs.reduce((sum, s) => sum + s.hours, 0) / filteredLogs.length).toFixed(1) : 0;

    const handleDateSelect = (date: string) => {
        if (selectedDate === date) {
            setSelectedDate(null);
        } else {
            setSelectedDate(date);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Sleep Log</Text>
                <TouchableOpacity onPress={() => router.push('/add-sleep')}><Ionicons name="add" size={24} color="#6366F1" /></TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput placeholderTextColor={colors.textSecondary} style={styles.searchInput} placeholder="Search sleep logs..." value={search} onChangeText={setSearch} />
                </View>
                <TouchableOpacity style={[styles.filterButton, showFilters && styles.filterButtonActive]} onPress={() => setShowFilters(!showFilters)}>
                    <Ionicons name="options" size={20} color={showFilters ? '#6366F1' : colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, selectedDate && styles.filterButtonActive]} onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar" size={20} color={selectedDate ? '#6366F1' : colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={styles.filterPanel}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Period:</Text>
                        {(['all', 'week', 'month', 'year'] as FilterType[]).map(t => (
                            <TouchableOpacity key={t} style={[styles.filterChip, filterType === t && styles.filterChipActive]} onPress={() => setFilterType(t)}>
                                <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Min Hours:</Text>
                        {[0, 5, 6, 7, 8].map(i => (
                            <TouchableOpacity key={i} style={[styles.filterChip, minHours === i && styles.filterChipActive]} onPress={() => setMinHours(i)}>
                                <Text style={[styles.filterChipText, minHours === i && styles.filterChipTextActive]}>{i === 0 ? 'All' : `${i}+`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Sort:</Text>
                        {(['date', 'hours', 'quality'] as SortBy[]).map(s => (
                            <TouchableOpacity key={s} style={[styles.filterChip, sortBy === s && styles.filterChipActive]} onPress={() => setSortBy(s)}>
                                <Text style={[styles.filterChipText, sortBy === s && styles.filterChipTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {filteredLogs.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Quality Distribution</Text>
                    <View style={styles.pieContainer}>
                        {Object.entries(qualityStats).map(([label, count]) => {
                            const total = filteredLogs.length;
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            if (count === 0) return null;
                            return (
                                <View key={label} style={styles.pieItem}>
                                    <View style={[styles.pieSlice, { backgroundColor: qualityColors[label as keyof typeof qualityColors] }]} />
                                    <Text style={styles.pieLabel}>{label}</Text>
                                    <Text style={styles.pieValue}>{count} ({percentage.toFixed(0)}%)</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={styles.statsRow}>
                <View style={styles.statItem}><Text style={styles.statValue}>{filteredLogs.length}</Text><Text style={styles.statLabel}>Total</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={[styles.statValue, { color: '#6366F1' }]}>{avgHours}h</Text><Text style={styles.statLabel}>Avg Sleep</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={[styles.statValue, { color: '#10B981' }]}>{qualityStats.Good + qualityStats.Excellent}</Text><Text style={styles.statLabel}>Good+</Text></View>
            </View>

            <ScrollView style={styles.listSection} contentContainerStyle={styles.listContent}>
                {filteredLogs.length === 0 ? (
                    <View style={styles.emptyState}><Ionicons name="bed" size={48} color={colors.textSecondary} /><Text style={styles.emptyText}>No sleep logs found</Text></View>
                ) : (
                    filteredLogs.map(s => (
                        <View key={s.id} style={styles.sleepCard}>
                            <View style={styles.sleepHeader}>
                                <View style={[styles.qualityDot, { backgroundColor: qualityColors[s.quality] }]} />
                                <Text style={styles.sleepName}>{s.quality}</Text>
                                <View style={[styles.qualityBadge, { backgroundColor: qualityColors[s.quality] + '20' }]}>
                                    <Text style={[styles.qualityText, { color: qualityColors[s.quality] }]}>{s.hours}h</Text>
                                </View>
                            </View>
                            <View style={styles.sleepDetails}>
                                <View style={styles.detailItem}><Ionicons name="calendar-outline" size={16} color={colors.textSecondary} /><Text style={styles.detailText}>{format(parseISO(s.dateTime), 'MMM d, yyyy h:mm a')}</Text></View>
                            </View>
                            {s.notes && <Text style={styles.notes}>{s.notes}</Text>}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-sleep', params: { id: s.id } })}>
                                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeSleepLog(s.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showCalendar} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomCalendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={handleDateSelect} onClose={() => setShowCalendar(false)} styles={styles} colors={colors} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 16 },
    filterButton: { padding: 10, marginLeft: 4, borderRadius: 8, backgroundColor: colors.surface },
    filterButtonActive: { backgroundColor: '#E0E7FF' },
    filterPanel: { backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    filterLabel: { fontSize: 14, color: colors.textSecondary, marginRight: 12, width: 100 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.border, marginRight: 8 },
    filterChipActive: { backgroundColor: '#6366F1' },
    filterChipText: { fontSize: 13, color: colors.textSecondary },
    filterChipTextActive: { color: colors.surface },
    chartSection: { backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
    chartTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    pieContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    pieItem: { alignItems: 'center', width: '45%', marginBottom: 12 },
    pieSlice: { width: 16, height: 16, borderRadius: 8, marginBottom: 4 },
    pieLabel: { fontSize: 13, fontWeight: '500', color: colors.text },
    pieValue: { fontSize: 12, color: colors.textSecondary },
    statsRow: { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: colors.border },
    statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    listSection: { flex: 1, marginTop: 16 },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
    sleepCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
    sleepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    qualityDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    sleepName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
    qualityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    qualityText: { fontSize: 12, fontWeight: '500' },
    sleepDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginTop: 4 },
    detailText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4 },
    notes: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginBottom: 8 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    calendarContainer: { padding: 8 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    calendarMonth: { fontSize: 18, fontWeight: '600', color: colors.text },
    weekDays: { flexDirection: 'row', marginBottom: 8 },
    weekDay: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    day: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    daySelected: { backgroundColor: '#6366F1' },
    dayText: { fontSize: 14, color: colors.text },
    dayTextSelected: { color: colors.surface, fontWeight: '600' },
    dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
    calendarFooter: { marginTop: 16, alignItems: 'flex-end' },
    clearButton: { paddingHorizontal: 20, paddingVertical: 10 },
    clearButtonText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
});
