import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { MoodLog } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';

export default function AddMoodScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const moods: { label: MoodLog['feeling']; emoji: string; color: string }[] = [
        { label: 'Happy', emoji: '😊', color: '#10B981' },
        { label: 'Neutral', emoji: '😐', color: colors.textSecondary },
        { label: 'Anxious', emoji: '😰', color: '#F59E0B' },
        { label: 'Sad', emoji: '😢', color: '#3B82F6' },
        { label: 'Angry', emoji: '😠', color: '#EF4444' },
        { label: 'Bored', emoji: '😑', color: '#8B5CF6' },
    ];

    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addMoodLog, updateMoodLog, moodLogs } = useHealthStore();
    const [selectedMood, setSelectedMood] = useState<MoodLog['feeling'] | null>(null);
    const [customMood, setCustomMood] = useState('');
    const [customEmoji, setCustomEmoji] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        if (id) {
            const existing = moodLogs.find(m => m.id === id);
            if (existing) {
                const isPredefined = moods.some(m => m.label === existing.feeling);
                if (isPredefined) {
                    setSelectedMood(existing.feeling);
                } else {
                    setCustomMood(existing.feeling);
                    setCustomEmoji(existing.emoji || '');
                }
                setNotes(existing.notes || '');
                const exDate = new Date(existing.dateTime);
                setDate(exDate);
                setTime(format(exDate, 'HH:mm'));
            }
        }
    }, [id, moodLogs]);

    const handleSubmit = () => {
        const feelingToSave = customMood.trim() ? customMood.trim() : selectedMood;
        if (!feelingToSave) return;
        const [hours, minutes] = time.split(':').map(Number);
        const entryDate = new Date(date);
        entryDate.setHours(hours || 0, minutes || 0);

        const data = {
            id: id || Date.now().toString(),
            dateTime: entryDate.toISOString(),
            feeling: feelingToSave,
            emoji: customMood.trim() ? customEmoji.trim() : undefined,
            notes,
        };

        if (id) {
            updateMoodLog(data);
        } else {
            addMoodLog(data);
        }
        router.back();
    };

    const handleSelectPredefined = (label: string) => {
        setCustomMood('');
        setCustomEmoji('');
        setSelectedMood(label);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Mood' : 'How are you feeling?'}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.rowBetween}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                            <Text style={styles.dateText}>{format(date, 'MMM d, yyyy')}</Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Time</Text>
                        <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="HH:MM" value={time} onChangeText={setTime} />
                    </View>
                </View>

                <View style={styles.moodGrid}>
                    {moods.map((m) => (
                        <TouchableOpacity
                            key={m.label}
                            style={[styles.moodCard, selectedMood === m.label && !customMood.trim() && { backgroundColor: m.color + '20', borderColor: m.color }]}
                            onPress={() => handleSelectPredefined(m.label)}
                        >
                            <Text style={styles.emoji}>{m.emoji}</Text>
                            <Text style={[styles.moodLabel, selectedMood === m.label && { color: m.color }]}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Or add a custom feeling</Text>
                <View style={styles.rowBetween}>
                    <View style={[styles.halfWidth, { width: '30%' }]}>
                        <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="Emoji" value={customEmoji} onChangeText={(text) => { setCustomEmoji(text); setSelectedMood(null); }} maxLength={2} />
                    </View>
                    <View style={[styles.halfWidth, { width: '68%' }]}>
                        <TextInput placeholderTextColor={colors.textSecondary} style={styles.input} placeholder="e.g., Excited" value={customMood} onChangeText={(text) => { setCustomMood(text); setSelectedMood(null); }} />
                    </View>
                </View>

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} placeholder="What's on your mind?" value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, !(selectedMood || customMood.trim()) && styles.buttonDisabled]} onPress={handleSubmit} disabled={!(selectedMood || customMood.trim())}>
                    <Text style={styles.buttonText}>{id ? 'Update Mood' : 'Save Mood'}</Text>
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
                            theme={{ calendarBackground: colors.surface,
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
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    moodCard: { width: '30%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
    emoji: { fontSize: 40, marginBottom: 8 },
    moodLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 , color: colors.text },
    textArea: { minHeight: 100 },
    footer: { padding: 20, paddingBottom: 32 },
    button: { backgroundColor: '#EC4899', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#D1D5DB' },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    halfWidth: { width: '48%' },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    dateText: { fontSize: 14, color: colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeButton: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: '#EC4899', fontSize: 16, fontWeight: '600' },
});
