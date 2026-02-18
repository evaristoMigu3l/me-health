import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { useHealthStore } from '../../stores/useHealthStore';
import { Ionicons } from '@expo/vector-icons';

const moodEmojis: Record<string, string> = { Happy: '😊', Neutral: '😐', Anxious: '😰', Sad: '😢', Angry: '😠', Bored: '😑' };

export default function HomeScreen() {
    const router = useRouter();
    const { profile } = useUserStore();
    const { symptoms, medications, measurements, moodLogs, sleepLogs, activities, foodEntries, appointments } = useHealthStore();

    const totalCalories = foodEntries.reduce((sum, f) => sum + f.calories, 0);
    const totalSleep = sleepLogs.reduce((sum, s) => sum + s.hours, 0);
    const totalActivity = activities.reduce((sum, a) => sum + a.durationHours * 60 + a.durationMinutes, 0);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Hello, {profile?.name || 'Guest'}</Text>
                    <Text style={styles.subtitle}>Your health overview</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}><Text style={styles.statValue}>{symptoms.length}</Text><Text style={styles.statLabel}>Symptoms</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{medications.length}</Text><Text style={styles.statLabel}>Meds</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{measurements.length}</Text><Text style={styles.statLabel}>Measurements</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-symptom')}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}><Ionicons name="pulse" size={24} color="#EF4444" /></View>
                        <View style={styles.actionContent}><Text style={styles.actionTitle}>Log Symptoms</Text><Text style={styles.actionSubtitle}>Track how you feel</Text></View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-medication')}>
                        <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}><Ionicons name="medkit" size={24} color="#3B82F6" /></View>
                        <View style={styles.actionContent}><Text style={styles.actionTitle}>Add Medication</Text><Text style={styles.actionSubtitle}>Update your schedule</Text></View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}><Ionicons name="restaurant" size={20} color="#F59E0B" /><Text style={styles.summaryValue}>{totalCalories}</Text><Text style={styles.summaryLabel}>calories</Text></View>
                        <View style={styles.summaryItem}><Ionicons name="moon" size={20} color="#6366F1" /><Text style={styles.summaryValue}>{totalSleep}h</Text><Text style={styles.summaryLabel}>sleep</Text></View>
                        <View style={styles.summaryItem}><Ionicons name="walk" size={20} color="#8B5CF6" /><Text style={styles.summaryValue}>{Math.floor(totalActivity / 60)}m</Text><Text style={styles.summaryLabel}>activity</Text></View>
                        <View style={styles.summaryItem}><Ionicons name="happy" size={20} color="#EC4899" /><Text style={styles.summaryValue}>{moodLogs.length}</Text><Text style={styles.summaryLabel}>mood</Text></View>
                    </View>
                </View>

                {symptoms.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Symptoms</Text>
                        {symptoms.slice(0, 2).map((s) => (
                            <View key={s.id} style={styles.entryCard}>
                                <View style={styles.entryHeader}><Text style={styles.entryTitle}>{s.name}</Text><View style={[styles.badge, { backgroundColor: s.intensity >= 75 ? '#FEE2E2' : s.intensity >= 50 ? '#FEF3C7' : '#D1FAE5' }]}><Text style={[styles.badgeText, { color: s.intensity >= 75 ? '#DC2626' : s.intensity >= 50 ? '#D97706' : '#059669' }]}>{s.intensityLabel}</Text></View></View>
                                <Text style={styles.entryDate}>{new Date(s.dateStarted).toLocaleDateString()}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {medications.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Current Medications</Text>
                        {medications.slice(0, 2).map((m) => (
                            <View key={m.id} style={styles.entryCard}>
                                <View style={styles.entryHeader}><Text style={styles.entryTitle}>{m.name}</Text><Text style={styles.entrySubtitle}>{m.preparation}</Text></View>
                                <Text style={styles.entryDate}>{m.timesPerDay}x daily</Text>
                            </View>
                        ))}
                    </View>
                )}

                {moodLogs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Mood</Text>
                        <View style={styles.moodRow}>
                            {moodLogs.slice(-7).map((m) => (
                                <View key={m.id} style={styles.moodItem}><Text style={styles.moodEmoji}>{moodEmojis[m.feeling]}</Text><Text style={styles.moodDate}>{new Date(m.dateTime).getDate()}</Text></View>
                            ))}
                        </View>
                    </View>
                )}

                {appointments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                        {appointments.slice(0, 2).map((a) => (
                            <View key={a.id} style={styles.entryCard}>
                                <View style={styles.entryHeader}><Text style={styles.entryTitle}>{a.reason}</Text><Text style={styles.entrySubtitle}>{a.type}</Text></View>
                                <Text style={styles.entryDate}>{new Date(a.dateTime).toLocaleDateString()}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {symptoms.length === 0 && medications.length === 0 && measurements.length === 0 && moodLogs.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="heart" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No data yet</Text>
                        <Text style={styles.emptySubtitle}>Start tracking your health!</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    header: { marginBottom: 20 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
    subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4 },
    statsRow: { flexDirection: 'row', marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
    actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    actionContent: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    actionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    summaryGrid: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 4 },
    summaryLabel: { fontSize: 12, color: '#6B7280' },
    entryCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    entrySubtitle: { fontSize: 14, color: '#6B7280' },
    entryDate: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '500' },
    moodRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    moodItem: { alignItems: 'center' },
    moodEmoji: { fontSize: 24 },
    moodDate: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
