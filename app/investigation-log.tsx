import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';

export default function InvestigationLogScreen() {
    const router = useRouter();
    const { investigations, removeInvestigation, appointments } = useHealthStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Exams & Investigations</Text>
                <TouchableOpacity onPress={() => router.push('/add-investigation')}><Ionicons name="add" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>

            <FlatList
                data={investigations.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No exams recorded.</Text>
                    </View>
                }
                renderItem={({ item: i }) => {
                    const linkedAppt = i.linkedAppointmentId ? appointments.find(a => a.id === i.linkedAppointmentId) : null;
                    return (
                        <View style={styles.card}>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/exam-details', params: { id: i.id } })}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{i.type}</Text>
                                    <View style={[styles.statusBadge, i.status === 'Completed' ? styles.statusCompleted : i.status === 'Pending' ? styles.statusPending : styles.statusScheduled]}>
                                        <Text style={[styles.statusText, i.status === 'Completed' ? styles.statusTextCompleted : i.status === 'Pending' ? styles.statusTextPending : styles.statusTextScheduled]}>{i.status}</Text>
                                    </View>
                                </View>
                                <Text style={styles.dateText}>{format(parseISO(i.dateTime), 'MMM d, yyyy')}</Text>

                                {i.result ? (
                                    <View style={styles.resultContainer}>
                                        <Text style={styles.resultLabel}>Result:</Text>
                                        <Text style={styles.resultText}>{i.result}</Text>
                                    </View>
                                ) : null}

                                {i.attachments && i.attachments.length > 0 && (
                                    <View style={styles.attachmentsContainer}>
                                        <Text style={styles.sectionLabel}>Attachments:</Text>
                                        {i.attachments.map((file, idx) => (
                                            <View key={idx} style={styles.attachmentChip}>
                                                <Ionicons name="document-text" size={12} color="#4B5563" />
                                                <Text style={styles.attachmentText} numberOfLines={1}>{decodeURIComponent(file).split('/').pop()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {linkedAppt && (
                                    <View style={styles.linkContainer}>
                                        <Ionicons name="link" size={14} color="#6B7280" />
                                        <Text style={styles.linkText}>
                                            Linked to: {linkedAppt.reason || linkedAppt.doctorName || 'Appointment'} ({format(parseISO(linkedAppt.dateTime), 'MMM d')})
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-investigation', params: { id: i.id } })}>
                                    <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeInvestigation(i.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
    content: { flex: 1 },
    scrollContent: { padding: 16 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F3F4F6' },
    statusCompleted: { backgroundColor: '#ECFDF5' },
    statusPending: { backgroundColor: '#FFFBEB' },
    statusScheduled: { backgroundColor: '#EFF6FF' },
    statusText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
    statusTextCompleted: { color: '#059669' },
    statusTextPending: { color: '#D97706' },
    statusTextScheduled: { color: '#3B82F6' },
    dateText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
    resultContainer: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 12 },
    resultLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
    resultText: { fontSize: 15, color: '#1F2937' },
    linkContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    linkText: { fontSize: 13, color: '#6B7280', marginLeft: 6 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, marginTop: 8 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#6B7280', marginTop: 12 },
    attachmentsContainer: { marginBottom: 12 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
    attachmentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8, marginBottom: 4, alignSelf: 'flex-start' },
    attachmentText: { fontSize: 12, color: '#4B5563', marginLeft: 4 },
});
