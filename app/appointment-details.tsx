import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

export default function AppointmentDetailsScreen() {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { appointments, removeAppointment } = useHealthStore();

    const appointment = appointments.find(a => a.id === params.id);

    if (!appointment) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('not_found')}</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{t('not_found')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('appointment_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-appointment', params: { id: appointment.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.title}>{appointment.reason}</Text>
                    {appointment.doctorName ? <Text style={styles.subtitle}>{t('with')} {appointment.doctorName}</Text> : null}
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color="#14B8A6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('date_time')}</Text>
                            <Text style={styles.value}>
                                {format(parseISO(appointment.dateTime), 'PPPP', { locale: language === 'pt' ? ptBR : enUS })} {t('at')} {format(parseISO(appointment.dateTime), 'HH:mm')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#14B8A6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('location')}</Text>
                            <Text style={styles.value}>{appointment.location}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="videocam-outline" size={20} color="#14B8A6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('type')}</Text>
                            <Text style={styles.value}>{t(appointment.type.toLowerCase().replace(' ', '_') as any) || appointment.type}</Text>
                        </View>
                    </View>
                </View>

                {appointment.reminder && appointment.reminder !== 'None' && appointment.reminder !== 'No Reminder' && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="alarm-outline" size={20} color="#14B8A6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('reminder')}</Text>
                                <Text style={styles.value}>
                                    {isNaN(new Date(appointment.reminder).getTime()) ? appointment.reminder : format(new Date(appointment.reminder), 'PP HH:mm', { locale: language === 'pt' ? ptBR : enUS })}
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
                                <Text style={styles.label}>{t('recurrence')}</Text>
                                <Text style={styles.value}>{t(appointment.recurrence.toLowerCase() as any) || appointment.recurrence}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeAppointment(appointment.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>{t('delete_appointment')}</Text>
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
