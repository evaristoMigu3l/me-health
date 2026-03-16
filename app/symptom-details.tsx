import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { enUS, ptBR } from 'date-fns/locale';
import { useThemeStore } from '../stores/useThemeStore';

export default function SymptomDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { symptoms, removeSymptom } = useHealthStore();

    const dateLocale = language === 'pt' ? ptBR : enUS;
    const symptom = symptoms.find((s: any) => s.id === params.id);

    if (!symptom) {
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

    const intensityColors: any = { Mild: '#10B981', Moderate: '#F59E0B', Severe: '#EF4444', 'Very Severe': '#DC2626' };
    const color = intensityColors[symptom.intensityLabel] || '#3B82F6';

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('symptom_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-symptom', params: { id: symptom.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.detailHeader}>
                    <View style={[styles.intensityDot, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailTitle}>{symptom.name}</Text>
                        <Text style={styles.detailSub}>{t('intensity')}: {t(symptom.intensityLabel.toLowerCase().replace(' ', '_') as any) || symptom.intensityLabel} ({symptom.intensity}%)</Text>
                    </View>
                </View>

                <View style={styles.detailBody}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.detailLabel}>{t('date_time')}</Text>
                            <Text style={styles.detailValue}>{format(parseISO(symptom.dateStarted), 'PPP p', { locale: dateLocale })}</Text>
                        </View>
                    </View>

                    {symptom.place && (
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.detailLabel}>{t('location')}</Text>
                                <Text style={styles.detailValue}>{symptom.place}</Text>
                            </View>
                        </View>
                    )}

                    {symptom.notes && (
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.detailLabel}>{t('notes')}</Text>
                                <Text style={styles.detailValue}>{symptom.notes}</Text>
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeSymptom(symptom.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>{t('delete_symptom') || 'Delete Symptom'}</Text>
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
    intensityDot: { width: 16, height: 16, borderRadius: 8, marginTop: 8 },
    detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
    detailTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    detailSub: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
    detailBody: { gap: 20, marginBottom: 32 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    detailValue: { fontSize: 16, color: colors.text, fontWeight: '500', lineHeight: 22 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
