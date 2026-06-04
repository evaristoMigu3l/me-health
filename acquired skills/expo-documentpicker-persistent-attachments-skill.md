# Expo DocumentPicker – Persistent Attachments Fix

## Problem
When users uploaded photos/files as attachments to medical exams (Investigations), the attachments would **disappear after ~1 day**. Reopening the exam details screen would crash with:

```
Error: Call to function 'ExponentFileSystem.getContentUriSync' has been rejected.
Caused by: java.io.IOException: Directory for
'/data/user/0/com.evaristo.meandhealth/cache/DocumentPicker/2de5ab8-b5bd-401f-b0f3-8ce807130b37.jpg'
doesn't exist. Please make sure directory
'/data/user/0/com.evaristo.meandhealth/cache/DocumentPicker' exists before calling downloadAsync.
```

## Root Cause

`expo-document-picker` with `copyToCacheDirectory: true` copies files to:
```
/data/user/0/<app-id>/cache/DocumentPicker/<uuid>.<ext>
```

This is a **volatile temporary cache directory**. Android clears it:
- When storage runs low
- Periodically (usually within 24 hours)
- On app updates

The app was storing this **cache URI directly** in Zustand state (persisted via AsyncStorage), so after Android cleared the cache, the URI pointed to a non-existent file.

## Solution Applied

### 1. Copy to Persistent Storage on Pick (`add-investigation.tsx`)

Added a `copyToPersistentStorage()` function that immediately copies the picked file from the cache to `FileSystem.documentDirectory` (permanent storage that Android **never** auto-clears):

```typescript
import * as FileSystem from 'expo-file-system/legacy';

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}exam-attachments/`;

const copyToPersistentStorage = async (cacheUri: string, fileName: string): Promise<string> => {
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
    }

    // Unique filename to avoid collisions
    const uniqueName = `${Date.now()}_${fileName}`;
    const persistentUri = `${ATTACHMENTS_DIR}${uniqueName}`;

    await FileSystem.copyAsync({ from: cacheUri, to: persistentUri });
    return persistentUri;
};
```

Then in `handlePickDocument`:
```typescript
const asset = result.assets[0];
const fileName = asset.name || asset.uri.split('/').pop() || 'attachment';
const persistentUri = await copyToPersistentStorage(asset.uri, fileName);
setAttachments([...attachments, persistentUri]);
```

### 2. Resilient Attachment Display (`exam-details.tsx`)

Created an `AttachmentCard` component that:
- **Checks if the file exists** via `FileSystem.getInfoAsync()` before rendering
- Shows a **loading indicator** while checking
- Shows a **friendly error state** (red icon + message) for missing files instead of crashing
- Handles `content://` URIs separately (can't be checked with `getInfoAsync`)

```typescript
function AttachmentCard({ uri, colors, styles, t, onOpen }) {
    const [fileExists, setFileExists] = useState<boolean | null>(null);

    useEffect(() => {
        // content:// URIs can't be checked, assume they exist
        if (uri.startsWith('content://')) { setFileExists(true); return; }
        
        FileSystem.getInfoAsync(uri).then(info => setFileExists(info.exists));
    }, [uri]);

    if (fileExists === null) return <ActivityIndicator />;
    if (!fileExists) return <ErrorState />;
    return <NormalAttachmentView />;
}
```

## Key Concepts

| Concept | Details |
|---------|---------|
| `cacheDirectory` | Volatile. Android clears it anytime. **Never store persistent data here.** |
| `documentDirectory` | Permanent. Only cleared when app is uninstalled. **Use for user data.** |
| `FileSystem.copyAsync()` | Copies file from one URI to another |
| `FileSystem.makeDirectoryAsync()` | Creates directories; use `{ intermediates: true }` for nested paths |
| `FileSystem.getInfoAsync()` | Returns `{ exists: boolean, ... }` — use to validate URIs before access |

## Files Modified

1. **`app/add-investigation.tsx`** — Added `FileSystem` import, `ATTACHMENTS_DIR` constant, `copyToPersistentStorage()` function, updated `handlePickDocument()`
2. **`app/exam-details.tsx`** — Added `useState`/`useEffect` imports, `ActivityIndicator`, new `AttachmentCard` component with file existence validation

## Pitfall to Remember

> **Any Expo API that gives you a `/cache/` URI (DocumentPicker, ImagePicker, Camera, etc.) should be treated as ephemeral.** Always copy to `documentDirectory` before persisting the URI.

## Verification

- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- New attachments will be stored in `/data/user/0/<app-id>/files/exam-attachments/`
- Old broken attachments from before the fix will show a graceful error state instead of crashing
