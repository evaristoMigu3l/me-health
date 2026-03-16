import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import { MoodLog } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

export default function MoodDetailsScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { moodLogs, removeMoodLog } = useHealthStore();

    const mood = moodLogs.find((m: MoodLog) => m.id === params.id);

    if (!mood) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('not_found')}</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{t('mood_not_found')}</Text>
                </View>
            </View>
        );
    }

    const moodConfigs: Record<string, { emoji: string; color: string }> = {
        Happy: { emoji: '😊', color: '#10B981' },
        Neutral: { emoji: '😐', color: colors.textSecondary },
        Anxious: { emoji: '😰', color: '#F59E0B' },
        Sad: { emoji: '😢', color: '#3B82F6' },
        Angry: { emoji: '😠', color: '#EF4444' },
        Bored: { emoji: '😑', color: '#8B5CF6' },
    };

    const getMoodConfig = (m: MoodLog) => {
        if (moodConfigs[m.feeling]) {
            return moodConfigs[m.feeling];
        }
        return { emoji: m.emoji || '✨', color: '#6366F1' };
    };

    const config = getMoodConfig(mood);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('mood_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-mood', params: { id: mood.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.emoji}>{config.emoji}</Text>
                    <Text style={[styles.title, { color: config.color }]}>{t(mood.feeling.toLowerCase() as any) || mood.feeling}</Text>
                    <Text style={styles.subtitle}>{format(parseISO(mood.dateTime), 'PPP p', { locale: language === 'pt' ? ptBR : enUS })}</Text>
                </View>

                {mood.notes && (
                    <View style={styles.section}>
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                            <View style={styles.detailRowContent}>
                                <Text style={styles.label}>{t('notes')}</Text>
                                <Text style={styles.value}>{mood.notes}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.deleteButton} onPress={() => { removeMoodLog(mood.id); router.back(); }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteText}>{t('delete_mood')}</Text>
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
    section: { marginBottom: 20, alignItems: 'center' },
    emoji: { fontSize: 64, marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch' },
    detailRowContent: { marginLeft: 12, flex: 1 },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    value: { fontSize: 16, color: colors.text, fontWeight: '500', lineHeight: 22 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    deleteText: { color: '#EF4444', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});
