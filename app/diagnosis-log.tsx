import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';

export default function DiagnosisLogScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { diagnoses, removeDiagnosis } = useHealthStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
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
                                        <Ionicons name="link" size={14} color={colors.textSecondary} />
                                        <Text style={[styles.sectionLabel, { marginLeft: 4 }]}>{d.linkedAppointmentIds.length} Linked Appointment{d.linkedAppointmentIds.length > 1 ? 's' : ''}</Text>
                                    </View>
                                </View>
                            )}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/add-diagnosis', params: { id: d.id } })}>
                                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeDiagnosis(d.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No diagnoses recorded.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    content: { flex: 1 },
    scrollContent: { padding: 16 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    condition: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.border },
    statusActive: { backgroundColor: '#FEF2F2' },
    statusResolved: { backgroundColor: '#ECFDF5' },
    statusText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    statusTextActive: { color: '#EF4444' },
    statusTextResolved: { color: '#10B981' },
    dateText: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    section: { marginBottom: 8 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
    sectionText: { fontSize: 14, color: colors.text },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
    editText: { fontSize: 14, color: '#3B82F6', marginLeft: 4 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
    deleteText: { fontSize: 14, color: '#EF4444', marginLeft: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12 },
});
