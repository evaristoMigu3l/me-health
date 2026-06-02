import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../stores/useHealthStore';
import { format, parseISO } from 'date-fns';
import * as Sharing from 'expo-sharing';
// Using legacy import to access getContentUriAsync which is deprecated/removed in newer SDKs
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../stores/useThemeStore';
import { ptBR, enUS } from 'date-fns/locale';

/**
 * AttachmentCard checks if the file still exists on disk before rendering.
 * Old attachments stored from the cache directory may no longer exist
 * after Android clears the cache — this handles that gracefully.
 */
function AttachmentCard({ uri, colors, styles, t, onOpen }: {
    uri: string;
    colors: any;
    styles: any;
    t: (key: any) => string;
    onOpen: (uri: string) => void;
}) {
    const [fileExists, setFileExists] = useState<boolean | null>(null); // null = loading

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // content:// URIs can't be checked with getInfoAsync, assume they exist
                if (uri.startsWith('content://')) {
                    if (mounted) setFileExists(true);
                    return;
                }
                const info = await FileSystem.getInfoAsync(uri);
                if (mounted) setFileExists(info.exists);
            } catch {
                if (mounted) setFileExists(false);
            }
        })();
        return () => { mounted = false; };
    }, [uri]);

    const isImage = uri.match(/\.(jpg|jpeg|png|gif)$/i);
    const fileName = decodeURIComponent(uri).split('/').pop() || t('attachment');

    // Still checking...
    if (fileExists === null) {
        return (
            <View style={styles.attachmentCard}>
                <View style={styles.fileIconContainer}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                </View>
            </View>
        );
    }

    // File is missing — show a friendly message instead of crashing
    if (!fileExists) {
        return (
            <View style={[styles.attachmentCard, { opacity: 0.5 }]}>
                <View style={styles.fileIconContainer}>
                    <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
                </View>
                <View style={styles.attachmentInfo}>
                    <Text style={[styles.attachmentName, { color: '#EF4444' }]} numberOfLines={2}>
                        {t('error')}: {fileName}
                    </Text>
                </View>
            </View>
        );
    }

    // File exists — render normally
    return (
        <View style={styles.attachmentCard}>
            {isImage ? (
                <Image source={{ uri }} style={styles.attachmentImage} resizeMode="cover" />
            ) : (
                <View style={styles.fileIconContainer}>
                    <Ionicons name="document-text" size={32} color={colors.textSecondary} />
                </View>
            )}
            <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>{fileName}</Text>
                <TouchableOpacity style={styles.shareButton} onPress={() => onOpen(uri)}>
                    <Ionicons name="open-outline" size={16} color="#3B82F6" />
                    <Text style={styles.shareText}>{t('open')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ExamDetailsScreen() {

    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { language } = useThemeStore();
    const { investigations, appointments } = useHealthStore();
    const dateLocale = language === 'pt' ? ptBR : enUS;

    const exam = investigations.find(i => i.id === params.id);
    const linkedAppt = exam?.linkedAppointmentId ? appointments.find(a => a.id === exam.linkedAppointmentId) : null;

    if (!exam) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('exam_not_found')}</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{t('exam_not_found_desc')}</Text>
                </View>
            </View>
        );
    }

    const handleOpenFile = async (uri: string) => {
        try {
            if (Platform.OS === 'android') {
                const extension = uri.split('.').pop()?.toLowerCase();
                let mimeType = '*/*';
                if (extension === 'pdf') mimeType = 'application/pdf';
                else if (['jpg', 'jpeg', 'png'].includes(extension || '')) mimeType = 'image/*';
                else if (['doc', 'docx'].includes(extension || '')) mimeType = 'application/msword';

                // If it's already a content URI, use it directly (common from document picker)
                // Otherwise convert file URI to content URI
                const contentUri = uri.startsWith('content://')
                    ? uri
                    : await FileSystem.getContentUriAsync(uri);

                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    type: mimeType,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                });
            } else {
                if (!(await Sharing.isAvailableAsync())) {
                    alert(t('error')); // Assuming we have a general error key or create one
                    return;
                }
                await Sharing.shareAsync(uri);
            }
        } catch (e: any) {
            console.log('File open error:', e);
            Alert.alert(t('error'), `${t('error')}: ${e.message || JSON.stringify(e)}`);
            // Fallback commented out to verify error
            // if (await Sharing.isAvailableAsync()) {
            //    await Sharing.shareAsync(uri);
            // }
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('exam_details')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-investigation', params: { id: exam.id } })}>
                    <Text style={styles.editLink}>{t('edit')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.label}>{t('type')}</Text>
                    <Text style={styles.value}>{exam.type}</Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfSection}>
                        <Text style={styles.label}>{t('date')}</Text>
                        <Text style={styles.value}>{format(parseISO(exam.dateTime), 'MMM d, yyyy', { locale: dateLocale })}</Text>
                    </View>
                    <View style={styles.halfSection}>
                        <Text style={styles.label}>{t('status')}</Text>
                        <View style={[styles.statusBadge, exam.status === 'Completed' ? styles.statusCompleted : exam.status === 'Pending' ? styles.statusPending : styles.statusScheduled]}>
                            <Text style={[styles.statusText, exam.status === 'Completed' ? styles.statusTextCompleted : exam.status === 'Pending' ? styles.statusTextPending : styles.statusTextScheduled]}>{t(exam.status.toLowerCase() as any) || exam.status}</Text>
                        </View>
                    </View>
                </View>

                {exam.result ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('result')}</Text>
                        <View style={styles.resultBox}>
                            <Text style={styles.resultText}>{exam.result}</Text>
                        </View>
                    </View>
                ) : null}

                {exam.notes ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('notes')}</Text>
                        <Text style={styles.value}>{exam.notes}</Text>
                    </View>
                ) : null}

                {linkedAppt && (
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('linked_appointment')}</Text>
                        <TouchableOpacity style={styles.linkCard}>
                            <Ionicons name="calendar" size={20} color="#3B82F6" />
                            <View style={styles.linkInfo}>
                                <Text style={styles.linkTitle}>{linkedAppt.reason || linkedAppt.doctorName || t('appointment')}</Text>
                                <Text style={styles.linkDate}>{format(parseISO(linkedAppt.dateTime), 'PPPP p', { locale: dateLocale })}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {exam.attachments && exam.attachments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('attachments')}</Text>
                        {exam.attachments.map((uri, index) => (
                            <AttachmentCard
                                key={index}
                                uri={uri}
                                colors={colors}
                                styles={styles}
                                t={t}
                                onOpen={handleOpenFile}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    editLink: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: colors.textSecondary, fontSize: 16 },
    section: { marginBottom: 24 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    halfSection: { flex: 0.48 },
    label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    value: { fontSize: 16, color: colors.text, lineHeight: 24 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    statusCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
    statusScheduled: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
    statusText: { fontSize: 14, fontWeight: '600' },
    statusTextCompleted: { color: '#10B981' },
    statusTextPending: { color: '#F59E0B' },
    statusTextScheduled: { color: '#3B82F6' },
    resultBox: { backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    resultText: { fontSize: 16, color: colors.text },
    linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    linkInfo: { marginLeft: 12 },
    linkTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    linkDate: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    attachmentCard: { backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    attachmentImage: { width: '100%', height: 200, backgroundColor: colors.border },
    fileIconContainer: { width: '100%', height: 100, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    attachmentInfo: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    attachmentName: { flex: 1, fontSize: 14, color: colors.text, marginRight: 12 },
    shareButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    shareText: { fontSize: 14, color: '#3B82F6', fontWeight: '600', marginLeft: 4 },
});
