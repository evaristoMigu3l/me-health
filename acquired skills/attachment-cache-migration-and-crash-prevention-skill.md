# Attachment Cache → Persistent Migration + Crash Prevention Fix

## Problem

Even after implementing persistent storage for **new** exam attachments (via `copyToPersistentStorage()` in `add-investigation.tsx`), the app was **still crashing** when users tapped "Open" on exam attachments. The error:

```
Error: Call to function 'ExponentFileSystem.getContentUriSync' has been rejected.
Caused by: java.io.IOException: Directory for
'/data/user/0/com.evaristo.meandhealth/cache/DocumentPicker/2de5ab8-b5bd-401f-b0f3-8ce807130b37.jpg'
doesn't exist. Please make sure directory
'/data/user/0/com.evaristo.meandhealth/cache/DocumentPicker' exists before calling downloadAsync.
```

## Root Cause Analysis (3 layers deep)

### Layer 1: Old data not migrated
The persistent storage fix (`copyToPersistentStorage()`) was applied to the **picker flow**, meaning only **newly attached** files get copied to `documentDirectory`. But all **pre-existing attachments** in the Zustand store still held volatile `/cache/DocumentPicker/` URIs. Android cleared those cache directories, leaving dead URIs in the persisted state.

### Layer 2: `handleOpenFile` had no pre-check
The `handleOpenFile` function in `exam-details.tsx` called `FileSystem.getContentUriAsync(uri)` **without first checking if the file exists**. This native method crashes with a Java `IOException` when the file's parent directory doesn't exist — it doesn't return a nice error, it throws an unrecoverable native exception.

### Layer 3: No fallback on crash
The `catch` block in `handleOpenFile` was showing the raw Java exception as an `Alert.alert()` message (ugly and unhelpful). The sharing fallback was commented out.

## Solution Applied (3 fixes)

### Fix 1: One-time data migration (`utils/migrateAttachments.ts`)

Created a migration utility that:
1. Reads the raw `health-storage` from AsyncStorage
2. Scans every investigation's `attachments[]` array for cache-based URIs (containing `/cache/`)
3. **If the file still exists**: copies it to `documentDirectory/exam-attachments/` and updates the URI
4. **If the file is already gone**: removes the dead URI from the array
5. Writes the cleaned data back to AsyncStorage
6. Sets a `attachment-migration-v1` flag so it only runs once

```typescript
// Called from _layout.tsx on app launch
import { migrateAttachmentsToPersistentStorage } from '../utils/migrateAttachments';

useEffect(() => {
    migrateAttachmentsToPersistentStorage();
}, []);
```

### Fix 2: Pre-check in `handleOpenFile` (`exam-details.tsx`)

Added a file existence check **before** calling `getContentUriAsync`:

```typescript
if (!uri.startsWith('content://')) {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
        Alert.alert(t('file_unavailable'), t('file_unavailable_desc'));
        return;
    }
}
```

This prevents the Java `IOException` crash entirely.

### Fix 3: Re-enabled sharing fallback + friendly error messages

- Re-enabled the `expo-sharing` fallback in the `catch` block
- Changed raw Java exception display to localized "File Unavailable" message
- Added i18n keys: `file_unavailable`, `file_unavailable_desc` (English + Portuguese)

## Files Modified

| File | Change |
|------|--------|
| `utils/migrateAttachments.ts` | **[NEW]** One-time migration utility |
| `app/_layout.tsx` | Added migration import + `useEffect` call |
| `app/exam-details.tsx` | Pre-check in `handleOpenFile`, sharing fallback, friendly errors |
| `utils/i18n.ts` | Added `file_unavailable`, `file_unavailable_desc`, `open`, `linked_appointment`, `edit_exam`, `exam_not_found`, `exam_not_found_desc`, `linked`, `appointment`, `no_diagnoses_recorded` |

## Key Lesson

> **A code fix to the picker flow is not enough.** You must also **migrate existing persisted data** that was saved before the fix. Otherwise users with old data will keep hitting the same crash even after updating.

> **Never call `FileSystem.getContentUriAsync()` without first verifying the file exists.** This API throws a native Java exception (not a JS error) when the parent directory is missing, making it impossible to catch cleanly in some cases.

## How the Migration Works (step by step)

```
App Launch → _layout.tsx useEffect
  ↓
migrateAttachmentsToPersistentStorage()
  ↓
Check MIGRATION_KEY in AsyncStorage → if 'done', skip
  ↓
Read raw 'health-storage' JSON from AsyncStorage
  ↓
For each investigation.attachments[]:
  ├── URI contains '/cache/'?
  │   ├── File still exists → copy to documentDirectory, update URI ✅
  │   └── File gone → drop dead URI 🗑️
  └── URI is persistent/content:// → keep as-is ✅
  ↓
Write updated state back to AsyncStorage
  ↓
Set MIGRATION_KEY = 'done'
```

## Verification

- TypeScript compiles with zero errors (`tsc --noEmit`)
- Old cache-based attachments will be migrated on first app launch after update
- Dead URIs will be silently cleaned up instead of causing crashes
- The AttachmentCard component in exam-details.tsx still shows graceful error states for any edge cases
