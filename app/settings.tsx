import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="notifications-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Notifications</Text>
                    </View>
                    <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#E5E7EB', true: '#3B82F6' }} />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="moon-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Dark Mode</Text>
                    </View>
                    <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#E5E7EB', true: '#6366F1' }} />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="resize-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Units</Text>
                    </View>
                    <View style={styles.unitToggle}>
                        <TouchableOpacity style={[styles.unitButton, units === 'metric' && styles.unitButtonActive]} onPress={() => setUnits('metric')}>
                            <Text style={[styles.unitText, units === 'metric' && styles.unitTextActive]}>Metric</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.unitButton, units === 'imperial' && styles.unitButtonActive]} onPress={() => setUnits('imperial')}>
                            <Text style={[styles.unitText, units === 'imperial' && styles.unitTextActive]}>Imperial</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                
                <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="person-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Edit Profile</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="lock-closed-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Privacy</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data</Text>
                
                <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="cloud-upload-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Export Data</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="download-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Import Data</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                
                <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>Help Center</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="information-circle-outline" size={22} color="#4B5563" />
                        <Text style={styles.settingText}>About</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginLeft: 12 },
    section: { backgroundColor: '#FFFFFF', marginTop: 20, paddingHorizontal: 16, paddingVertical: 8 },
    sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    settingInfo: { flexDirection: 'row', alignItems: 'center' },
    settingText: { fontSize: 16, color: '#1A1A1A', marginLeft: 12 },
    unitToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
    unitButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    unitButtonActive: { backgroundColor: '#FFFFFF' },
    unitText: { fontSize: 14, color: '#6B7280' },
    unitTextActive: { color: '#1A1A1A', fontWeight: '600' },
});
