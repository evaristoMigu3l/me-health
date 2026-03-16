import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { useTranslation } from '../hooks/useTranslation';

// Fully controlled — NO internal state for form fields.
// Parent sets all values before opening the modal, so first render is always correct.
export interface EditProfileForm {
    name: string;
    email: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    ethnicity: string;
}

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    form: EditProfileForm;
    onChange: (field: keyof EditProfileForm, value: string) => void;
    onSave: () => void;
}

export default function EditProfileModal({ visible, onClose, form, onChange, onSave }: EditProfileModalProps) {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const { t } = useTranslation();

    const handleClose = () => {
        Keyboard.dismiss();
        setTimeout(() => onClose(), 100);
    };

    const handleSave = () => {
        Keyboard.dismiss();
        setTimeout(() => onSave(), 100);
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            hardwareAccelerated
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>{t('edit_profile')}</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                            {([
                                { label: t('full_name') + ' *', field: 'name' as const, placeholder: t('your_name'), keyboard: 'default' as const },
                                { label: t('email'), field: 'email' as const, placeholder: 'your@email.com', keyboard: 'email-address' as const },
                                { label: t('date_of_birth') + ' (' + t('dob_format') + ')', field: 'dob' as const, placeholder: t('dob_placeholder'), keyboard: 'default' as const },
                                { label: t('ethnicity'), field: 'ethnicity' as const, placeholder: t('eg_mixed'), keyboard: 'default' as const },
                            ]).map(f => (
                                <View key={f.field} style={styles.field}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{f.label}</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                        value={form[f.field]}
                                        onChangeText={(v) => onChange(f.field, v)}
                                        placeholder={f.placeholder}
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType={f.keyboard}
                                        autoCapitalize="none"
                                    />
                                </View>
                            ))}

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('gender')}</Text>
                                <View style={styles.genderRow}>
                                    {(['Male', 'Female', 'Other'] as const).map(g => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[
                                                styles.genderBtn,
                                                { borderColor: colors.border },
                                                form.gender === g && { backgroundColor: colors.primary, borderColor: colors.primary }
                                            ]}
                                            onPress={() => onChange('gender', g)}
                                        >
                                            <Text style={{ color: form.gender === g ? '#fff' : colors.text, fontWeight: '500' }}>{t(g.toLowerCase() as any) || g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>{t('save_changes')}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 16 }} />
                        </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '700' },
    field: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    genderRow: { flexDirection: 'row', gap: 10 },
    genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
