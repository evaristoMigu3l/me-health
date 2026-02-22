import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/useThemeStore';
import { useAppTheme } from '../hooks/useAppTheme';

export default function SettingsScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const { themePreference, setThemePreference } = useThemeStore();
    const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

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
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => { }}>
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
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => { }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="cloud-upload-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Export Data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => { }}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="download-outline" size={22} color={colors.textSecondary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>Import Data</Text>
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
});
