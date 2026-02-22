import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { profile, clearProfile } = useUserStore();

    const handleLogout = () => {
        clearProfile();
        router.replace('/onboarding');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
                <Text style={styles.name}>{profile?.name || 'Guest User'}</Text>
                <Text style={styles.email}>{profile?.email || 'No email set'}</Text>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
                    <View style={styles.menuIcon}><Ionicons name="settings-outline" size={22} color={colors.textSecondary} /></View>
                    <Text style={styles.menuText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                    <View style={styles.menuIcon}><Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} /></View>
                    <Text style={styles.menuText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileHeader: { backgroundColor: colors.surface, paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    name: { fontSize: 22, fontWeight: '600', color: colors.text },
    email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    menuContainer: { padding: 20 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 10 },
    menuIcon: { marginRight: 12 },
    menuText: { flex: 1, fontSize: 16, color: colors.text },
    logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, marginTop: 20 },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 12 },
});
