import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Measurement } from '../types/index';
import { format, parseISO } from 'date-fns';
import TrendChart from '../components/ui/TrendChart';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

const measurementTypes = ['Blood Pressure', 'Heart Rate', 'Weight', 'BMI', 'Blood Sugar', 'Temperature', 'Cholesterol', 'Other'];

const typeColors: Record<string, string> = {
    'Blood Pressure': '#EF4444',
    'Heart Rate': '#EC4899',
    'Weight': '#10B981',
    'BMI': '#10B981',
    'Blood Sugar': '#F59E0B',
    'Temperature': '#3B82F6',
    'Cholesterol': '#8B5CF6',
    'Other': '#6B7280',
};

export default function MeasurementLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { measurements, removeMeasurement } = useHealthStore();
    const [selectedType, setSelectedType] = useState('Weight');
    const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);

    const filteredMeasurements = useMemo(() => {
        let sorted = [...measurements].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        if (selectedType) {
            sorted = sorted.filter(m => m.type === selectedType);
        }
        return sorted;
    }, [measurements, selectedType]);

    const chartData = useMemo(() => {
        const ascSorted = [...filteredMeasurements].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        return ascSorted.map(m => {
            const val = parseFloat(m.reading.toString());
            return {
                value: isNaN(val) ? 0 : val,
                label: format(parseISO(m.dateTime), 'MMM d', { locale: dateLocale }),
                dataPointText: m.reading.toString(),
                date: format(parseISO(m.dateTime), 'MMM d, HH:mm', { locale: dateLocale })
            };
        });
    }, [filteredMeasurements, dateLocale]);

    const currentUnit = filteredMeasurements.length > 0 ? filteredMeasurements[0].unit : '';
    const typeColor = typeColors[selectedType] || '#3B82F6';

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('measurements')}</Text>
                <TouchableOpacity onPress={() => router.push('/add-measurement')}><Ionicons name="add" size={24} color="#10B981" /></TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {measurementTypes.map(tItem => (
                        <TouchableOpacity
                            key={tItem}
                            style={[styles.typeChip, selectedType === tItem && { backgroundColor: typeColors[tItem] || '#10B981' }]}
                            onPress={() => { setSelectedType(tItem); setIsTypeModalVisible(true); }}
                        >
                            <Text style={[styles.typeText, selectedType === tItem && styles.typeTextActive]}>{t(tItem.toLowerCase().replace(' ', '_') as any) || tItem}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content}>
                {selectedType && (
                    <TrendChart
                        data={chartData}
                        title={`${t(selectedType.toLowerCase().replace(' ', '_') as any) || selectedType} ${t('trends')}`}
                        unit={currentUnit}
                        color={typeColor}
                    />
                )}

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>{t('history')}</Text>
                    {filteredMeasurements.length === 0 ? (
                        <Text style={styles.emptyText}>{t('no_measurements_found')}</Text>
                    ) : (
                        filteredMeasurements.map(m => (
                            <TouchableOpacity key={m.id} style={[styles.card, { borderLeftColor: typeColor, borderLeftWidth: 4 }]} onPress={() => router.push({ pathname: '/measurement-details', params: { id: m.id } })} activeOpacity={0.8}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={[styles.cardValue, { color: typeColor }]}>{m.reading} <Text style={styles.cardUnit}>{m.unit}</Text></Text>
                                        <Text style={styles.cardDate}>{format(parseISO(m.dateTime), 'MMM d, yyyy  HH:mm', { locale: dateLocale })}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                        <TouchableOpacity onPress={() => router.push({ pathname: '/add-measurement', params: { id: m.id } })}>
                                            <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => { if (selectedMeasurement?.id === m.id) setSelectedMeasurement(null); removeMeasurement(m.id); }}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {m.notes && <Text style={styles.cardNotes} numberOfLines={1}>{m.notes}</Text>}
                                <Text style={styles.tapHint}>{t('tap_for_details')}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Detail Modal */}
            <Modal transparent statusBarTranslucent hardwareAccelerated visible={!!selectedMeasurement} onRequestClose={() => setSelectedMeasurement(null)}>
                <TouchableWithoutFeedback onPress={() => setSelectedMeasurement(null)}>
                    <View style={styles.detailOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.detailContent}>
                                {selectedMeasurement && (
                                    <>
                                        <View style={styles.detailHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detailType}>{t(selectedMeasurement.type.toLowerCase().replace(' ', '_') as any) || selectedMeasurement.type}</Text>
                                                <Text style={[styles.detailReading, { color: typeColors[selectedMeasurement.type] || '#10B981' }]}>
                                                    {selectedMeasurement.reading}
                                                    <Text style={styles.detailReadingUnit}> {selectedMeasurement.unit}</Text>
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                                <TouchableOpacity onPress={() => { setSelectedMeasurement(null); router.push({ pathname: '/add-measurement', params: { id: selectedMeasurement.id } }); }}>
                                                    <Ionicons name="pencil" size={22} color="#3B82F6" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setSelectedMeasurement(null)}>
                                                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.detailBody}>
                                            <View style={styles.detailRow}>
                                                <Ionicons name="calendar-outline" size={20} color={typeColors[selectedMeasurement.type] || '#10B981'} />
                                                <View style={styles.detailRowContent}>
                                                    <Text style={styles.detailLabel}>{t('date_time')}</Text>
                                                    <Text style={styles.detailValue}>{format(parseISO(selectedMeasurement.dateTime), 'PPPP', { locale: dateLocale })} {t('at')} {format(parseISO(selectedMeasurement.dateTime), 'HH:mm')}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Ionicons name="analytics-outline" size={20} color={typeColors[selectedMeasurement.type] || '#10B981'} />
                                                <View style={styles.detailRowContent}>
                                                    <Text style={styles.detailLabel}>{t('measurement_type')}</Text>
                                                    <Text style={styles.detailValue}>{t(selectedMeasurement.type.toLowerCase().replace(' ', '_') as any) || selectedMeasurement.type}</Text>
                                                </View>
                                            </View>
                                            {selectedMeasurement.subType && (
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="git-branch-outline" size={20} color={typeColors[selectedMeasurement.type] || '#10B981'} />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('sub_type')}</Text>
                                                        <Text style={styles.detailValue}>{selectedMeasurement.subType}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            {selectedMeasurement.notes && (
                                                <View style={styles.detailRow}>
                                                    <Ionicons name="document-text-outline" size={20} color={typeColors[selectedMeasurement.type] || '#10B981'} />
                                                    <View style={styles.detailRowContent}>
                                                        <Text style={styles.detailLabel}>{t('notes')}</Text>
                                                        <Text style={styles.detailValue}>{selectedMeasurement.notes}</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        <TouchableOpacity style={styles.deleteFullBtn} onPress={() => { removeMeasurement(selectedMeasurement.id); setSelectedMeasurement(null); }}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            <Text style={styles.deleteFullText}>{t('delete_measurement')}</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
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
    typeSelector: { backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 16 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.border, marginRight: 8 },
    typeText: { fontSize: 14, color: colors.textSecondary },
    typeTextActive: { color: '#fff' },
    content: { flex: 1 },
    listSection: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardValue: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    cardUnit: { fontSize: 16, fontWeight: 'normal', color: colors.textSecondary },
    cardDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    cardNotes: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginTop: 6 },
    tapHint: { fontSize: 11, color: colors.textSecondary, textAlign: 'right', marginTop: 8 },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    detailContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
    detailType: { fontSize: 14, color: colors.textSecondary, marginBottom: 4, fontWeight: '500' },
    detailReading: { fontSize: 48, fontWeight: '800' },
    detailReadingUnit: { fontSize: 20, fontWeight: '400' },
    detailBody: { gap: 16, marginBottom: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    deleteFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteFullText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
