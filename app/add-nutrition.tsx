import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { FoodEntry } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const foodTypes: FoodEntry['type'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function AddNutritionScreen() {
    const router = useRouter();
    const addFoodEntry = useHealthStore((state) => state.addFoodEntry);
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [type, setType] = useState<FoodEntry['type']>('Breakfast');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [showCalendar, setShowCalendar] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        const [hours, minutes] = time.split(':').map(Number);
        const entryDate = new Date(date);
        entryDate.setHours(hours || 0, minutes || 0);

        addFoodEntry({
            id: Date.now().toString(),
            name,
            calories: parseInt(calories) || 0,
            dateTime: entryDate.toISOString(),
            type,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Log Food</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Meal Type</Text>
                <View style={styles.typeRow}>
                    {foodTypes.map((t) => (
                        <TouchableOpacity key={t} style={[styles.typeButton, type === t && styles.typeButtonActive]} onPress={() => setType(t)}>
                            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                            <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Time</Text>
                        <TextInput style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <Text style={styles.label}>Food Name</Text>
                <TextInput style={styles.input} placeholder="e.g., Oatmeal, Chicken Salad" value={name} onChangeText={setName} />

                <Text style={styles.label}>Calories</Text>
                <TextInput style={styles.input} placeholder="e.g., 350" value={calories} onChangeText={setCalories} keyboardType="numeric" />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!name.trim()}>
                    <Text style={styles.buttonText}>Save Food</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showCalendar} animationType="slide" transparent>
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
                            theme={{ todayTextColor: '#F59E0B', arrowColor: '#F59E0B', selectedDayBackgroundColor: '#F59E0B' }}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginLeft: 12 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    typeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    typeButtonActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
    typeText: { fontSize: 14, color: '#6B7280' },
    typeTextActive: { color: '#FFFFFF' },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#F59E0B', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
});
