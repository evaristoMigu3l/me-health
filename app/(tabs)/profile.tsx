import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Switch, Alert, Modal } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import LockScreen from '../../components/LockScreen';
import EditProfileModal, { EditProfileForm } from '../../components/EditProfileModal';
import { useTranslation } from '../../hooks/useTranslation';

// PIN step: null = not setting up, 'setup' = modal is open
type PinStep = null | 'setup';

export default function ProfileScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const { t } = useTranslation();
    const { profile, setProfile, clearProfile } = useUserStore();
    const { hasPin, biometricEnabled, setBiometricEnabled, clearPin, setIsLocked } = useAuthStore();

    // ── All hooks at the top, NO hooks after conditional returns ──
    const [pinStep, setPinStep] = useState<PinStep>(null);
    const [hasBiometric, setHasBiometric] = useState(false);
    const [editProfileVisible, setEditProfileVisible] = useState(false);
    const [editForm, setEditForm] = useState<EditProfileForm>({
        name: '', email: '', dob: '', gender: 'Other', ethnicity: ''
    });

    useEffect(() => {
        LocalAuthentication.hasHardwareAsync().then(setHasBiometric);
    }, []);

    function closeEditModal() {
        setEditProfileVisible(false);
    }

    // Removed early conditional return — PIN setup now uses a Modal overlay (no flicker)

    async function pickImage() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('permission_required'), t('allow_photo_library'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setProfile({ ...profile!, avatarUri: result.assets[0].uri });
        }
    }

    function openEditModal() {
        // Set form values AND open modal in the same batch — first render sees correct values
        setEditForm({
            name: profile?.name || '',
            email: profile?.email || '',
            dob: profile?.dob || '',
            gender: profile?.gender || 'Other',
            ethnicity: profile?.ethnicity || '',
        });
        setEditProfileVisible(true);
    }

    function handleLogout() {
        Alert.alert(t('log_out_confirm'), '', [
            { text: t('cancel'), style: 'cancel' },
            { text: t('log_out'), style: 'destructive', onPress: () => { clearProfile(); router.replace('/onboarding'); } }
        ]);
    }

    function handleRemovePin() {
        Alert.alert(t('remove_pin'), t('remove_pin_confirm'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('remove'), style: 'destructive', onPress: () => clearPin() }
        ]);
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {profile?.avatarUri ? (
                            <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={44} color={colors.textSecondary} />
                            </View>
                        )}
                        <View style={styles.cameraBtn}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.name}>{profile?.name || t('guest')}</Text>
                    <Text style={styles.email}>{profile?.email || ''}</Text>

                    <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal}>
                        <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                        <Text style={[styles.editProfileText, { color: colors.primary }]}>{t('edit_profile')}</Text>
                    </TouchableOpacity>

                    <View style={styles.infoGrid}>
                        {[
                            { label: t('dob'), value: profile?.dob ? new Date(profile.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', icon: 'calendar-outline' },
                            { label: t('gender'), value: profile?.gender ? t(profile.gender.toLowerCase() as any) || profile.gender : '—', icon: 'person-outline' },
                            { label: t('ethnicity'), value: profile?.ethnicity || '—', icon: 'people-outline' },
                        ].map(s => (
                            <View key={s.label} style={styles.infoCard}>
                                <View style={styles.infoIconBox}>
                                    <Ionicons name={s.icon as any} size={18} color={colors.primary} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{s.label}</Text>
                                    <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{s.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('security')}</Text>

                    <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.menuText}>{t('app_pin_lock')}</Text>
                        <Text style={[styles.menuSub, hasPin ? { color: '#10B981' } : {}]}>{hasPin ? t('enabled') : t('off')}</Text>
                        {hasPin ? (
                            <TouchableOpacity onPress={handleRemovePin} style={styles.actionBtn}>
                                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>{t('remove')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => setPinStep('setup')} style={styles.actionBtn}>
                                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{t('set_up')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {hasPin && hasBiometric && (
                        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="finger-print-outline" size={20} color="#10B981" />
                            </View>
                            <Text style={styles.menuText}>{t('biometric_unlock')}</Text>
                            <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: colors.border, true: colors.primary }} />
                        </View>
                    )}

                    {hasPin && (
                        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setIsLocked(true)}>
                            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="lock-open-outline" size={20} color="#F97316" />
                            </View>
                            <Text style={styles.menuText}>{t('lock_app_now')}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Quick Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('general')}</Text>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/settings')}>
                        <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <Text style={styles.menuText}>{t('settings')}</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                        <Text style={styles.logoutText}>{t('log_out')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>

            <EditProfileModal
                visible={editProfileVisible}
                onClose={closeEditModal}
                form={editForm}
                onChange={(field, value) => setEditForm(f => ({ ...f, [field]: value }))}
                onSave={() => {
                    if (!editForm.name.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
                    setProfile({ ...profile!, ...editForm, name: editForm.name.trim(), email: editForm.email.trim() });
                    closeEditModal();
                }}
            />

            {/* PIN Setup overlay — Modal so profile stays mounted, no flicker */}
            <Modal
                visible={pinStep === 'setup'}
                animationType="none"
                transparent={false}
                statusBarTranslucent
                onRequestClose={() => setPinStep(null)}
            >
                <LockScreen
                    mode="setup"
                    onSuccess={() => {
                        setPinStep(null);
                        Alert.alert('✅ PIN Set', 'Your app will now lock when you close it.');
                    }}
                    onCancel={() => setPinStep(null)}
                />
            </Modal>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileHeader: { backgroundColor: colors.surface, paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    avatarWrapper: { position: 'relative', marginBottom: 16 },
    avatarImg: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.primary },
    avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
    name: { fontSize: 22, fontWeight: '700', color: colors.text },
    email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.primary },
    editProfileText: { fontSize: 13, fontWeight: '600' },
    infoGrid: { width: '100%', marginTop: 20, gap: 12 },
    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    infoIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 15, fontWeight: '600', color: colors.text },
    section: { backgroundColor: colors.surface, marginTop: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    menuText: { flex: 1, fontSize: 16, color: colors.text },
    menuSub: { fontSize: 13, color: colors.textSecondary, marginRight: 8 },
    actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, marginVertical: 16 },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 12 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
    genderRow: { flexDirection: 'row', gap: 10 },
    genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
