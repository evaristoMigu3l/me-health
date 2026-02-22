# 🔔 Expo Notifications with Custom Sounds — Full Implementation Skill

> **Skill Acquired:** February 22, 2026  
> **Project:** Me & Health (React Native + Expo SDK 54)  
> **Status:** ✅ Fully Working — Medications, Appointments, and Custom Sound Picker

---

## 📋 Table of Contents

1. [Overview — What We Built](#overview)
2. [Architecture Decisions](#architecture)
3. [Dependencies](#dependencies)
4. [Step 1: Configure `app.json`](#step-1-appjson)
5. [Step 2: Add Sound Files to the Project](#step-2-sound-files)
6. [Step 3: Configure Metro Bundler](#step-3-metro)
7. [Step 4: State Management — Persisting Sound Choice](#step-4-state)
8. [Step 5: Notification Channels (Android)](#step-5-channels)
9. [Step 6: Scheduling Notifications with Custom Sound](#step-6-scheduling)
10. [Step 7: Settings UI — Sound Picker with Live Preview](#step-7-ui)
11. [Step 8: Test Notification Button](#step-8-test)
12. [Errors Encountered and How We Fixed Them](#errors)
13. [Key Gotchas & Lessons Learned](#gotchas)
14. [Final File Structure](#file-structure)
15. [Quick Reference Cheatsheet](#cheatsheet)

---

## 1. Overview — What We Built {#overview}

A fully working notification system in Expo SDK 54 that:
- Schedules **daily medication reminders** at user-set times
- Schedules **appointment reminders** at relative times (1hr before, 30min before, etc.)
- Lets the user **pick a custom alert sound** from a Settings screen
- Provides **live in-app sound previews** before selecting
- Sound choices persist across app restarts via **Zustand + AsyncStorage**
- Custom sounds are **bundled into the native APK** and used by Android Notification Channels
- Users can add their **own MP3 songs** from anywhere on the computer — they get bundled in
- The test notification button **plays the selected sound instantly** (useful for Expo Go debugging)

---

## 2. Architecture Decisions {#architecture}

### Why Custom Sounds Must Be in the APK (Critical Truth)
This tripped us up at first. The user wanted to pick sounds from their phone's file system. **This is impossible for background notifications.** Here's why:

When a notification fires while your app is closed, the notification is delivered 100% by the **operating system (Android/iOS)**, not by your JavaScript code. The OS is sandboxed — it will NOT read files from your phone's gallery or file system for security reasons. It will ONLY play sounds that were **compiled into the `.apk` binary at build time**.

This means every custom sound MUST be:
1. Placed in `assets/sounds/` on the developer's machine
2. Listed in `app.json` under `expo-notifications` plugin sounds array
3. Bundled before running `eas build`

### Why `.ogg` format for Android
- `.wav` files are huge (uncompressed), 200-300KB each
- `.ogg` is the native Android audio format — small, fast, reliable
- `.mp3` also works fine and is what users naturally have

### In-App Preview vs Notification Sound
There are TWO separate sound systems:
1. **In-app preview** (when user taps the ▶ play button) — handled by `expo-audio`
2. **Background notification sound** (when OS delivers notification) — handled by Android Notification Channel configuration + the sound file bundled in APK

These are completely separate. The in-app preview works in Expo Go. The notification channel sound only works in a real development build / APK.

---

## 3. Dependencies {#dependencies}

```bash
# Core notification engine
npx expo install expo-notifications

# In-app audio preview playback (NEW — replaces deprecated expo-av)
npm install expo-audio --legacy-peer-deps

# State persistence
npm install zustand
npm install @react-native-async-storage/async-storage
```

### ⚠️ Critical Deprecation Warning
`expo-av` is deprecated as of SDK 53/54. **Do NOT use it for new projects.**

```
WARN [expo-av]: Expo AV has been deprecated and will be removed in SDK 54.
Use the `expo-audio` and `expo-video` packages instead.
```

The correct replacement for audio playback is:
```ts
import { useAudioPlayer } from 'expo-audio';
```

### ⚠️ Expo Go Limitation (Remote Push Only)
```
ERROR expo-notifications: Android Push notifications (remote notifications)
functionality provided by expo-notifications was removed from Expo Go with 
the release of SDK 53. Use a development build instead.
```

This error is about **remote push notifications** (from a server). It does NOT affect **local/scheduled notifications**, which work fine in Expo Go. Don't let this error scare you — local scheduled notifications still work.

---

## 4. Step 1: Configure `app.json` {#step-1-appjson}

You must register your sound files with the `expo-notifications` plugin. This tells EAS Build to copy them into the native Android `res/raw/` folder during the build.

```json
{
  "expo": {
    "name": "YourApp",
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "sounds": [
            "./assets/sounds/bell.ogg",
            "./assets/sounds/chime.ogg",
            "./assets/sounds/digital.ogg",
            "./assets/sounds/hurt_again.mp3",
            "./assets/sounds/your_power.mp3"
          ]
        }
      ]
    ]
  }
}
```

**Important:** The path must be relative to the project root. These files must actually exist on disk when you run `eas build`.

---

## 5. Step 2: Add Sound Files to the Project {#step-2-sound-files}

### Folder structure
```
your-project/
  assets/
    sounds/
      bell.ogg
      chime.ogg
      digital.ogg
      hurt_again.mp3       ← user's own MP3
      your_power.mp3       ← user's own MP3
```

### Getting free `.ogg` sounds (Google Alarms CDN)
```bash
# These are reliable Google alarm sounds — real audio files
curl -L "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" -o assets/sounds/bell.ogg
curl -L "https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg" -o assets/sounds/chime.ogg
curl -L "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" -o assets/sounds/digital.ogg
```

### Adding user's own MP3s
If a user has MP3 files anywhere on their computer, just copy them in:
```bash
cp "/path/to/their/song.mp3" assets/sounds/clean_name.mp3
```

**Always rename to clean filenames** — no spaces, no special characters. React Native's `require()` cannot handle filenames with spaces or parentheses.

❌ `Julia Michaels - Hurt Again (Lyrics).mp3` — breaks `require()`
✅ `hurt_again.mp3` — works perfectly

### ⚠️ Error We Hit: GitHub .wav files were actually HTML redirects

We initially tried to download `.wav` files from GitHub raw URLs. They appeared to download (correct file size shown), but were actually HTML redirect pages saved with a `.wav` extension. This caused:

```
ERROR Failed to play sound [Error: a8.W: None of the available extractors 
(b, c, d, g, k, b, A, d, H, e, h, b, e, f, b, a) could read the stream.]
```

**Fix:** Use direct CDN URLs (like Google's) that serve actual binary audio files, not GitHub raw URLs that may redirect.

---

## 6. Step 3: Configure Metro Bundler {#step-3-metro}

By default, Metro (the React Native bundler) does NOT know how to handle `.ogg` or `.mp3` files. You'll get this error:

```
Android Bundling failed
Unable to resolve "../assets/sounds/bell.ogg" from "app/settings.tsx"
```

**Fix:** Create or update `metro.config.js` to explicitly register these extensions as asset types:

```bash
# Generate metro.config.js if it doesn't exist
npx expo customize metro.config.js
```

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tell Metro to treat .ogg and .mp3 as bundleable asset files
config.resolver.assetExts.push('ogg', 'mp3');

module.exports = config;
```

**Always restart Expo with `--clear` after changing metro.config.js:**
```bash
npx expo start --clear
```

---

## 7. Step 4: State Management — Persisting Sound Choice {#step-4-state}

We extend the Zustand theme store to also persist which sound the user selected. This way the choice survives app restarts.

```ts
// stores/useThemeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

// Add every sound filename here — must match filename exactly
export type NotificationSound = 
  | 'default' 
  | 'bell.ogg' 
  | 'chime.ogg' 
  | 'digital.ogg' 
  | 'hurt_again.mp3' 
  | 'your_power.mp3';

interface ThemeState {
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;
    notificationSound: NotificationSound;
    setNotificationSound: (sound: NotificationSound) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            themePreference: 'system',
            setThemePreference: (preference) => set({ themePreference: preference }),
            notificationSound: 'default',
            setNotificationSound: (sound) => set({ notificationSound: sound }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
```

**Important:** Using `useThemeStore.getState()` (not the hook) inside utility functions because hooks cannot be called outside React components:

```ts
// In non-component code (utils/notifications.ts):
const { notificationSound } = useThemeStore.getState(); // ✅ correct
const { notificationSound } = useThemeStore();          // ❌ can't use hook here
```

---

## 8. Step 5: Notification Channels (Android) {#step-5-channels}

Android uses **Notification Channels** (introduced in Android 8.0 Oreo). A channel is like a profile for notifications — it controls sound, importance, vibration, etc.

**Critical rule:** Once a channel is created with a sound, Android locks that sound permanently. You cannot change it later without deleting and recreating the channel. This is why we create a **new channel per sound**.

```ts
// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useThemeStore, NotificationSound } from '../stores/useThemeStore';

// Helper: converts our sound state to the notification payload value
function getSoundPayload(soundState: NotificationSound): boolean | string {
    // 'default' uses the OS default sound (true = use default)
    // anything else is the filename Android will look up in res/raw/
    return soundState === 'default' ? true : soundState;
}

export async function requestNotificationPermissions(): Promise<boolean> {
    const { notificationSound } = useThemeStore.getState();

    if (Platform.OS === 'android') {
        // Create a unique channel per sound so Android doesn't lock us to old sound
        const channelId = notificationSound === 'default' 
            ? 'default' 
            : `custom-${notificationSound}`;
        
        await Notifications.setNotificationChannelAsync(channelId, {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
            // Pass the filename (without path) — Android finds it in res/raw/
            sound: notificationSound === 'default' ? undefined : notificationSound,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}
```

---

## 9. Step 6: Scheduling Notifications with Custom Sound {#step-6-scheduling}

Full implementation of medication and appointment scheduling:

```ts
// utils/notifications.ts (continued)

// Set this at the top of notifications.ts globally — controls behavior in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function scheduleMedicationReminder(medication: Medication) {
    // Always cancel existing to avoid duplicates (up to 10 doses per day)
    for (let i = 0; i < 10; i++) {
        await Notifications.cancelScheduledNotificationAsync(`med-${medication.id}-${i}`);
    }

    if (medication.remindersEnabled === false) return;

    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) return;

    const { notificationSound } = useThemeStore.getState();
    const androidChannelId = notificationSound === 'default' ? 'default' : `custom-${notificationSound}`;
    const soundPayload = getSoundPayload(notificationSound);

    try {
        if (!medication.schedule || medication.schedule.length === 0) return;

        for (let i = 0; i < medication.schedule.length; i++) {
            const entry = medication.schedule[i];
            const [hours, minutes] = entry.time.split(':').map(Number);

            if (medication.frequency === 'Daily') {
                await Notifications.scheduleNotificationAsync({
                    identifier: `med-${medication.id}-${i}`,
                    content: {
                        title: '💊 Medication Reminder',
                        body: `Time to take your ${medication.name} (${entry.dosage} ${medication.dosageUnit})`,
                        sound: soundPayload,
                        // @ts-ignore — channelId is Android-only, TS doesn't know about it
                        channelId: androidChannelId,
                        data: { type: 'medication', id: medication.id },
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                        hour: hours,
                        minute: minutes,
                    },
                });
            } else {
                // One-time notification for non-daily medications
                const triggerDate = new Date(medication.startDate);
                triggerDate.setHours(hours, minutes, 0, 0);

                if (triggerDate.getTime() > Date.now()) {
                    await Notifications.scheduleNotificationAsync({
                        identifier: `med-${medication.id}-${i}`,
                        content: {
                            title: '💊 Medication Reminder',
                            body: `Time to take your ${medication.name}`,
                            sound: soundPayload,
                            // @ts-ignore
                            channelId: androidChannelId,
                            data: { type: 'medication', id: medication.id },
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: triggerDate,
                        },
                    });
                }
            }
        }
    } catch (error) {
        console.log('Error scheduling notification', error);
    }
}

export async function scheduleAppointmentReminder(appointment: Appointment) {
    await Notifications.cancelScheduledNotificationAsync(`appt-${appointment.id}`);

    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) return;

    const { notificationSound } = useThemeStore.getState();
    const androidChannelId = notificationSound === 'default' ? 'default' : `custom-${notificationSound}`;
    const soundPayload = getSoundPayload(notificationSound);

    try {
        const appointmentDate = new Date(appointment.dateTime);
        const reminderTime = new Date(appointmentDate.getTime());

        let label = 'Upcoming';
        if (appointment.reminder) {
            if (appointment.reminder === 'None') return;

            // Try ISO date string first (custom date/time picker)
            const parsed = new Date(appointment.reminder);
            if (!isNaN(parsed.getTime())) {
                reminderTime.setTime(parsed.getTime());
                label = 'Scheduled';
            } else if (appointment.reminder.includes('1 hour')) {
                reminderTime.setHours(reminderTime.getHours() - 1);
                label = 'In 1 hour';
            } else if (appointment.reminder.includes('30 min')) {
                reminderTime.setMinutes(reminderTime.getMinutes() - 30);
                label = 'In 30 minutes';
            } else if (appointment.reminder.includes('1 day')) {
                reminderTime.setDate(reminderTime.getDate() - 1);
                label = 'Tomorrow';
            }
        }

        if (reminderTime.getTime() > Date.now()) {
            await Notifications.scheduleNotificationAsync({
                identifier: `appt-${appointment.id}`,
                content: {
                    title: `📅 Appointment Reminder: ${label}`,
                    body: `You have an appointment with ${appointment.doctorName} at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    sound: soundPayload,
                    // @ts-ignore
                    channelId: androidChannelId,
                    data: { type: 'appointment', id: appointment.id },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminderTime,
                },
            });
        }
    } catch (error) {
        console.log('Error scheduling appointment notification', error);
    }
}

export async function cancelNotification(id: string, prefix: 'med' | 'appt') {
    if (prefix === 'med') {
        for (let i = 0; i < 10; i++) {
            await Notifications.cancelScheduledNotificationAsync(`med-${id}-${i}`);
        }
    } else {
        await Notifications.cancelScheduledNotificationAsync(`appt-${id}`);
    }
}

export async function sendTestNotification() {
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
        alert('Notification permissions are required.');
        return;
    }

    const { notificationSound } = useThemeStore.getState();
    const androidChannelId = notificationSound === 'default' ? 'default' : `custom-${notificationSound}`;
    const soundPayload = getSoundPayload(notificationSound);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🔔 Test Notification',
            body: 'Notifications are working! This uses your selected custom sound.',
            sound: soundPayload,
            // @ts-ignore
            channelId: androidChannelId,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 2,
        },
    });
}
```

---

## 10. Step 7: Settings UI — Sound Picker with Live Preview {#step-7-ui}

The full Settings screen with a beautiful bottom-sheet modal for selecting sounds, with a dedicated ▶ play button per row:

```tsx
// app/settings.tsx (relevant section)
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useThemeStore, NotificationSound } from '../stores/useThemeStore';
import { useAudioPlayer } from 'expo-audio';  // ← NOT expo-av
import { sendTestNotification } from '../utils/notifications';

export default function SettingsScreen() {
    const { notificationSound, setNotificationSound } = useThemeStore();

    const [soundModalVisible, setSoundModalVisible] = useState(false);
    const [previewingSound, setPreviewingSound] = useState<string | null>(null);

    // Each entry: label shown in UI, value stored in state, file for audio preview
    const sounds: { label: string, value: NotificationSound, file?: any }[] = [
        { label: 'Default OS Sound', value: 'default' },
        { label: '🔔 Bell', value: 'bell.ogg', file: require('../assets/sounds/bell.ogg') },
        { label: '🎵 Chime', value: 'chime.ogg', file: require('../assets/sounds/chime.ogg') },
        { label: '📳 Digital', value: 'digital.ogg', file: require('../assets/sounds/digital.ogg') },
        { label: '💔 Hurt Again – Julia Michaels', value: 'hurt_again.mp3', file: require('../assets/sounds/hurt_again.mp3') },
        { label: '⚡ Your Power – Billie Eilish', value: 'your_power.mp3', file: require('../assets/sounds/your_power.mp3') },
    ];

    // useAudioPlayer is a hook — always called at component top level
    // Pass null as initial source — we'll replace dynamically when user taps play
    const audioPlayer = useAudioPlayer(null);

    async function playSound(soundObj: { value: string, file?: any }) {
        if (!soundObj.file) return;
        try {
            setPreviewingSound(soundObj.value);
            audioPlayer.replace(soundObj.file);  // swap to the new file
            audioPlayer.play();                  // play it immediately
            setTimeout(() => setPreviewingSound(null), 3000); // reset icon after 3s
        } catch (error) {
            console.error('Failed to play sound preview', error);
            setPreviewingSound(null);
        }
    }

    async function handleTestNotification() {
        // Play sound immediately in-app (for Expo Go debugging)
        const selected = sounds.find(s => s.value === notificationSound);
        if (selected?.file) {
            playSound(selected);
        }
        // Also schedule the system notification (2 second delay)
        await sendTestNotification();
    }

    return (
        <>
            {/* ... rest of settings UI ... */}

            {/* Alert Sound row */}
            <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setSoundModalVisible(true)}
            >
                <View style={styles.settingInfo}>
                    <Ionicons name="musical-notes-outline" size={22} />
                    <Text style={styles.settingText}>Alert Sound</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, marginRight: 8 }}>
                        {sounds.find(s => s.value === notificationSound)?.label || 'Default'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} />
                </View>
            </TouchableOpacity>

            {/* Test Notification row */}
            <View style={styles.settingRow}>
                <Text style={styles.settingText}>Test Notifications</Text>
                <TouchableOpacity onPress={handleTestNotification} style={styles.testButton}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Send Test 🔔</Text>
                </TouchableOpacity>
            </View>

            {/* Sound Picker Modal (bottom sheet) */}
            <Modal visible={soundModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Alert Sound</Text>
                            <TouchableOpacity onPress={() => setSoundModalVisible(false)}>
                                <Ionicons name="close" size={24} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={sounds}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.soundRow}
                                    onPress={() => setNotificationSound(item.value)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        {/* Radio button style selection indicator */}
                                        {notificationSound === item.value
                                            ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                                            : <Ionicons name="radio-button-off" size={22} color={colors.border} />
                                        }
                                        <Text style={[
                                            styles.soundText,
                                            notificationSound === item.value && { color: colors.primary, fontWeight: '700' }
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </View>

                                    {/* Play preview button — separate from selection */}
                                    {item.file && (
                                        <TouchableOpacity
                                            style={[styles.playBtn, {
                                                backgroundColor: previewingSound === item.value 
                                                    ? colors.primary 
                                                    : colors.background
                                            }]}
                                            onPress={() => playSound(item)}
                                        >
                                            <Ionicons
                                                name={previewingSound === item.value ? 'pause' : 'play'}
                                                size={16}
                                                color={previewingSound === item.value ? '#fff' : colors.primary}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}
```

---

## 11. Step 8: Test Notification Button {#step-8-test}

The two-in-one test button is crucial for debugging in Expo Go:

```tsx
async function handleTestNotification() {
    // 1. Play the selected sound RIGHT NOW in the app (instant feedback, works in Expo Go)
    const selected = sounds.find(s => s.value === notificationSound);
    if (selected?.file) {
        playSound(selected);
    }
    // 2. Schedule a system notification 2 seconds from now
    await sendTestNotification();
}
```

This design is smart because:
- In Expo Go, you can't test background notification delivery sound easily
- But you CAN hear the in-app preview sound immediately
- This lets you verify audio files are valid/playable before building the APK

---

## 12. Errors Encountered and How We Fixed Them {#errors}

### Error 1: `None of the available extractors could read the stream`
```
ERROR Failed to play sound [Error: a8.W: None of the available extractors 
(b, c, d, g, k, b, A, d, H, e, h, b, e, f, b, a) could read the stream.]
```

**Root cause:** The `.wav` files downloaded from GitHub raw URLs were actually HTML redirect pages (the CDN was returning a redirect page saved as `.wav`).

**Fix:** Use direct CDN URLs that serve real binary audio. Google's sounds CDN works reliably:
```bash
curl -L "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" -o assets/sounds/bell.ogg
```

---

### Error 2: `Unable to resolve "../assets/sounds/bell.ogg"`
```
Android Bundling failed
Unable to resolve "../assets/sounds/bell.ogg" from "app/settings.tsx"
```

**Root cause:** Metro bundler doesn't know `.ogg` is an asset type by default.

**Fix:** Add to `metro.config.js`:
```js
config.resolver.assetExts.push('ogg', 'mp3');
```

Then restart with `npx expo start --clear`.

---

### Error 3: `expo-av` deprecated crash
```
WARN [expo-av]: Expo AV has been deprecated and will be removed in SDK 54.
Use the `expo-audio` and `expo-video` packages.
```

**Fix:** Replace `expo-av` with `expo-audio`:
```bash
npm install expo-audio --legacy-peer-deps
```

```ts
// OLD (broken):
import { Audio } from 'expo-av';
const { sound } = await Audio.Sound.createAsync(file);
await sound.playAsync();

// NEW (correct):
import { useAudioPlayer } from 'expo-audio';
const audioPlayer = useAudioPlayer(null);
audioPlayer.replace(file);
audioPlayer.play();
```

---

### Error 4: `Cannot find module 'expo-audio'` after install
```
Cannot find module 'expo-audio' or its corresponding type declarations.
```

**Root cause:** `npx expo install expo-audio` failed silently due to peer dependency conflict.

**Fix:** Use `--legacy-peer-deps`:
```bash
npm install expo-audio --legacy-peer-deps
```

Verify it installed:
```bash
ls node_modules/expo-audio/build/index.d.ts
```

---

### Error 5: Duplicate import causing `sendTestNotification` TS error
```
Duplicate identifier 'sendTestNotification'. (severity: error)
```

**Root cause:** During editing, the same import was accidentally added twice to the file.

**Fix:** Remove one of the duplicate lines. Only one import should exist.

---

### Error 6: `setSoundModalVisible` not found (variable accidentally deleted)
```
Cannot find name 'setSoundModalVisible'. (severity: error)
```

**Root cause:** When refactoring, the `const [soundModalVisible, setSoundModalVisible] = useState(false);` line got deleted accidentally.

**Fix:** Restore the state variable declaration at the top of the component.

---

### Error 7: `require()` fails on filenames with spaces
```
Unable to resolve "../assets/sounds/Billie Eilish - Your Power (Official Music Video).mp3"
```

**Root cause:** React Native's Metro bundler cannot resolve filenames with spaces, parentheses, or special characters in `require()` calls at bundle time.

**Fix:** Always copy/rename files to clean names before adding them:
```bash
cp "Billie Eilish - Your Power (Official Music Video).mp3" assets/sounds/your_power.mp3
```

---

### Error 8: Port conflict when restarting Expo
```
› Port 8081 is running this app in another window
? Use port 8082 instead? (Y/n)
```

**Fix:** Kill the existing process first:
```bash
kill -9 $(lsof -t -i:8081)
npx expo start --clear
```

---

## 13. Key Gotchas & Lessons Learned {#gotchas}

### 🔴 Android Notification Channel Sound Locking
Once an Android channel is created with a specific sound, **you cannot change the sound without creating a new channel**. If you update the sound and call `setNotificationChannelAsync` with the same `channelId`, Android silently ignores the sound change.

**Solution:** Use the sound filename as part of the channel ID:
```ts
const channelId = `custom-${notificationSound}`; // e.g., "custom-hurt_again.mp3"
```

This way, each sound automatically gets its own channel, and switching sounds creates a fresh channel with the new audio.

### 🔴 Sound must be bundled BEFORE `eas build`, not after
You cannot dynamically add sounds after the APK is built. Plan your sounds ahead of time, or rebuild the APK when adding new ones.

### 🔴 `sound: true` vs `sound: 'filename.ogg'`
```ts
// 'true' = use whatever the Android channel's default sound is
// 'filename.ogg' = specifically request this sound file from res/raw/
content: {
    sound: true,           // use channel default
    sound: 'bell.ogg',     // use specific file
}
```

### 🔴 The `// @ts-ignore` comment is needed for `channelId`
The `channelId` field on `NotificationContentInput` is Android-only and TypeScript doesn't know about it. Always suppress the error:
```ts
// @ts-ignore
channelId: androidChannelId,
```

### 🟡 `useThemeStore.getState()` vs `useThemeStore()`
- Inside React components: use `useThemeStore()` (hook)
- Inside utility functions/outside components: use `useThemeStore.getState()` (static)

### 🟡 Always `--clear` when changing Metro config or adding new asset types
```bash
npx expo start --clear
```
Without `--clear`, Metro may use cached bundles and not pick up your new asset extensions.

### 🟡 The `// turbo` annotation trick for automated workflows
If something needs auto-running in workflows, add `// turbo` above the step. Very useful for standard build commands.

### 🟢 In-app preview is completely separate from notification sound
The play preview in the sound picker uses `expo-audio` in JS. The actual notification sound is delivered by the OS from the bundled file. Don't confuse them — they're two different systems that happen to use the same filename.

### 🟢 Test your sounds in Expo Go with the in-app play button
Even though background notification sound won't play in Expo Go, you CAN verify the file is valid and playable by tapping the ▶ button in the sound picker. If it plays there, it will play in a real build.

---

## 14. Final File Structure {#file-structure}

```
project/
├── app.json                          ← expo-notifications plugin with sounds[]
├── metro.config.js                   ← assetExts.push('ogg', 'mp3')
├── assets/
│   └── sounds/
│       ├── bell.ogg
│       ├── chime.ogg
│       ├── digital.ogg
│       ├── hurt_again.mp3            ← user's own mp3
│       └── your_power.mp3            ← user's own mp3
├── stores/
│   └── useThemeStore.ts              ← NotificationSound type + persistent state
├── utils/
│   └── notifications.ts              ← scheduling logic with dynamic sound/channel
└── app/
    └── settings.tsx                  ← UI picker + live preview with expo-audio
```

---

## 15. Quick Reference Cheatsheet {#cheatsheet}

### When adding a new sound file:
1. Copy to `assets/sounds/yourfile.mp3` (no spaces in filename!)
2. Add to `app.json` sounds array
3. Add to `NotificationSound` type in `useThemeStore.ts`
4. Add entry to `sounds[]` array in `settings.tsx` with `require('../assets/sounds/yourfile.mp3')`
5. Run `npx expo start --clear` to re-bundle

### Key imports:
```ts
// Notifications
import * as Notifications from 'expo-notifications';

// Audio preview (NOT expo-av)
import { useAudioPlayer } from 'expo-audio';

// State
import { useThemeStore, NotificationSound } from '../stores/useThemeStore';
```

### Key commands:
```bash
# Install
npm install expo-audio --legacy-peer-deps
npx expo install expo-notifications

# Start fresh
npx expo start --clear

# Kill stuck port
kill -9 $(lsof -t -i:8081)

# Check file types
file assets/sounds/*

# Verify install
ls node_modules/expo-audio/build/index.d.ts
```

### Sound payload logic:
```ts
function getSoundPayload(soundState: NotificationSound): boolean | string {
    return soundState === 'default' ? true : soundState;
}
```

### Channel ID logic (prevents Android locking):
```ts
const channelId = notificationSound === 'default' 
    ? 'default' 
    : `custom-${notificationSound}`;
```

---

*Documented by Antigravity AI — February 22, 2026*  
*Total debugging sessions: ~8 | Errors resolved: 8 | Final result: ✅ Working*
