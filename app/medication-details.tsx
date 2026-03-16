import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { enUS, ptBR } from 'date-fns/locale';

function MedicationDetailsScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { medications, removeMedication } = useHealthStore();

    const dateLocale = language === 'pt' ? ptBR : enUS;
    const medication = medications.find(m => m.id === params.id);

    if (!medication) {
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
                <Text style={styles.headerTitle}>{t('medication_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-medication', params: { id: medication.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.colorBar, { backgroundColor: medication.color || '#3B82F6' }]} />

                <View style={styles.section}>
                    <Text style={styles.title}>{medication.name}</Text>
                    <Text style={styles.subtitle}>{t(medication.preparation.toLowerCase() as any) || medication.preparation} • {medication.dosageUnit}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="medical-outline" size={20} color="#3B82F6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('status')}</Text>
                            <Text style={styles.value}>
                                {medication.endDate && new Date(medication.endDate).getTime() < new Date().getTime()
                                    ? t('completed')
                                    : t(medication.status.toLowerCase() as any) || medication.status}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="repeat-outline" size={20} color="#3B82F6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('frequency')}</Text>
                            <Text style={styles.value}>{t(medication.frequency.toLowerCase() as any) || medication.frequency}</Text>
                        </View>
                    </View>
                </View>

                {medication.schedule && medication.schedule.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="alarm-outline" size={20} color="#3B82F6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('schedule')}</Text>
                                {medication.schedule.map((s, idx) => (
                                    <Text key={idx} style={styles.value}>{s.time} — {s.dosage} {medication.dosageUnit}</Text>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.label}>{t('start_date')}</Text>
                            <Text style={styles.value}>{format(parseISO(medication.startDate), 'PPP', { locale: dateLocale })}</Text>
                        </View>
                    </View>
                </View>

                {medication.endDate && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={20} color="#10B981" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('end_date')}</Text>
                                <Text style={styles.value}>{format(parseISO(medication.endDate), 'PPP', { locale: dateLocale })}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {medication.targetCondition && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="fitness-outline" size={20} color="#8B5CF6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('for_condition') || 'For Condition'}</Text>
                                <Text style={styles.value}>{medication.targetCondition}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {medication.type && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="pricetag-outline" size={20} color="#3B82F6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('type')}</Text>
                                <Text style={styles.value}>{t(medication.type.toLowerCase() as any) || medication.type}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {medication.formulation && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="flask-outline" size={20} color="#3B82F6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('formulation') || 'Formulation'}</Text>
                                <Text style={styles.value}>{medication.formulation}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {medication.selfPrescribed && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={20} color="#F59E0B" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('prescribed_by') || 'Prescribed By'}</Text>
                                <Text style={styles.value}>{t('self_prescribed_value') || 'Self-prescribed'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {medication.notes && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('notes')}</Text>
                                <Text style={styles.value}>{medication.notes}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeMedication(medication.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>{t('delete_medication') || 'Delete Medication'}</Text>
                </TouchableOpacity>
            </ScrollView >
        </View >
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
    colorBar: { width: 4, height: 48, borderRadius: 2, marginBottom: 16 },
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

export default MedicationDetailsScreen;
