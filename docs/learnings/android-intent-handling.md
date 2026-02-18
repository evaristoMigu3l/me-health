# Handling File Attachments and Android Intents in Expo

This guide details the solution for opening file attachments (PDFs, Images, etc.) natively on Android using Expo, bypassing the generic "Share" sheet when possible.

## The Problem

When developing a React Native app with Expo, the `expo-sharing` module is often used to interact with files. However, on Android, this typically opens a generic "Share" bottom sheet rather than opening the file directly in a viewing application (like a PDF Viewer or Gallery).

Furthermore, recent updates to Android (Scoped Storage) and Expo SDK 54+ have deprecated `FileSystem.getContentUriAsync`, making it tricky to convert `file://` URIs to `content://` URIs required for secure interactions.

## The Solution

To achieve native file opening on Android, we use a combination of:
1.  **MIME Type Detection**: Explicitly telling the OS what kind of file we are opening.
2.  **`expo-file-system/legacy`**: To access the deprecated but necessary `getContentUriAsync` method for converting internal file paths to shareable Content URIs.
3.  **`expo-intent-launcher`**: To fire an Android `ACTION_VIEW` intent with the correct data and permissions.

### Prerequisites

```bash
npx expo install expo-file-system expo-intent-launcher expo-sharing
```

### Implementation

The core logic resides in a handler function (e.g., `handleOpenFile`).

```typescript
import { Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
// Import legacy API to use getContentUriAsync
import * as FileSystem from 'expo-file-system/legacy'; 

const handleOpenFile = async (uri: string) => {
    try {
        if (Platform.OS === 'android') {
            // 1. Determine MIME Type
            // Simple heuristic based on extension. 
            // For production, consider using a library like 'mime' or 'mime-types'.
            const extension = uri.split('.').pop()?.toLowerCase();
            let mimeType = '*/*';
            if (extension === 'pdf') mimeType = 'application/pdf';
            else if (['jpg', 'jpeg', 'png'].includes(extension || '')) mimeType = 'image/*';
            else if (['doc', 'docx'].includes(extension || '')) mimeType = 'application/msword';
            else if (['xls', 'xlsx'].includes(extension || '')) mimeType = 'application/vnd.ms-excel';

            // 2. Get Secure Content URI
            // If the URI is already a content:// URI (e.g. from DocumentPicker), use it.
            // Otherwise, convert the file:// URI to a content:// URI using the legacy API.
            const contentUri = uri.startsWith('content://') 
                ? uri 
                : await FileSystem.getContentUriAsync(uri);
            
            // 3. Launch Native Intent
            // FLAG_GRANT_READ_URI_PERMISSION (1) is crucial to let the target app read the file.
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: contentUri,
                type: mimeType,
                flags: 1, 
            });
        } else {
            // iOS / Other Fallback
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Error', 'Sharing is not available on this platform');
                return;
            }
            await Sharing.shareAsync(uri);
        }
    } catch (e: any) {
        console.error('File open error:', e);
        Alert.alert('Open Failed', `Error opening file: ${e.message}`);
        
        // Optional: Fallback to sharing if intent fails
        // if (await Sharing.isAvailableAsync()) {
        //    await Sharing.shareAsync(uri);
        // }
    }
};
```

## Key Learnings

1.  **Explicit Intent Data**: Android Intents need both data (`content://...`) and `type` (MIME type) to correctly filter available applications. Without the type, it may fail or offer irrelevant apps.
2.  **Permissions Flags**: Passing `flags: 1` (`FLAG_GRANT_READ_URI_PERMISSION`) is mandatory when sharing `content://` URIs with other apps, otherwise they cannot access the file stream.
3.  **SDK 54 Compatibility**: As of SDK 54, `getContentUriAsync` was moved to `expo-file-system/legacy`. Any "method deprecated" errors can be resolved by updating the import path.

## Common Pitfalls

-   **Using `file://` URIs directly**: Android apps often cannot read raw file paths from other apps due to permission restrictions. Always convert to Content URIs.
-   **Missing MIME Types**: If you don't provide a MIME type, Android might default to text or binary, failing to open PDF readers.
-   **Name vs URI**: Ensure you persist the full `uri` (or a persistent reference), not just the file name, when saving attachments.
