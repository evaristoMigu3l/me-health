import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { Activity } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const categories: Activity['category'][] = ['Basic Activities', 'Cognitive', 'Daily Living', 'Endurance'];

export default function AddActivityScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addActivity, updateActivity, activities } = useHealthStore();
    const [category, setCategory] = useState<Activity['category']>('Basic Activities');
    const [activity, setActivity] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(30);

    useEffect(() => {
        if (id) {
            const existing = activities.find(a => a.id === id);
            if (existing) {
                setCategory(existing.category);
                setActivity(existing.specificActivity);
                setHours(existing.durationHours);
                setMinutes(existing.durationMinutes);
            }
        }
    }, [id, activities]);

    const handleSubmit = () => {
        if (!activity.trim()) return;
        const data = {
            id: id || Date.now().toString(),
            category,
            specificActivity: activity,
            dateTime: new Date().toISOString(),
            durationHours: hours,
            durationMinutes: minutes,
        };

        if (id) {
            updateActivity(data);
        } else {
            addActivity(data);
        }
        router.back();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? t('edit') : t('add_log')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>{t('category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {categories.map((c) => (
                        <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{t(c.toLowerCase().replace(/ /g, '_') as any) || c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, { marginBottom: 20 }]} placeholder={t('or_type_custom_category')} value={category} onChangeText={setCategory} />

                <Text style={styles.label}>{t('activity')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder={t('activity_placeholder')} value={activity} onChangeText={setActivity} />

                <Text style={styles.label}>{t('duration')}</Text>
                <View style={styles.durationRow}>
                    <View style={styles.durationItem}>
                        <Text style={styles.durationLabel}>{t('hours')}</Text>
                        <View style={styles.durationControl}>
                            <TouchableOpacity onPress={() => setHours(Math.max(0, hours - 1))}><Ionicons name="remove" size={20} color="#3B82F6" /></TouchableOpacity>
                            <Text style={styles.durationValue}>{hours}</Text>
                            <TouchableOpacity onPress={() => setHours(hours + 1)}><Ionicons name="add" size={20} color="#3B82F6" /></TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.durationItem}>
                        <Text style={styles.durationLabel}>{t('minutes')}</Text>
                        <View style={styles.durationControl}>
                            <TouchableOpacity onPress={() => setMinutes(Math.max(0, minutes - 15))}><Ionicons name="remove" size={20} color="#3B82F6" /></TouchableOpacity>
                            <Text style={styles.durationValue}>{minutes}</Text>
                            <TouchableOpacity onPress={() => setMinutes(Math.min(59, minutes + 15))}><Ionicons name="add" size={20} color="#3B82F6" /></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !activity.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!activity.trim()}>
                    <Text style={styles.buttonText}>{t('save')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20, color: colors.text },
    chipContainer: { marginBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, marginRight: 10, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    chipText: { fontSize: 14, color: colors.textSecondary },
    chipTextActive: { color: colors.surface },
    durationRow: { flexDirection: 'row', marginBottom: 20 },
    durationItem: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginHorizontal: 4 },
    durationLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, textAlign: 'center' },
    durationControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    durationValue: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginHorizontal: 16 },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
});
