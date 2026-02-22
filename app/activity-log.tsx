import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';

export default function ActivityLogScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { activities, removeActivity } = useHealthStore();

    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [activities]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Activity Log</Text>
                <TouchableOpacity onPress={() => router.push('/add-activity')}><Ionicons name="add" size={24} color="#8B5CF6" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.listContainer}>
                {sortedActivities.map(a => (
                    <View key={a.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{a.category}</Text>
                            </View>
                            <Text style={styles.timeText}>{format(parseISO(a.dateTime), 'MMM d, h:mm a')}</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.activityTitle}>{a.specificActivity}</Text>
                            <View style={styles.durationBadge}>
                                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                <Text style={styles.durationText}>
                                    {a.durationHours > 0 ? `${a.durationHours}h ` : ''}
                                    {a.durationMinutes}m
                                </Text>
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-activity', params: { id: a.id } })}>
                                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => removeActivity(a.id)}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
                {sortedActivities.length === 0 && <Text style={styles.emptyText}>No activities logged yet.</Text>}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    content: { flex: 1 },
    listContainer: { paddingHorizontal: 16, paddingVertical: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    categoryText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600' },
    timeText: { fontSize: 12, color: colors.textSecondary },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    activityTitle: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 12 },
    durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    durationText: { marginLeft: 4, fontSize: 14, fontWeight: '500', color: '#4B5563' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic', marginTop: 40 },
});
