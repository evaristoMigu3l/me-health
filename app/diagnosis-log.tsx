import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';

export default function DiagnosisLogScreen() {
    const router = useRouter();
    const { diagnoses, removeDiagnosis } = useHealthStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Diagnoses</Text>
                <TouchableOpacity onPress={() => router.push('/add-diagnosis')}><Ionicons name="add" size={24} color="#EF4444" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {diagnoses.length > 0 ? (
                    diagnoses.map(d => (
                        <View key={d.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.condition}>{d.condition}</Text>
                                <View style={[styles.statusBadge, d.status === 'Active' ? styles.statusActive : styles.statusResolved]}>
                                    <Text style={[styles.statusText, d.status === 'Active' ? styles.statusTextActive : styles.statusTextResolved]}>{d.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.dateText}>Diagnosed: {format(parseISO(d.dateOfDiagnosis), 'MMM d, yyyy')}</Text>
                            {d.treatment ? (
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Treatment:</Text>
                                    <Text style={styles.sectionText}>{d.treatment}</Text>
                                </View>
                            ) : null}
                            {d.linkedAppointmentIds && d.linkedAppointmentIds.length > 0 && (
                                <View style={styles.section}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="link" size={14} color="#6B7280" />
                                        <Text style={[styles.sectionLabel, { marginLeft: 4 }]}>{d.linkedAppointmentIds.length} Linked Appointment{d.linkedAppointmentIds.length > 1 ? 's' : ''}</Text>
                                    </View>
                                </View>
                            )}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeDiagnosis(d.id)}><Ionicons name="trash-outline" size={18} color="#EF4444" /><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No diagnoses recorded.</Text>
                    </View>
                )}
            </ScrollView>
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    condition: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F3F4F6' },
    statusActive: { backgroundColor: '#FEF2F2' },
    statusResolved: { backgroundColor: '#ECFDF5' },
    statusText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    statusTextActive: { color: '#EF4444' },
    statusTextResolved: { color: '#10B981' },
    dateText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
    section: { marginBottom: 8 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
    sectionText: { fontSize: 14, color: '#1A1A1A' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, marginTop: 8 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#6B7280', marginTop: 12 },
});
