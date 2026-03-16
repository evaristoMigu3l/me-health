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

export default function SleepDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { sleepLogs, removeSleepLog } = useHealthStore();

    const dateLocale = language === 'pt' ? ptBR : enUS;
    const sleep = sleepLogs.find(s => s.id === params.id);

    if (!sleep) {
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

    const qualityColors = { Poor: '#EF4444', Fair: '#F59E0B', Good: '#10B981', Excellent: '#059669' };
    const emojiMap = { Poor: '😫', Fair: '😐', Good: '🙂', Excellent: '🤩' };
    const color = qualityColors[sleep.quality];
    const emoji = emojiMap[sleep.quality];

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('sleep_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-sleep', params: { id: sleep.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.detailHeader}>
                    <Text style={styles.detailEmoji}>{emoji}</Text>
                    <View>
                        <Text style={[styles.detailTitle, { color }]}>{t(sleep.quality.toLowerCase() as any) || sleep.quality}</Text>
                        <Text style={styles.detailSub}>{format(parseISO(sleep.dateTime), 'PPP', { locale: dateLocale })}</Text>
                    </View>
                </View>

                <View style={styles.hoursHighlight}>
                    <Text style={[styles.hoursValue, { color }]}>{sleep.hours}</Text>
                    <Text style={styles.hoursUnit}>{t('hours')}</Text>
                </View>

                <View style={styles.detailBody}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                        <View style={styles.detailRowContent}>
                            <Text style={styles.detailLabel}>{t('date_time')}</Text>
                            <Text style={styles.detailValue}>{format(parseISO(sleep.dateTime), 'PPP p', { locale: dateLocale })}</Text>
                        </View>
                    </View>

                    {sleep.notes && (
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.detailLabel}>{t('notes')}</Text>
                                <Text style={styles.detailValue}>{sleep.notes}</Text>
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeSleepLog(sleep.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>{t('delete_sleep')}</Text>
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
    detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    detailEmoji: { fontSize: 36 },
    detailTitle: { fontSize: 22, fontWeight: '700' },
    detailSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    hoursHighlight: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 24 },
    hoursValue: { fontSize: 56, fontWeight: '800' },
    hoursUnit: { fontSize: 18, color: colors.textSecondary, marginLeft: 8 },
    detailBody: { gap: 16, marginBottom: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    detailValue: { fontSize: 15, color: colors.text, fontWeight: '500', lineHeight: 22 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
