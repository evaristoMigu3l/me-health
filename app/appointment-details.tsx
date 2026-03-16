import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';

export default function AppointmentDetailsScreen() {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { appointments, removeAppointment } = useHealthStore();

    const appointment = appointments.find(a => a.id === params.id);

    if (!appointment) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Not Found</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Appointment not found.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Appointment Details</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-appointment', params: { id: appointment.id } })}>
                    <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.title}>{appointment.reason}</Text>
                    {appointment.doctorName ? <Text style={styles.subtitle}>with {appointment.doctorName}</Text> : null}
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color="#14B8A6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>Date & Time</Text>
                            <Text style={styles.value}>
                                {format(parseISO(appointment.dateTime), 'PPPP')} at {format(parseISO(appointment.dateTime), 'HH:mm')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#14B8A6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{appointment.location}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="videocam-outline" size={20} color="#14B8A6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>Type</Text>
                            <Text style={styles.value}>{appointment.type}</Text>
                        </View>
                    </View>
                </View>

                {appointment.reminder && appointment.reminder !== 'None' && appointment.reminder !== 'No Reminder' && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="alarm-outline" size={20} color="#14B8A6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>Reminder</Text>
                                <Text style={styles.value}>
                                    {isNaN(new Date(appointment.reminder).getTime()) ? appointment.reminder : format(new Date(appointment.reminder), 'PP HH:mm')}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {appointment.recurrence && appointment.recurrence !== 'None' && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="repeat-outline" size={20} color="#14B8A6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>Recurrence</Text>
                                <Text style={styles.value}>{appointment.recurrence}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeAppointment(appointment.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>Delete Appointment</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    editLink: { fontSize: 16, color: '#14B8A6', fontWeight: '600' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: colors.textSecondary, fontSize: 16 },
    section: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    value: { fontSize: 16, color: colors.text, fontWeight: '500', lineHeight: 22 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
