import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { FoodEntry } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

const foodTypes: FoodEntry['type'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function AddNutritionScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { addFoodEntry, updateFoodEntry, foodEntries } = useHealthStore();
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [type, setType] = useState<FoodEntry['type']>('Breakfast');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        if (id) {
            const existing = foodEntries.find(e => e.id === id);
            if (existing) {
                setName(existing.name);
                setCalories(existing.calories.toString());
                setType(existing.type);
                const exDate = new Date(existing.dateTime);
                setDate(exDate);
                setTime(format(exDate, 'HH:mm'));
            }
        }
    }, [id, foodEntries]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        const [hours, minutes] = time.split(':').map(Number);
        const entryDate = new Date(date);
        entryDate.setHours(hours || 0, minutes || 0);

        const data = {
            id: id || Date.now().toString(),
            name,
            calories: parseInt(calories) || 0,
            dateTime: entryDate.toISOString(),
            type,
        };

        if (id) {
            updateFoodEntry(data);
        } else {
            addFoodEntry(data);
        }
        router.back();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? t('edit_food') : t('log_food')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>{t('meal_type')}</Text>
                <View style={styles.typeRow}>
                    {foodTypes.map((tItem) => (
                        <TouchableOpacity key={tItem} style={[styles.typeButton, type === tItem && styles.typeButtonActive]} onPress={() => setType(tItem)}>
                            <Text style={[styles.typeText, type === tItem && styles.typeTextActive]}>{t(tItem.toLowerCase() as any) || tItem}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, { marginBottom: 20 }]} placeholder={t('or_type_custom_meal')} value={t(type.toLowerCase() as any) || type} onChangeText={setType as any} />

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>{t('date')}</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                            <Text style={styles.dateText}>{format(date, 'MMM d, yyyy', { locale: language === 'pt' ? ptBR : enUS })}</Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>{t('time')}</Text>
                        <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <Text style={styles.label}>{t('food_name')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder={t('eg_oatmeal')} value={name} onChangeText={setName} />

                <Text style={styles.label}>{t('calories')}</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder={t('eg_350')} value={calories} onChangeText={setCalories} keyboardType="numeric" />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!name.trim()}>
                    <Text style={styles.buttonText}>{id ? t('update') : t('save')}</Text>
                </TouchableOpacity>
            </View>

            <Modal statusBarTranslucent hardwareAccelerated visible={showCalendar} animationType="none" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Calendar
                            onDayPress={(day: { dateString: string }) => {
                                setDate(new Date(day.dateString));
                                setShowCalendar(false);
                            }}
                            markedDates={{
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#F59E0B' }
                            }}
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
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
                            <Text style={styles.closeText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    typeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    typeButtonActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
    typeText: { fontSize: 14, color: colors.textSecondary },
    typeTextActive: { color: colors.surface },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#F59E0B', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    dateText: { fontSize: 14, color: colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
});
