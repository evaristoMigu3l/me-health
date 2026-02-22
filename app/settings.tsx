import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, NotificationSound } from '../stores/useThemeStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAudioPlayer } from 'expo-audio';
import { sendTestNotification } from '../utils/notifications';
import { useHealthStore } from '../stores/useHealthStore';
import { useUserStore } from '../stores/useUserStore';
import { exportAllHealthDataAsCSV, exportAllHealthDataAsPDF, exportAppDataAsJSON } from '../utils/exportData';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import EditProfileModal, { EditProfileForm } from '../components/EditProfileModal';

export default function SettingsScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const { themePreference, setThemePreference, notificationSound, setNotificationSound } = useThemeStore();
    const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
    const healthData = useHealthStore.getState();
    const { profile, setProfile } = useUserStore();
    const [editProfileVisible, setEditProfileVisible] = useState(false);
    const [editForm, setEditForm] = useState<EditProfileForm>({
        name: '', email: '', dob: '', gender: 'Other', ethnicity: ''
    });

    const [soundModalVisible, setSoundModalVisible] = useState(false);
    const [previewingSound, setPreviewingSound] = useState<string | null>(null);
    const sounds: { label: string, value: NotificationSound, file?: any }[] = [
        { label: 'Default OS Sound', value: 'default' },
        { label: '🔔 Bell', value: 'bell.ogg', file: require('../assets/sounds/bell.ogg') },
        { label: '🎵 Chime', value: 'chime.ogg', file: require('../assets/sounds/chime.ogg') },
        { label: '📳 Digital', value: 'digital.ogg', file: require('../assets/sounds/digital.ogg') },
        { label: '💔 Hurt Again – Julia Michaels', value: 'hurt_again.mp3', file: require('../assets/sounds/hurt_again.mp3') },
        { label: '⚡ Your Power – Billie Eilish', value: 'your_power.mp3', file: require('../assets/sounds/your_power.mp3') },
    ];

    const audioPlayer = useAudioPlayer(null);

    async function playSound(soundObj: { value: string, file?: any }) {
        if (!soundObj.file) return;
        try {
            setPreviewingSound(soundObj.value);
            audioPlayer.replace(soundObj.file);
            audioPlayer.play();
            // Reset the previewing indicator after 3 seconds
            setTimeout(() => setPreviewingSound(null), 3000);
        } catch (error) {
            console.error('Failed to play sound preview', error);
            setPreviewingSound(null);
        }
    }

    async function handleTestNotification() {
        // Preview the selected sound immediately in-app (works in Expo Go)
        const selected = sounds.find(s => s.value === notificationSound);
        if (selected?.file) {
            playSound(selected);
        }
        // Also send the scheduled notification
        await sendTestNotification();
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 0 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>

                    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
                        </View>
                        <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: colors.border, true: colors.primary }} />
                    </View>

                    <TouchableOpacity
                        style={[styles.settingRow, { borderBottomColor: colors.border }]}
                        onPress={() => setSoundModalVisible(true)}
                    >
                        <View style={styles.settingInfo}>
                            <Ionicons name="musical-notes-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Alert Sound</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: colors.textSecondary, marginRight: 8 }}>
                                {sounds.find(s => s.value === notificationSound)?.label || 'Default'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="moon-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Theme</Text>
                        </View>
                        <View style={[styles.unitToggle, { backgroundColor: colors.background }]}>
                            {(['system', 'light', 'dark'] as const).map((t) => (
                                <TouchableOpacity key={t} style={[styles.unitButton, themePreference === t && { backgroundColor: colors.surface }]} onPress={() => setThemePreference(t)}>
                                    <Text style={[styles.unitText, { color: colors.textSecondary }, themePreference === t && { color: colors.text, fontWeight: '600' }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="resize-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Units</Text>
                        </View>
                        <View style={[styles.unitToggle, { backgroundColor: colors.background }]}>
                            <TouchableOpacity style={[styles.unitButton, units === 'metric' && { backgroundColor: colors.surface }]} onPress={() => setUnits('metric')}>
                                <Text style={[styles.unitText, { color: colors.textSecondary }, units === 'metric' && { color: colors.text, fontWeight: '600' }]}>Metric</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.unitButton, units === 'imperial' && { backgroundColor: colors.surface }]} onPress={() => setUnits('imperial')}>
                                <Text style={[styles.unitText, { color: colors.textSecondary }, units === 'imperial' && { color: colors.text, fontWeight: '600' }]}>Imperial</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Test Notifications</Text>
                        </View>
                        <TouchableOpacity style={[styles.unitToggle, { backgroundColor: colors.primary, paddingHorizontal: 16 }]} onPress={handleTestNotification}>
                            <Text style={{ color: colors.surface, fontWeight: '600' }}>Send Test 🔔</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => {
                        // Set values AND open in same batch — no flicker
                        setEditForm({
                            name: profile?.name || '',
                            email: profile?.email || '',
                            dob: profile?.dob || '',
                            gender: profile?.gender || 'Other',
                            ethnicity: profile?.ethnicity || '',
                        });
                        setEditProfileVisible(true);
                    }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Edit Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => { }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Privacy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data Export</Text>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={async () => {
                        try { await exportAllHealthDataAsCSV(healthData); }
                        catch (e) { Alert.alert('Error', 'Failed to export CSV.'); }
                    }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Export as CSV</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={async () => {
                        try { await exportAllHealthDataAsPDF(healthData, profile?.name || 'User'); }
                        catch (e) { Alert.alert('Error', 'Failed to export PDF.'); }
                    }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="document-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Export as PDF</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App Backup</Text>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={async () => {
                        try {
                            const backup = {
                                version: 1,
                                exportedAt: new Date().toISOString(),
                                health: useHealthStore.getState(),
                                user: useUserStore.getState(),
                            };
                            await exportAppDataAsJSON(backup);
                        } catch (e) { Alert.alert('Error', 'Failed to export backup.'); }
                    }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="cloud-upload-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Export App Backup (JSON)</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={async () => {
                        try {
                            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
                            if (result.canceled || !result.assets?.[0]) return;
                            const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
                            const parsed = JSON.parse(content);
                            if (!parsed.health || !parsed.version) {
                                Alert.alert('Invalid File', 'This does not appear to be a valid Me & Health backup.');
                                return;
                            }
                            Alert.alert(
                                'Restore Backup',
                                `This will replace ALL your current data with the backup from ${new Date(parsed.exportedAt).toLocaleDateString()}. Continue?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Restore', style: 'destructive',
                                        onPress: () => {
                                            // Restore health data by calling Zustand setState directly
                                            useHealthStore.setState(parsed.health);
                                            if (parsed.user) useUserStore.setState(parsed.user);
                                            Alert.alert('✅ Restored', 'Your data has been restored successfully.');
                                        }
                                    }
                                ]
                            );
                        } catch (e) {
                            Alert.alert('Error', 'Could not read the backup file. Make sure it is a valid JSON file.');
                        }
                    }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="cloud-download-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Import App Backup (JSON)</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => { }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Help Center</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => { }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={soundModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Alert Sound</Text>
                            <TouchableOpacity onPress={() => setSoundModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={sounds}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.soundRow, { borderBottomColor: colors.border }]}
                                    onPress={() => setNotificationSound(item.value)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        {notificationSound === item.value
                                            ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                                            : <Ionicons name="radio-button-off" size={22} color={colors.border} />
                                        }
                                        <Text style={[styles.soundText, { color: colors.text, marginLeft: 12 }, notificationSound === item.value && { color: colors.primary, fontWeight: '700' }]}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    {item.file && (
                                        <TouchableOpacity
                                            style={[styles.playBtn, { backgroundColor: previewingSound === item.value ? colors.primary : colors.background }]}
                                            onPress={() => playSound(item)}
                                        >
                                            <Ionicons
                                                name={previewingSound === item.value ? 'pause' : 'play'}
                                                size={16}
                                                color={previewingSound === item.value ? '#fff' : colors.primary}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            <EditProfileModal
                visible={editProfileVisible}
                onClose={() => setEditProfileVisible(false)}
                form={editForm}
                onChange={(field, value) => setEditForm(f => ({ ...f, [field]: value }))}
                onSave={() => {
                    if (!editForm.name.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
                    setProfile({ ...(profile!), ...editForm, name: editForm.name.trim(), email: editForm.email.trim() });
                    setEditProfileVisible(false);
                }}
            />
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text, marginLeft: 12 },
    section: { backgroundColor: colors.surface, marginTop: 20, paddingHorizontal: 16, paddingVertical: 8 },
    sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    settingInfo: { flexDirection: 'row', alignItems: 'center' },
    settingText: { fontSize: 16, color: colors.text, marginLeft: 12 },
    unitToggle: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 4 },
    unitButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    unitButtonActive: { backgroundColor: colors.surface },
    unitText: { fontSize: 14, color: colors.textSecondary },
    unitTextActive: { color: colors.text, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeButton: { padding: 4 },
    soundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
    soundText: { fontSize: 16 },
    playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
