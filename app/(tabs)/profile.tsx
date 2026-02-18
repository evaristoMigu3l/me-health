import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
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
                    <Ionicons name="person" size={40} color="#9CA3AF" />
                </View>
                <Text style={styles.name}>{profile?.name || 'Guest User'}</Text>
                <Text style={styles.email}>{profile?.email || 'No email set'}</Text>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
                    <View style={styles.menuIcon}><Ionicons name="settings-outline" size={22} color="#4B5563" /></View>
                    <Text style={styles.menuText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                    <View style={styles.menuIcon}><Ionicons name="help-circle-outline" size={22} color="#4B5563" /></View>
                    <Text style={styles.menuText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    profileHeader: { backgroundColor: '#FFFFFF', paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    name: { fontSize: 22, fontWeight: '600', color: '#1A1A1A' },
    email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    menuContainer: { padding: 20 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10 },
    menuIcon: { marginRight: 12 },
    menuText: { flex: 1, fontSize: 16, color: '#1A1A1A' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, marginTop: 20 },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 12 },
});
