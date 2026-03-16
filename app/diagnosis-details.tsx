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

export default function DiagnosisDetailsScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const { diagnoses, removeDiagnosis } = useHealthStore();

    const diagnosis = diagnoses.find(d => d.id === params.id);

    if (!diagnosis) {
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

    const statusColors: Record<string, string> = {
        'Active': '#EF4444',
        'Resolved': '#10B981',
        'Recurring': '#F59E0B'
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('diagnosis_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-diagnosis', params: { id: diagnosis.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.title}>{diagnosis.condition}</Text>
                    <Text style={styles.subtitle}>{format(parseISO(diagnosis.dateOfDiagnosis), 'PPP', { locale: dateLocale })}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="medical-outline" size={20} color={statusColors[diagnosis.status]} />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('status')}</Text>
                            <Text style={[styles.value, { color: statusColors[diagnosis.status] }]}>{t(diagnosis.status.toLowerCase() as any) || diagnosis.status}</Text>
                        </View>
                    </View>
                </View>

                {diagnosis.treatment && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="medkit-outline" size={20} color="#3B82F6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('treatment')}</Text>
                                <Text style={styles.value}>{diagnosis.treatment}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {diagnosis.linkedAppointmentIds && diagnosis.linkedAppointmentIds.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('linked_appointments')}</Text>
                                <Text style={styles.value}>{diagnosis.linkedAppointmentIds.length} {t('appointment')}(s)</Text>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeDiagnosis(diagnosis.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>{t('delete_diagnosis')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    editLink: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
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
