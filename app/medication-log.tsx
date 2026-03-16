import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { PieChart } from 'react-native-gifted-charts';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

const medicationTypes = ['All', 'Antibiotic', 'Analgesic', 'Antidepressant', 'Supplement', 'Vitamin', 'Other'];

export default function MedicationLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { medications, removeMedication } = useHealthStore();
    const [selectedType, setSelectedType] = useState('All');
    const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const [showStarted, setShowStarted] = useState(true);
    const [showEnded, setShowEnded] = useState(true);
    const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);

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
            const tType = m.type || 'Other';
            counts[tType] = (counts[tType] || 0) + 1;
        });

        const chartColors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6'];
        return Object.entries(counts).map(([name, value], index) => ({
            value,
            color: chartColors[index % chartColors.length],
            text: `${value}`,
            legend: name
        }));
    }, [medications]);

    // Calendar Marked Dates
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};

        if (selectedMedicationId) {
            const m = medications.find(x => x.id === selectedMedicationId);
            if (m && m.startDate) {
                const startStr = m.startDate.split('T')[0];
                const endStr = m.endDate ? m.endDate.split('T')[0] : format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd');

                const startParts = startStr.split('-');
                let currentDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));

                const endParts = endStr.split('-');
                const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

                const color = m.color || '#3B82F6';

                let count = 0;
                while (currentDate <= endDate && count < 1000) {
                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                    const isStart = dateStr === startStr;
                    const isEnd = dateStr === endStr && !!m.endDate;

                    marks[dateStr] = {
                        startingDay: isStart,
                        endingDay: isEnd,
                        color: color,
                        textColor: '#fff'
                    };

                    currentDate.setDate(currentDate.getDate() + 1);
                    count++;
                }

                if (selectedDate && marks[selectedDate]) {
                    marks[selectedDate].selected = true;
                    // Don't override text color so it remains visible against the highlight background
                } else if (selectedDate) {
                    marks[selectedDate] = { selected: true, selectedColor: colors.primary || '#3B82F6' };
                }

                return marks;
            }
        }

        medications.forEach(m => {
            if (showStarted && m.startDate) {
                const startDate = m.startDate.split('T')[0];
                if (!marks[startDate]) marks[startDate] = { dots: [] };
                if (!marks[startDate].dots.some((d: any) => d.color === '#10B981')) {
                    marks[startDate].dots.push({ key: `start-${m.id}`, color: '#10B981' });
                }
            }
            if (showEnded && m.endDate) {
                const endDate = m.endDate.split('T')[0];
                if (!marks[endDate]) marks[endDate] = { dots: [] };
                if (!marks[endDate].dots.some((d: any) => d.color === '#F97316')) {
                    marks[endDate].dots.push({ key: `end-${m.id}`, color: '#F97316' });
                }
            }
        });

        if (selectedDate) {
            if (!marks[selectedDate]) marks[selectedDate] = { dots: marks[selectedDate]?.dots || [] };
            marks[selectedDate].selected = true;
            marks[selectedDate].selectedColor = colors.primary || '#3B82F6';
        }
        return marks;
    }, [medications, showStarted, showEnded, selectedDate, selectedMedicationId, colors.primary]);

    const dateMedications = useMemo(() => {
        if (!selectedDate) return { started: [], ended: [] };
        return {
            started: medications.filter(m => m.startDate && m.startDate.split('T')[0] === selectedDate),
            ended: medications.filter(m => m.endDate && m.endDate.split('T')[0] === selectedDate),
        };
    }, [medications, selectedDate]);

    const activeMonthMedications = useMemo(() => {
        const [year, month] = currentMonth.split('-').map(Number);
        const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const monthEndStr = `${year}-${String(month).padStart(2, '0')}-31`; // Approx enough for string comp

        return medications.filter(m => {
            if (!m.startDate) return false;
            const startStr = m.startDate.split('T')[0];
            const endStr = m.endDate ? m.endDate.split('T')[0] : '9999-12-31';

            // Medication overlaps with this month if its start is before the end of the month
            // AND its end is after the start of the month
            return startStr <= monthEndStr && endStr >= monthStartStr;
        });
    }, [medications, currentMonth]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('medications')}</Text>
                <TouchableOpacity onPress={() => router.push('/add-medication')}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {medicationTypes.map(tItem => (
                        <TouchableOpacity key={tItem} style={[styles.typeChip, selectedType === tItem && styles.typeChipActive]} onPress={() => { setSelectedType(tItem); setIsTypeModalVisible(true); }}>
                            <Text style={[styles.typeText, selectedType === tItem && styles.typeTextActive]}>{t(tItem.toLowerCase()) || tItem}</Text>
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
                        <Text style={styles.sectionTitle}>{t('distribution') || 'Distribution'}</Text>
                        <View style={{ alignItems: 'center' }}>
                            <PieChart innerCircleColor={colors.surface}
                                data={chartData}
                                donut
                                showText
                                textColor={colors.text}
                                radius={80}
                                innerRadius={50}
                                textSize={12}
                                fontWeight="bold"
                                showTextBackground={true}
                                textBackgroundColor={colors.surface}
                                textBackgroundRadius={12}
                                centerLabelComponent={() => <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{medications.length}</Text>}
                            />
                        </View>
                        <View style={styles.legendContainer}>
                            {chartData.map((d, i) => (
                                <View key={i} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                                    <Text style={styles.legendText}>{t(d.legend.toLowerCase()) || d.legend}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {viewMode === 'calendar' ? (
                    <View style={styles.calendarContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <TouchableOpacity style={[styles.typeChip, !selectedMedicationId && styles.typeChipActive]} onPress={() => setSelectedMedicationId(null)}>
                                <Text style={[styles.typeText, !selectedMedicationId && styles.typeTextActive]}>{t('all_medications') || 'All Medications'}</Text>
                            </TouchableOpacity>
                            {activeMonthMedications.map(m => (
                                <TouchableOpacity key={m.id} style={[styles.typeChip, selectedMedicationId === m.id && { backgroundColor: m.color || '#3B82F6', borderColor: m.color || '#3B82F6' }]} onPress={() => setSelectedMedicationId(m.id)}>
                                    <Text style={[styles.typeText, selectedMedicationId === m.id && { color: '#ffffff' }]}>{m.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {!selectedMedicationId && (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 20 }}>
                                <TouchableOpacity onPress={() => setShowStarted(!showStarted)} style={{ flexDirection: 'row', alignItems: 'center', opacity: showStarted ? 1 : 0.5 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', marginRight: 8 }} />
                                    <Text style={{ color: colors.text, fontWeight: '500' }}>{t('started') || 'Started'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowEnded(!showEnded)} style={{ flexDirection: 'row', alignItems: 'center', opacity: showEnded ? 1 : 0.5 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#F97316', marginRight: 8 }} />
                                    <Text style={{ color: colors.text, fontWeight: '500' }}>{t('ended') || 'Ended'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Calendar
                            key={selectedMedicationId ? 'period' : 'multi-dot'}
                            markingType={selectedMedicationId ? 'period' : 'multi-dot'}
                            markedDates={markedDates}
                            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                            onMonthChange={(month: { dateString: string }) => setCurrentMonth(month.dateString.substring(0, 7))}
                            theme={{
                                calendarBackground: colors.surface,
                                textSectionTitleColor: colors.textSecondary,
                                selectedDayBackgroundColor: colors.primary || '#3B82F6',
                                selectedDayTextColor: colors.surface,
                                todayTextColor: colors.primary || '#3B82F6',
                                dayTextColor: colors.text,
                                textDisabledColor: colors.border,
                                dotColor: colors.primary || '#3B82F6',
                                selectedDotColor: colors.surface,
                                arrowColor: colors.text,
                                monthTextColor: colors.text,
                                indicatorColor: colors.text,
                            }}
                        />
                        <Text style={styles.calendarHint}>{selectedMedicationId ? t('showing_medication_timeline') || 'Showing medication timeline highlighting' : t('dots_indicate_start_end') || 'Dots indicate medication start and end dates'}</Text>

                        {selectedDate && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.sectionTitle}>{format(parseISO(selectedDate), 'MMM d, yyyy', { locale: dateLocale })}</Text>

                                {dateMedications.started.length > 0 && (
                                    <>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#10B981', marginVertical: 8, marginLeft: 4 }}>{t('started') || 'Started'}:</Text>
                                        {dateMedications.started.map(m => (
                                            <TouchableOpacity key={`start-${m.id}`} style={[styles.card, { borderLeftColor: '#10B981', borderLeftWidth: 4, marginBottom: 8 }]} onPress={() => router.push({ pathname: '/medication-details', params: { id: m.id } })} activeOpacity={0.8}>
                                                <Text style={styles.cardTitle}>{m.name}</Text>
                                                <Text style={styles.cardSubtitle}>{t(m.preparation.toLowerCase() as any) || m.preparation} • {m.dosageUnit}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                )}

                                {dateMedications.ended.length > 0 && (
                                    <>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#F97316', marginVertical: 8, marginLeft: 4 }}>{t('ended') || 'Ended'}:</Text>
                                        {dateMedications.ended.map(m => (
                                            <TouchableOpacity key={`end-${m.id}`} style={[styles.card, { borderLeftColor: '#F97316', borderLeftWidth: 4, marginBottom: 8 }]} onPress={() => router.push({ pathname: '/medication-details', params: { id: m.id } })} activeOpacity={0.8}>
                                                <Text style={styles.cardTitle}>{m.name}</Text>
                                                <Text style={styles.cardSubtitle}>{t(m.preparation.toLowerCase() as any) || m.preparation} • {m.dosageUnit}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                )}

                                {dateMedications.started.length === 0 && dateMedications.ended.length === 0 && (
                                    <Text style={{ textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 12 }}>{t('no_medications_on_date') || 'No medications started or ended on this date.'}</Text>
                                )}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        <Text style={styles.sectionTitle}>{t('medication_list') || 'Medication List'}</Text>
                        {filteredMedications.map(m => (
                            <TouchableOpacity key={m.id} style={[styles.card, { borderLeftColor: m.color || '#3B82F6', borderLeftWidth: 4 }]} onPress={() => router.push({ pathname: '/medication-details', params: { id: m.id } })} activeOpacity={0.8}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{m.name}</Text>
                                        <Text style={styles.cardSubtitle}>{t(m.preparation.toLowerCase() as any) || m.preparation} • {m.dosageUnit}</Text>
                                        {m.targetCondition && <Text style={styles.cardDetail}>{t('for')} {m.targetCondition}</Text>}
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
                                    <View style={styles.badge}><Text style={styles.badgeText}>{t(m.frequency.toLowerCase() as any) || m.frequency}</Text></View>
                                    {m.selfPrescribed && <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.badgeText, { color: '#D97706' }]}>{t('self') || 'Self'}</Text></View>}
                                    {m.remindersEnabled !== false && m.schedule && m.schedule.length > 0 ? (
                                        <View style={[styles.badge, { backgroundColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
                                            <Ionicons name="alarm-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                                                {m.schedule.map(s => s.time).join(', ')}
                                            </Text>
                                        </View>
                                    ) : m.remindersEnabled === false ? (
                                        <View style={[styles.badge, { backgroundColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
                                            <Ionicons name="notifications-off-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{t('off') || 'Off'}</Text>
                                        </View>
                                    ) : null}
                                    <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                                        <Text style={styles.dateText}>{format(parseISO(m.startDate), 'MMM d, yyyy', { locale: dateLocale })}</Text>
                                        {m.endDate && <Text style={styles.dateText}>→ {format(parseISO(m.endDate), 'MMM d, yyyy', { locale: dateLocale })}</Text>}
                                    </View>
                                </View>
                                <View style={styles.tapHint}>
                                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                                    <Text style={styles.tapHintText}>{t('tap_for_details')}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
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
    dateText: { fontSize: 12, color: colors.textSecondary },
    tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8, gap: 4 },
    tapHintText: { fontSize: 11, color: colors.textSecondary },
    calendarContainer: { padding: 16, backgroundColor: colors.surface, margin: 16, borderRadius: 12 },
    calendarHint: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 8 },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    detailContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    colorBar: { width: 4, height: 48, borderRadius: 2 },
    detailTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    detailSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    detailBody: { gap: 16, marginBottom: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    deleteFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteFullText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
