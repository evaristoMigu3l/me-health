import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { enUS, ptBR } from 'date-fns/locale';

type FilterType = 'all' | 'week' | 'month' | 'year';
type SortBy = 'date' | 'intensity' | 'name';

function CustomCalendar({ markedDates, selectedDate, onSelectDate, onClose, styles, colors, t }: { markedDates: Record<string, any>, selectedDate: string | null, onSelectDate: (d: string) => void, onClose: () => void, styles: any, colors: any, t: any }) {
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
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <Text key={d} style={styles.weekDay}>{t(d.toLowerCase()) || d}</Text>)}
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
                <TouchableOpacity style={styles.clearButton} onPress={onClose}><Text style={styles.clearButtonText}>{t('done')}</Text></TouchableOpacity>
            </View>
        </View>
    );
}

export default function SymptomsLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { symptoms, removeSymptom } = useHealthStore();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [minIntensity, setMinIntensity] = useState(0);
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
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

        if (selectedDate) result = result.filter(s => format(parseISO(s.dateStarted), 'yyyy-MM-dd') === selectedDate);
        if (search) result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
        if (minIntensity > 0) result = result.filter(s => s.intensity >= minIntensity);

        result.sort((a, b) => {
            if (sortBy === 'date') return new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime();
            if (sortBy === 'intensity') return b.intensity - a.intensity;
            return a.name.localeCompare(b.name);
        });

        return result;
    }, [symptoms, filterType, selectedDate, search, minIntensity, sortBy]);

    const intensityStats = useMemo(() => {
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
        setSelectedDate(selectedDate === date ? null : date);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('symptoms_log')}</Text>
                <TouchableOpacity onPress={() => router.push('/add-symptom')}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput placeholderTextColor={colors.textSecondary} style={styles.searchInput} placeholder={t('search_symptoms')} value={search} onChangeText={setSearch} />
                </View>
                <TouchableOpacity style={[styles.filterButton, showFilters && styles.filterButtonActive]} onPress={() => setShowFilters(!showFilters)}>
                    <Ionicons name="options" size={20} color={showFilters ? '#3B82F6' : colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, selectedDate && styles.filterButtonActive]} onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar" size={20} color={selectedDate ? '#3B82F6' : colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={styles.filterPanel}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>{t('period')}</Text>
                        {(['all', 'week', 'month', 'year'] as FilterType[]).map(type => (
                            <TouchableOpacity key={type} style={[styles.filterChip, filterType === type && styles.filterChipActive]} onPress={() => setFilterType(type)}>
                                <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>{t(type) || type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>{t('min_intensity')}</Text>
                        {[0, 25, 50, 75].map(i => (
                            <TouchableOpacity key={i} style={[styles.filterChip, minIntensity === i && styles.filterChipActive]} onPress={() => setMinIntensity(i)}>
                                <Text style={[styles.filterChipText, minIntensity === i && styles.filterChipTextActive]}>{i === 0 ? t('all') || 'All' : `${i}+`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>{t('sort')}</Text>
                        {(['date', 'intensity', 'name'] as SortBy[]).map(s => (
                            <TouchableOpacity key={s} style={[styles.filterChip, sortBy === s && styles.filterChipActive]} onPress={() => setSortBy(s)}>
                                <Text style={[styles.filterChipText, sortBy === s && styles.filterChipTextActive]}>{t(s) || s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {filteredSymptoms.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>{t('intensity_distribution')}</Text>
                    <View style={styles.pieContainer}>
                        {Object.entries(intensityStats).map(([label, count]) => {
                            const total = filteredSymptoms.length;
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            if (count === 0) return null;
                            return (
                                <View key={label} style={styles.pieItem}>
                                    <View style={[styles.pieSlice, { backgroundColor: intensityColors[label as keyof typeof intensityColors] }]} />
                                    <Text style={styles.pieLabel}>{t(label.toLowerCase().replace(' ', '_') as any) || label}</Text>
                                    <Text style={styles.pieValue}>{count} ({percentage.toFixed(0)}%)</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={styles.statsRow}>
                <View style={styles.statItem}><Text style={styles.statValue}>{filteredSymptoms.length}</Text><Text style={styles.statLabel}>{t('total')}</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={[styles.statValue, { color: '#EF4444' }]}>{intensityStats.Severe + intensityStats['Very Severe']}</Text><Text style={styles.statLabel}>{t('high')}</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={[styles.statValue, { color: '#10B981' }]}>{intensityStats.Mild}</Text><Text style={styles.statLabel}>{t('mild')}</Text></View>
            </View>

            <ScrollView style={styles.listSection} contentContainerStyle={styles.listContent}>
                {filteredSymptoms.length === 0 ? (
                    <View style={styles.emptyState}><Ionicons name="pulse" size={48} color={colors.textSecondary} /><Text style={styles.emptyText}>{t('no_symptoms_found')}</Text></View>
                ) : (
                    filteredSymptoms.map(s => (
                        <TouchableOpacity key={s.id} style={styles.symptomCard} onPress={() => router.push({ pathname: '/symptom-details', params: { id: s.id } })} activeOpacity={0.8}>
                            <View style={styles.symptomHeader}>
                                <View style={[styles.intensityDot, { backgroundColor: intensityColors[s.intensityLabel] }]} />
                                <Text style={styles.symptomName}>{s.name}</Text>
                                <View style={[styles.intensityBadge, { backgroundColor: intensityColors[s.intensityLabel] + '20' }]}>
                                    <Text style={[styles.intensityText, { color: intensityColors[s.intensityLabel] }]}>{t(s.intensityLabel.toLowerCase().replace(' ', '_') as any) || s.intensityLabel} ({s.intensity}%)</Text>
                                </View>
                            </View>
                            <View style={styles.symptomDetails}>
                                <View style={styles.detailItem}><Ionicons name="calendar-outline" size={16} color={colors.textSecondary} /><Text style={styles.detailText}>{format(parseISO(s.dateStarted), 'MMM d, yyyy HH:mm', { locale: dateLocale })}</Text></View>
                                {s.place && <View style={styles.detailItem}><Ionicons name="location-outline" size={16} color={colors.textSecondary} /><Text style={styles.detailText}>{s.place}</Text></View>}
                            </View>
                            {s.notes && <Text style={styles.notes}>{s.notes}</Text>}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-symptom', params: { id: s.id } })}>
                                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.editText}>{t('edit')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeSymptom(s.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={styles.deleteText}>{t('delete')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Calendar Modal */}
            <Modal visible={showCalendar} animationType="none" transparent statusBarTranslucent hardwareAccelerated>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomCalendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={handleDateSelect} onClose={() => setShowCalendar(false)} styles={styles} colors={colors} t={t} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 16, color: colors.text },
    filterButton: { padding: 10, marginLeft: 4, borderRadius: 8, backgroundColor: colors.surface },
    filterButtonActive: { backgroundColor: '#DBEAFE' },
    filterPanel: { backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    filterLabel: { fontSize: 14, color: colors.textSecondary, marginRight: 12, width: 100 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.border, marginRight: 8 },
    filterChipActive: { backgroundColor: '#3B82F6' },
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
    symptomCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
    symptomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    intensityDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    symptomName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
    intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    intensityText: { fontSize: 12, fontWeight: '500' },
    symptomDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
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
    daySelected: { backgroundColor: '#3B82F6' },
    dayText: { fontSize: 14, color: colors.text },
    dayTextSelected: { color: colors.surface, fontWeight: '600' },
    dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
    calendarFooter: { marginTop: 16, alignItems: 'flex-end' },
    clearButton: { paddingHorizontal: 20, paddingVertical: 10 },
    clearButtonText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
    // Detail modal
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
