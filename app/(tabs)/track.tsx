import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const categories = [
    { title: 'Symptoms', icon: 'pulse', color: '#EF4444', route: '/symptoms-log' },
    { title: 'Add Symptom', icon: 'add', color: '#EF4444', route: '/add-symptom' },
    { title: 'Medications', icon: 'medkit', color: '#3B82F6', route: '/medication-log' },
    { title: 'Measurements', icon: 'speedometer', color: '#10B981', route: '/measurement-log' },
    { title: 'Nutrition', icon: 'restaurant', color: '#F59E0B', route: '/nutrition-log' },
    { title: 'Activity', icon: 'walk', color: '#8B5CF6', route: '/add-activity' },
    { title: 'Sleep', icon: 'moon', color: '#6366F1', route: '/sleep-log' },
    { title: 'Mood', icon: 'happy', color: '#EC4899', route: '/mood-log' },
    { title: 'Appointments', icon: 'calendar', color: '#14B8A6', route: '/appointment-log' },
    { title: 'Diagnoses', icon: 'medical', color: '#EF4444', route: '/diagnosis-log' },
    { title: 'Exams', icon: 'document-text', color: '#3B82F6', route: '/investigation-log' },
];

export default function TrackScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>What would you like to track?</Text>

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    iconWrapper: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    categoryTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
});
