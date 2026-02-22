import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { PieChart } from 'react-native-gifted-charts';
import { Calendar } from 'react-native-calendars';

const medicationTypes = ['All', 'Antibiotic', 'Analgesic', 'Antidepressant', 'Supplement', 'Vitamin', 'Other'];

export default function MedicationLogScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { medications, removeMedication } = useHealthStore();
    const [selectedType, setSelectedType] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Filter logic
    const filteredMedications = useMemo(() => {
        let result = medications;
        if (selectedType !== 'All') {
            result = result.filter(m => m.type === selectedType || (!m.type && selectedType === 'Other'));
        }
        return result;
    }, [medications, selectedType]);

    // Chart Data
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        medications.forEach(m => {
            const t = m.type || 'Other';
            counts[t] = (counts[t] || 0) + 1;
        });

        const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6'];
        return Object.entries(counts).map(([name, value], index) => ({
            value,
            color: colors[index % colors.length],
            text: `${value}`,
            legend: name
        }));
    }, [medications]);

    // Calendar Marked Dates
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        medications.forEach(m => {
            // Mark start dates
            const startDate = m.startDate.split('T')[0];
            marks[startDate] = { marked: true, dotColor: m.color || '#3B82F6' };
        });
        return marks;
    }, [medications]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Medications</Text>
                <TouchableOpacity onPress={() => router.push('/add-medication')}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {medicationTypes.map(t => (
                        <TouchableOpacity key={t} style={[styles.typeChip, selectedType === t && styles.typeChipActive]} onPress={() => setSelectedType(t)}>
                            <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <View style={styles.viewToggle}>
                    <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} onPress={() => setViewMode('list')}><Ionicons name="list" size={20} color={viewMode === 'list' ? '#fff' : colors.textSecondary} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]} onPress={() => setViewMode('calendar')}><Ionicons name="calendar" size={20} color={viewMode === 'calendar' ? '#fff' : colors.textSecondary} /></TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {medications.length > 0 && viewMode === 'list' && (
                    <View style={styles.chartContainer}>
                        <Text style={styles.sectionTitle}>Distribution</Text>
                        <View style={{ alignItems: 'center' }}>
                            <PieChart innerCircleColor={colors.surface}
                                data={chartData}
                                donut
                                showText
                                textColor="white"
                                radius={80}
                                innerRadius={50}
                                textSize={12}
                                showTextBackground={false}
                                centerLabelComponent={() => <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{medications.length}</Text>}
                            />
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

                {viewMode === 'calendar' ? (
                    <View style={styles.calendarContainer}>
                        <Calendar markedDates={markedDates} theme={{
                            calendarBackground: colors.surface,
                            textSectionTitleColor: colors.textSecondary,
                            selectedDayBackgroundColor: colors.primary || '#14B8A6',
                            selectedDayTextColor: colors.surface,
                            todayTextColor: colors.primary || '#14B8A6',
                            dayTextColor: colors.text,
                            textDisabledColor: colors.border,
                            dotColor: colors.primary || '#14B8A6',
                            selectedDotColor: colors.surface,
                            arrowColor: colors.text,
                            monthTextColor: colors.text,
                            indicatorColor: colors.text,
                        }} />
                        <Text style={styles.calendarHint}>Dots indicate medication start dates</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        <Text style={styles.sectionTitle}>Medication List</Text>
                        {filteredMedications.map(m => (
                            <View key={m.id} style={[styles.card, { borderLeftColor: m.color || '#3B82F6', borderLeftWidth: 4 }]}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{m.name}</Text>
                                        <Text style={styles.cardSubtitle}>{m.preparation} • {m.dosageUnit}</Text>
                                        {m.targetCondition && <Text style={styles.cardDetail}>For: {m.targetCondition}</Text>}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity onPress={() => router.push({ pathname: '/add-medication', params: { id: m.id } })}>
                                            <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => removeMedication(m.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    <View style={styles.badge}><Text style={styles.badgeText}>{m.frequency}</Text></View>
                                    {m.selfPrescribed && <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.badgeText, { color: '#D97706' }]}>Self</Text></View>}
                                    <Text style={styles.dateText}>{format(parseISO(m.startDate), 'MMM d, yyyy')}</Text>
                                </View>
                            </View>
                        ))}
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
    filterSection: { padding: 16, backgroundColor: colors.surface, marginBottom: 8 },
    typeScroll: { marginBottom: 16 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.border, marginRight: 8 },
    typeChipActive: { backgroundColor: '#3B82F6' },
    typeText: { fontSize: 14, color: colors.textSecondary },
    typeTextActive: { color: colors.surface },
    viewToggle: { flexDirection: 'row', justifyContent: 'flex-end' },
    toggleBtn: { padding: 8, borderRadius: 8, backgroundColor: colors.border, marginLeft: 8 },
    toggleBtnActive: { backgroundColor: '#3B82F6' },
    content: { flex: 1 },
    chartContainer: { backgroundColor: colors.surface, margin: 16, padding: 16, borderRadius: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendText: { fontSize: 12, color: colors.textSecondary },
    listContainer: { padding: 16 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    cardDetail: { fontSize: 13, color: '#4B5563', marginTop: 4, fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#EFF6FF' },
    badgeText: { fontSize: 12, color: '#3B82F6', fontWeight: '500' },
    dateText: { marginLeft: 'auto', fontSize: 12, color: colors.textSecondary },
    calendarContainer: { padding: 16, backgroundColor: colors.surface, margin: 16, borderRadius: 12 },
    calendarHint: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 8 },
});
