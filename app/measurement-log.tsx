import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import TrendChart from '../components/ui/TrendChart';
import { Calendar } from 'react-native-calendars';

const measurementTypes = ['Blood Pressure', 'Heart Rate', 'Weight', 'BMI', 'Blood Sugar', 'Temperature', 'Cholesterol', 'Other'];

export default function MeasurementLogScreen() {
    const router = useRouter();
    const { measurements, removeMeasurement } = useHealthStore();
    const [selectedType, setSelectedType] = useState('Weight');
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

    const filteredMeasurements = useMemo(() => {
        let sorted = [...measurements].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

        if (selectedType) {
            sorted = sorted.filter(m => m.type === selectedType);
        }

        if (dateFilter.start) {
            sorted = sorted.filter(m => new Date(m.dateTime) >= new Date(dateFilter.start!));
        }
        if (dateFilter.end) {
            sorted = sorted.filter(m => new Date(m.dateTime) <= new Date(dateFilter.end!));
        }

        return sorted;
    }, [measurements, selectedType, dateFilter]);

    // Prepare chart data
    const chartData = useMemo(() => {
        // Gifted Charts expects data in ascending order for drawing lines left-to-right correctly usually
        const ascSorted = [...filteredMeasurements].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        return ascSorted.map(m => {
            const val = parseFloat(m.reading.toString());
            return {
                value: isNaN(val) ? 0 : val,
                label: format(parseISO(m.dateTime), 'MMM d'),
                dataPointText: m.reading.toString(),
                date: format(parseISO(m.dateTime), 'MMM d, h:mm a') // For tooltip
            };
        });
    }, [filteredMeasurements]);

    const currentUnit = filteredMeasurements.length > 0 ? filteredMeasurements[0].unit : '';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Measurements</Text>
                <TouchableOpacity onPress={() => router.push('/add-measurement')}><Ionicons name="add" size={24} color="#10B981" /></TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {measurementTypes.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
                            onPress={() => setSelectedType(t)}
                        >
                            <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content}>
                {selectedType && (
                    <TrendChart
                        data={chartData}
                        title={`${selectedType} Trends`}
                        unit={currentUnit}
                        color={selectedType === 'Weight' ? '#10B981' : selectedType === 'Blood Pressure' ? '#EF4444' : '#3B82F6'}
                    />
                )}

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>History</Text>
                    {filteredMeasurements.length === 0 ? (
                        <Text style={styles.emptyText}>No measurements found for this type.</Text>
                    ) : (
                        filteredMeasurements.map(m => (
                            <View key={m.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.cardValue}>{m.reading} <Text style={styles.cardUnit}>{m.unit}</Text></Text>
                                        <Text style={styles.cardDate}>{format(parseISO(m.dateTime), 'MMM d, yyyy h:mm a')}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeMeasurement(m.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
    typeSelector: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
    typeChipActive: { backgroundColor: '#10B981' },
    typeText: { fontSize: 14, color: '#6B7280' },
    typeTextActive: { color: '#FFFFFF' },
    content: { flex: 1 },
    listSection: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    cardUnit: { fontSize: 16, fontWeight: 'normal', color: '#6B7280' },
    cardDate: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
