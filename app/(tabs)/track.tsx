import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';

export default function TrackScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();

    const categories = [
        { title: t('symptoms'), icon: 'pulse', color: '#EF4444', route: '/symptoms-log' },
        { title: t('add_symptom'), icon: 'add', color: '#EF4444', route: '/add-symptom' },
        { title: t('medications'), icon: 'medkit', color: '#3B82F6', route: '/medication-log' },
        { title: t('measurements'), icon: 'speedometer', color: '#10B981', route: '/measurement-log' },
        { title: t('nutrition'), icon: 'restaurant', color: '#F59E0B', route: '/nutrition-log' },
        { title: t('activity'), icon: 'walk', color: '#8B5CF6', route: '/activity-log' },
        { title: t('sleep'), icon: 'moon', color: '#6366F1', route: '/sleep-log' },
        { title: t('mood'), icon: 'happy', color: '#EC4899', route: '/mood-log' },
        { title: t('appointments'), icon: 'calendar', color: '#14B8A6', route: '/appointment-log' },
        { title: t('diagnoses'), icon: 'medical', color: '#EF4444', route: '/diagnosis-log' },
        { title: t('exams'), icon: 'document-text', color: '#3B82F6', route: '/investigation-log' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{t('what_to_track')}</Text>

                <View style={styles.grid}>
                    {categories.map((cat, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.categoryCard}
                            onPress={() => cat.route ? router.push(cat.route as any) : null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: cat.color + '20' }]}>
                                <Ionicons name={cat.icon as any} size={28} color={cat.color} />
                            </View>
                            <Text style={styles.categoryTitle}>{cat.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    iconWrapper: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    categoryTitle: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
