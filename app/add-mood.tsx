import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { MoodLog } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

const moods: { label: MoodLog['feeling']; emoji: string; color: string }[] = [
    { label: 'Happy', emoji: '😊', color: '#10B981' },
    { label: 'Neutral', emoji: '😐', color: '#6B7280' },
    { label: 'Anxious', emoji: '😰', color: '#F59E0B' },
    { label: 'Sad', emoji: '😢', color: '#3B82F6' },
    { label: 'Angry', emoji: '😠', color: '#EF4444' },
    { label: 'Bored', emoji: '😑', color: '#8B5CF6' },
];

export default function AddMoodScreen() {
    const router = useRouter();
    const addMoodLog = useHealthStore((state) => state.addMoodLog);
    const [selectedMood, setSelectedMood] = useState<MoodLog['feeling'] | null>(null);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [showCalendar, setShowCalendar] = useState(false);

    const handleSubmit = () => {
        if (!selectedMood) return;
        const [hours, minutes] = time.split(':').map(Number);
        const entryDate = new Date(date);
        entryDate.setHours(hours || 0, minutes || 0);

        addMoodLog({
            id: Date.now().toString(),
            dateTime: entryDate.toISOString(),
            feeling: selectedMood,
            notes,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>How are you feeling?</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

                <View style={styles.moodGrid}>
                    {moods.map((m) => (
                        <TouchableOpacity
                            key={m.label}
                            style={[styles.moodCard, selectedMood === m.label && { backgroundColor: m.color + '20', borderColor: m.color }]}
                            onPress={() => setSelectedMood(m.label)}
                        >
                            <Text style={styles.emoji}>{m.emoji}</Text>
                            <Text style={[styles.moodLabel, selectedMood === m.label && { color: m.color }]}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="What's on your mind?" value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !selectedMood && styles.buttonDisabled]} onPress={handleSubmit} disabled={!selectedMood}>
                    <Text style={styles.buttonText}>Save Mood</Text>
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
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: '#EC4899' }
                            }}
                            theme={{ todayTextColor: '#EC4899', arrowColor: '#EC4899', selectedDayBackgroundColor: '#EC4899' }}
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
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    moodCard: { width: '30%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
    emoji: { fontSize: 40, marginBottom: 8 },
    moodLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    textArea: { minHeight: 100 },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#EC4899', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    dateText: { fontSize: 14, color: '#1A1A1A' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#EC4899', fontSize: 16, fontWeight: '600' },
});
