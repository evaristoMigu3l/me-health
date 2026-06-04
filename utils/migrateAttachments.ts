import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent directory for exam attachments.
 * Must match the constant in add-investigation.tsx.
 */
const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}exam-attachments/`;

/**
 * Key used to record that the migration has already run,
 * so we don't re-scan on every launch.
 */
const MIGRATION_KEY = 'attachment-migration-v1';

/**
 * Detects whether a URI points to the volatile Android cache directory
 * (the one that DocumentPicker and ImagePicker write to).
 */
function isCacheUri(uri: string): boolean {
    return uri.includes('/cache/') || uri.includes('/Cache/');
}

/**
 * Ensures the persistent attachments directory exists.
 */
async function ensureAttachmentsDir(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
    }
}

/**
 * Copies a single file from a volatile cache path to the persistent
 * `documentDirectory/exam-attachments/` folder.
 * Returns the new persistent URI, or null if the source no longer exists.
 */
async function copyFileToPersistent(cacheUri: string): Promise<string | null> {
    try {
        const info = await FileSystem.getInfoAsync(cacheUri);
        if (!info.exists) return null; // File already gone — nothing to rescue

        const originalName = decodeURIComponent(cacheUri).split('/').pop() || 'attachment';
        const uniqueName = `migrated_${Date.now()}_${originalName}`;
        const persistentUri = `${ATTACHMENTS_DIR}${uniqueName}`;

        await FileSystem.copyAsync({ from: cacheUri, to: persistentUri });
        return persistentUri;
    } catch {
        return null; // Silently skip files we can't copy
    }
}

/**
 * Runs once after app start. Reads the persisted health-storage JSON,
 * scans every investigation's attachments array for cache-based URIs,
 * copies any surviving files to persistent storage, removes dead URIs,
 * and writes the cleaned data back.
 *
 * This is idempotent — if it has already run successfully it won't
 * re-scan, thanks to the MIGRATION_KEY flag.
 */
export async function migrateAttachmentsToPersistentStorage(): Promise<void> {
    try {
        // Skip if migration was already performed
        const alreadyDone = await AsyncStorage.getItem(MIGRATION_KEY);
        if (alreadyDone === 'done') return;

        // Read the raw persisted Zustand health-storage
        const raw = await AsyncStorage.getItem('health-storage');
        if (!raw) {
            await AsyncStorage.setItem(MIGRATION_KEY, 'done');
            return;
        }

        const parsed = JSON.parse(raw);
        const state = parsed?.state;
        if (!state?.investigations || !Array.isArray(state.investigations)) {
            await AsyncStorage.setItem(MIGRATION_KEY, 'done');
            return;
        }

        await ensureAttachmentsDir();

        let anyChanged = false;

        for (const investigation of state.investigations) {
            if (!investigation.attachments || !Array.isArray(investigation.attachments)) continue;

            const migratedAttachments: string[] = [];

            for (const uri of investigation.attachments) {
                if (isCacheUri(uri)) {
                    // Try to rescue from cache
                    const newUri = await copyFileToPersistent(uri);
                    if (newUri) {
                        migratedAttachments.push(newUri);
                        anyChanged = true;
                        console.log('[AttachmentMigration] Rescued:', uri, '→', newUri);
                    } else {
                        // File is already gone — drop the dead URI
                        anyChanged = true;
                        console.log('[AttachmentMigration] Dropped dead URI:', uri);
                    }
                } else {
                    // Already a persistent/content URI — keep it
                    migratedAttachments.push(uri);
                }
            }

            investigation.attachments = migratedAttachments;
        }

        if (anyChanged) {
            // Write the updated state back to AsyncStorage
            await AsyncStorage.setItem('health-storage', JSON.stringify(parsed));
            console.log('[AttachmentMigration] Migration complete — updated health-storage');
        }

        // Mark migration as done
        await AsyncStorage.setItem(MIGRATION_KEY, 'done');
    } catch (err) {
        console.warn('[AttachmentMigration] Migration failed (non-fatal):', err);
        // Don't mark as done so it retries next launch
    }
}
