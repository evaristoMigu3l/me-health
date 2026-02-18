import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

type FilterType = 'all' | 'week' | 'month' | 'year';
type SortBy = 'date' | 'intensity' | 'name';

function CustomCalendar({ markedDates, selectedDate, onSelectDate, onClose }: { markedDates: Record<string, any>, selectedDate: string | null, onSelectDate: (d: string) => void, onClose: () => void }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) });

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}><Ionicons name="chevron-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                <Text style={styles.calendarMonth}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}><Ionicons name="chevron-forward" size={24} color="#1A1A1A" /></TouchableOpacity>
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
                            {isMarked && <View style={[styles.dayDot, { backgroundColor: isMarked.dotColor || '#3B82F6' }]} />}
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

export default function SymptomsLogScreen() {
    const router = useRouter();
    const { symptoms, removeSymptom } = useHealthStore();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [minIntensity, setMinIntensity] = useState(0);
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const intensityColors = { Mild: '#10B981', Moderate: '#F59E0B', Severe: '#EF4444', 'Very Severe': '#DC2626' };

    const filteredSymptoms = useMemo(() => {
        let result = [...symptoms];
        const now = new Date();

        if (filterType === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            result = result.filter(s => new Date(s.dateStarted) >= weekAgo);
        } else if (filterType === 'month') {
            result = result.filter(s => isWithinInterval(new Date(s.dateStarted), { start: startOfMonth(now), end: endOfMonth(now) }));
        } else if (filterType === 'year') {
            result = result.filter(s => new Date(s.dateStarted).getFullYear() === now.getFullYear());
        }

        if (selectedDate) {
            result = result.filter(s => format(parseISO(s.dateStarted), 'yyyy-MM-dd') === selectedDate);
        }

        if (search) {
            result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
        }

        if (minIntensity > 0) {
            result = result.filter(s => s.intensity >= minIntensity);
        }

        result.sort((a, b) => {
            if (sortBy === 'date') return new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime();
            if (sortBy === 'intensity') return b.intensity - a.intensity;
            return a.name.localeCompare(b.name);
        });

        return result;
    }, [symptoms, filterType, selectedDate, search, minIntensity, sortBy]);

    const intensityStats = useMemo(() => {
        const total = filteredSymptoms.length;
        if (total === 0) return { Mild: 0, Moderate: 0, Severe: 0, 'Very Severe': 0 };
        const stats = { Mild: 0, Moderate: 0, Severe: 0, 'Very Severe': 0 };
        filteredSymptoms.forEach(s => stats[s.intensityLabel]++);
        return stats;
    }, [filteredSymptoms]);

    const markedDates = symptoms.reduce((acc, s) => {
        const date = format(parseISO(s.dateStarted), 'yyyy-MM-dd');
        acc[date] = { marked: true, dotColor: intensityColors[s.intensityLabel] };
        return acc;
    }, {} as Record<string, any>);

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
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Symptoms Log</Text>
                <TouchableOpacity onPress={() => router.push('/add-symptom')}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput style={styles.searchInput} placeholder="Search symptoms..." value={search} onChangeText={setSearch} />
                </View>
                <TouchableOpacity style={[styles.filterButton, showFilters && styles.filterButtonActive]} onPress={() => setShowFilters(!showFilters)}>
                    <Ionicons name="options" size={20} color={showFilters ? '#3B82F6' : '#6B7280'} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, selectedDate && styles.filterButtonActive]} onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar" size={20} color={selectedDate ? '#3B82F6' : '#6B7280'} />
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
                        <Text style={styles.filterLabel}>Min Intensity:</Text>
                        {[0, 25, 50, 75].map(i => (
                            <TouchableOpacity key={i} style={[styles.filterChip, minIntensity === i && styles.filterChipActive]} onPress={() => setMinIntensity(i)}>
                                <Text style={[styles.filterChipText, minIntensity === i && styles.filterChipTextActive]}>{i === 0 ? 'All' : `${i}+`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Sort:</Text>
                        {(['date', 'intensity', 'name'] as SortBy[]).map(s => (
                            <TouchableOpacity key={s} style={[styles.filterChip, sortBy === s && styles.filterChipActive]} onPress={() => setSortBy(s)}>
                                <Text style={[styles.filterChipText, sortBy === s && styles.filterChipTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {filteredSymptoms.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Intensity Distribution</Text>
                    <View style={styles.pieContainer}>
                        {Object.entries(intensityStats).map(([label, count]) => {
                            const total = filteredSymptoms.length;
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            if (count === 0) return null;
                            return (
                                <View key={label} style={styles.pieItem}>
                                    <View style={[styles.pieSlice, { backgroundColor: intensityColors[label as keyof typeof intensityColors] }]} />
                                    <Text style={styles.pieLabel}>{label}</Text>
                                    <Text style={styles.pieValue}>{count} ({percentage.toFixed(0)}%)</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={styles.statsRow}>
                <View style={styles.statItem}><Text style={styles.statValue}>{filteredSymptoms.length}</Text><Text style={styles.statLabel}>Total</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={[styles.statValue, { color: '#EF4444' }]}>{intensityStats.Severe + intensityStats['Very Severe']}</Text><Text style={styles.statLabel}>High</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={[styles.statValue, { color: '#10B981' }]}>{intensityStats.Mild}</Text><Text style={styles.statLabel}>Mild</Text></View>
            </View>

            <ScrollView style={styles.listSection} contentContainerStyle={styles.listContent}>
                {filteredSymptoms.length === 0 ? (
                    <View style={styles.emptyState}><Ionicons name="pulse" size={48} color="#9CA3AF" /><Text style={styles.emptyText}>No symptoms found</Text></View>
                ) : (
                    filteredSymptoms.map(s => (
                        <View key={s.id} style={styles.symptomCard}>
                            <View style={styles.symptomHeader}>
                                <View style={[styles.intensityDot, { backgroundColor: intensityColors[s.intensityLabel] }]} />
                                <Text style={styles.symptomName}>{s.name}</Text>
                                <View style={[styles.intensityBadge, { backgroundColor: intensityColors[s.intensityLabel] + '20' }]}>
                                    <Text style={[styles.intensityText, { color: intensityColors[s.intensityLabel] }]}>{s.intensityLabel} ({s.intensity}%)</Text>
                                </View>
                            </View>
                            <View style={styles.symptomDetails}>
                                <View style={styles.detailItem}><Ionicons name="calendar-outline" size={16} color="#6B7280" /><Text style={styles.detailText}>{format(parseISO(s.dateStarted), 'MMM d, yyyy h:mm a')}</Text></View>
                                {s.place && <View style={styles.detailItem}><Ionicons name="location-outline" size={16} color="#6B7280" /><Text style={styles.detailText}>{s.place}</Text></View>}
                            </View>
                            {s.notes && <Text style={styles.notes}>{s.notes}</Text>}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeSymptom(s.id)}><Ionicons name="trash-outline" size={18} color="#EF4444" /><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showCalendar} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomCalendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={handleDateSelect} onClose={() => setShowCalendar(false)} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginLeft: 12 },
    searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, borderRadius: 10, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 16 },
    filterButton: { padding: 10, marginLeft: 4, borderRadius: 8, backgroundColor: '#FFFFFF' },
    filterButtonActive: { backgroundColor: '#DBEAFE' },
    filterPanel: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    filterLabel: { fontSize: 14, color: '#6B7280', marginRight: 12, width: 100 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 },
    filterChipActive: { backgroundColor: '#3B82F6' },
    filterChipText: { fontSize: 13, color: '#6B7280' },
    filterChipTextActive: { color: '#FFFFFF' },
    chartSection: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
    chartTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
    pieContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    pieItem: { alignItems: 'center', width: '45%', marginBottom: 12 },
    pieSlice: { width: 16, height: 16, borderRadius: 8, marginBottom: 4 },
    pieLabel: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
    pieValue: { fontSize: 12, color: '#6B7280' },
    statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: '#E5E7EB' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    listSection: { flex: 1, marginTop: 16 },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#6B7280', marginTop: 12 },
    symptomCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    symptomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    intensityDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    symptomName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    intensityText: { fontSize: 12, fontWeight: '500' },
    symptomDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginTop: 4 },
    detailText: { fontSize: 13, color: '#6B7280', marginLeft: 4 },
    notes: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginBottom: 8 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, marginTop: 8 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    calendarContainer: { padding: 8 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    calendarMonth: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
    weekDays: { flexDirection: 'row', marginBottom: 8 },
    weekDay: { flex: 1, textAlign: 'center', fontSize: 12, color: '#6B7280', fontWeight: '500' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    day: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    daySelected: { backgroundColor: '#3B82F6' },
    dayText: { fontSize: 14, color: '#1A1A1A' },
    dayTextSelected: { color: '#FFFFFF', fontWeight: '600' },
    dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
    calendarFooter: { marginTop: 16, alignItems: 'flex-end' },
    clearButton: { paddingHorizontal: 20, paddingVertical: 10 },
    clearButtonText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
});
