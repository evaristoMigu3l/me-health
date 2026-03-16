import { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Appointment } from '../types';
import { format, parseISO, isSameDay } from 'date-fns';
import { Calendar } from 'react-native-calendars';

export default function AppointmentLogScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { appointments, removeAppointment } = useHealthStore();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    

    // Marked Dates for Calendar
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        appointments.forEach(a => {
            const date = a.dateTime.split('T')[0];
            marks[date] = { marked: true, dotColor: '#14B8A6' };
        });
        // Highlight selected date
        marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            selected: true,
            selectedColor: '#14B8A6'
        };
        return marks;
    }, [appointments, selectedDate]);

    // Filter appointments by selected date
    const selectedAppointments = useMemo(() => {
        return appointments.filter(a => a.dateTime.split('T')[0] === selectedDate)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [appointments, selectedDate]);

    // Upcoming appointments (next 3)
    const upcomingAppointments = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(a => new Date(a.dateTime) >= now)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .slice(0, 3);
    }, [appointments]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Appointments</Text>
                <TouchableOpacity onPress={() => router.push('/add-appointment')}><Ionicons name="add" size={24} color="#14B8A6" /></TouchableOpacity>
            </View>

            <FlatList
                data={selectedAppointments}
                keyExtractor={(item) => item.id}
                renderItem={({ item: a }) => (
                    <View style={[styles.card, { marginHorizontal: 16 }]}>
                        <View style={styles.timeColumn}>
                            <Text style={styles.timeText}>{format(parseISO(a.dateTime), 'HH:mm')}</Text>
                            <View style={styles.verticalLine} />
                        </View>
                        <TouchableOpacity style={styles.cardContent} onPress={() => router.push({ pathname: '/appointment-details', params: { id: a.id } })} activeOpacity={0.7}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{a.reason}</Text>
                                <TouchableOpacity onPress={() => removeAppointment(a.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            {a.doctorName ? <Text style={styles.doctorText}>with {a.doctorName}</Text> : null}
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.detailText}>{a.location}</Text>
                            </View>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}><Text style={styles.badgeText}>{a.type}</Text></View>
                                {a.recurrence && a.recurrence !== 'None' && (
                                    <View style={[styles.badge, { backgroundColor: colors.border }]}>
                                        <Ionicons name="repeat" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{a.recurrence}</Text>
                                    </View>
                                )}
                                {a.reminder && a.reminder !== 'None' && (
                                    <View style={[styles.badge, { backgroundColor: colors.border }]}>
                                        <Ionicons name="alarm-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                                            {isNaN(new Date(a.reminder).getTime()) ? a.reminder : format(new Date(a.reminder), 'MMM d, HH:mm')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
                ListHeaderComponent={
                    <>
                        <View style={styles.calendarContainer}>
                            <Calendar
                                onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                                markedDates={markedDates}
                                theme={{
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
                                }}
                            />
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {format(parseISO(selectedDate), 'MMMM d, yyyy')}
                            </Text>
                        </View>
                    </>
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No appointments for this day.</Text>}
                ListFooterComponent={
                    upcomingAppointments.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Upcoming</Text>
                            {upcomingAppointments.map(a => (
                                <TouchableOpacity key={a.id} style={styles.miniCard} onPress={() => router.push({ pathname: '/appointment-details', params: { id: a.id } })}>
                                    <View style={styles.miniCardDate}>
                                        <Text style={styles.miniDay}>{format(parseISO(a.dateTime), 'd')}</Text>
                                        <Text style={styles.miniMonth}>{format(parseISO(a.dateTime), 'MMM')}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.miniTitle}>{a.reason}</Text>
                                        <Text style={styles.miniSubtitle}>{format(parseISO(a.dateTime), 'HH:mm')} • {a.location}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    content: { flex: 1 },
    calendarContainer: { backgroundColor: colors.surface, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', marginLeft: 4, textAlign: 'center', marginTop: 20 },
    card: { flexDirection: 'row', marginBottom: 16 },
    timeColumn: { alignItems: 'center', marginRight: 16, width: 60 },
    timeText: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
    verticalLine: { flex: 1, width: 2, backgroundColor: colors.border, borderRadius: 1 },
    cardContent: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    doctorText: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(20, 184, 166, 0.15)' },
    badgeText: { fontSize: 12, color: '#14B8A6', fontWeight: '500' },
    miniCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    miniCardDate: { alignItems: 'center', paddingRight: 12, borderRightWidth: 1, borderRightColor: colors.border, minWidth: 50 },
    miniDay: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    miniMonth: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
    miniTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    miniSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
