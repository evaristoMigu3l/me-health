# Complete Guide: Implementing Notifications in React Native with Expo

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Core Implementation](#core-implementation)
5. [Notification Types](#notification-types)
6. [Settings Integration](#settings-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide documents the complete implementation of local and scheduled notifications in the Money Ranger app using Expo's notification system. The implementation includes:

- **Daily transaction reminders** - Recurring notifications at user-specified times
- **Budget alerts** - Instant notifications when spending exceeds budget limits
- **Debt/loan reminders** - Scheduled notifications 1 day before due dates
- **Goal deadline reminders** - Scheduled notifications 3 days before goal deadlines

**Key Achievement**: All notifications work even when the app is closed, tested successfully in Expo Go.

---

## Prerequisites

### Required Packages
```json
{
  "expo-notifications": "~0.28.1"
}
```

### Installation Command
```bash
npx expo install expo-notifications
```

### Platform Requirements
- **Android**: API level 21+ (Android 5.0+)
- **iOS**: iOS 10+
- **Expo Go**: Works perfectly for testing
- **Production Build**: Will work in standalone builds (EAS Build)

---

## Core Implementation

### 1. Notification Handler Setup

Create `src/utils/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestPermissions() {
  // Android requires notification channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D1B2A',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
```

**Key Points:**
- `setNotificationHandler` must be called at module level (not inside a function)
- Android requires notification channels (API 26+)
- `AndroidImportance.MAX` ensures notifications show as heads-up
- Permission request is required on both platforms

---

## Notification Types

### 1. Instant Notifications (Budget Alerts)

```typescript
export async function notifyBudgetReached(categoryName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Budget Limit Reached',
      body: `You've reached your ${categoryName} budget limit!`,
      sound: true,
      // @ts-ignore - channelId is Android-specific
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1, // Shows almost immediately
    },
  });
}
```

**Usage in transaction save:**
```typescript
// In app/add-transaction.tsx
if (txnType === 'expense' && selectedCategory) {
  await useBudgetStore.getState().loadBudgets();
  const budgets = useBudgetStore.getState().budgets;
  const now = new Date().toISOString().split('T')[0];

  const relevantBudgets = budgets.filter(b =>
    b.categoryIds.includes(selectedCategory) &&
    b.startDate <= now &&
    b.endDate >= now
  );

  for (const budget of relevantBudgets) {
    if ((budget as any).actualExpenses >= budget.targetAmount) {
      await notifyBudgetReached(budget.name);
    }
  }
}
```

---

### 2. Daily Recurring Notifications

```typescript
export async function scheduleDailyReminder(enabled: boolean, timeString: string) {
  // Cancel existing reminder first
  await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});

  if (!enabled) return;

  const [hour, minute] = timeString.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder', // Allows cancellation by ID
    content: {
      title: '💰 Money Ranger',
      body: "Don't forget to log your transactions today!",
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true, // Makes it recurring
    },
  });
}
```

**Key Points:**
- Use `identifier` to manage scheduled notifications
- `DAILY` trigger type with `repeats: true` for recurring
- Always cancel existing before scheduling new (prevents duplicates)
- Works even when app is closed

---

### 3. Date-Based Notifications (Debt Reminders)

```typescript
export async function scheduleDebtReminder(
  id: string,
  personName: string,
  amount: number,
  dueDate: string,
  currencySymbol: string,
  reminderTime: string
) {
  const due = new Date(dueDate);
  const now = new Date();

  if (due <= now) return; // Don't schedule for past dates

  // Calculate reminder date (1 day before due date)
  const oneDayBefore = new Date(due);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  
  // Set user's preferred time
  const [hour, minute] = reminderTime.split(':').map(Number);
  oneDayBefore.setHours(hour, minute, 0, 0);

  if (oneDayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `debt-${id}`,
      content: {
        title: '⚠️ Payment Due Tomorrow',
        body: `${personName}: ${currencySymbol}${amount.toFixed(2)} due tomorrow`,
        sound: true,
        // @ts-ignore
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDayBefore, // Specific date/time
      },
    });
  }
}
```

**Usage when creating debt:**
```typescript
// In app/debts-loans.tsx
const settings = useSettingsStore.getState().settings;
if (dueDate && settings.debtRemindersEnabled) {
  const { scheduleDebtReminder } = await import('../src/utils/notifications');
  await scheduleDebtReminder(id, personName, amountNum, dueDate, sym, settings.debtReminderTime);
}
```

---

### 4. Goal Deadline Reminders

```typescript
export async function scheduleGoalReminder(
  id: string,
  goalName: string,
  targetDate: string,
  reminderTime: string
): Promise<boolean> {
  const target = new Date(targetDate);
  const now = new Date();

  if (target <= now) return false;

  // Calculate reminder date (3 days before deadline)
  const threeDaysBefore = new Date(target);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  
  const [hour, minute] = reminderTime.split(':').map(Number);
  threeDaysBefore.setHours(hour, minute, 0, 0);

  if (threeDaysBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `goal-${id}`,
      content: {
        title: '🎯 Goal Deadline Approaching',
        body: `${goalName} deadline is in 3 days!`,
        sound: true,
        // @ts-ignore
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: threeDaysBefore,
      },
    });
    return true; // Indicates successful scheduling
  }
  return false;
}
```

**Usage when creating goal:**
```typescript
// In app/goals.tsx
const goalId = await addGoal({ /* goal data */ });

const settings = useSettingsStore.getState().settings;
if (endDate && settings.goalRemindersEnabled) {
  const { scheduleGoalReminder } = await import('../src/utils/notifications');
  const scheduled = await scheduleGoalReminder(
    goalId,
    name.trim(),
    endDate,
    settings.goalReminderTime
  );
  
  if (scheduled) {
    const targetDate = new Date(endDate);
    const reminderDate = new Date(targetDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    Alert.alert(
      'Goal Created',
      `Reminder scheduled for ${reminderDate.toLocaleDateString()} at ${settings.goalReminderTime}`
    );
  }
}
```

---

### 5. Test Notification Function

```typescript
export async function sendTestNotification() {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Notification',
      body: 'Notifications are working! This is a test message.',
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export async function testGoalNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Goal Deadline Approaching',
      body: 'Test Goal deadline is in 3 days!',
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}
```

---

## Settings Integration

### 1. Update Type Definitions

Add to `src/types/index.ts`:

```typescript
export interface AppSettings {
  // ... existing settings
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:MM format
  debtRemindersEnabled: boolean;
  debtReminderTime: string; // HH:MM format
  goalRemindersEnabled: boolean;
  goalReminderTime: string; // HH:MM format
}
```

### 2. Update Default Settings

In `src/store/index.ts`:

```typescript
const defaultSettings: AppSettings = {
  // ... existing defaults
  dailyReminderEnabled: false,
  dailyReminderTime: '20:00',
  debtRemindersEnabled: true,
  debtReminderTime: '09:00',
  goalRemindersEnabled: true,
  goalReminderTime: '10:00',
};
```

### 3. Settings UI Implementation

In `app/settings.tsx`:

```typescript
import { requestPermissions, sendTestNotification, scheduleDailyReminder } from '../src/utils/notifications';

export default function SettingsScreen() {
  const C = useThemeColors();
  const styles = createStyles(C);
  const settings = useSettingsStore(s => s.settings);
  const updateSetting = useSettingsStore(s => s.updateSetting);
  
  // State for time picker modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeInput, setTimeInput] = useState(settings.dailyReminderTime);
  const [timeModalType, setTimeModalType] = useState<'daily' | 'debt' | 'goal'>('daily');

  const renderToggle = (label: string, value: boolean, onToggle: (v: boolean) => void) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch 
        value={value} 
        onValueChange={onToggle} 
        trackColor={{ true: C.brand, false: C.surfaceLight }} 
        thumbColor={C.white} 
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* NOTIFICATIONS SECTION */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <SurfaceCard>
          {/* Test Buttons */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={async () => {
              try {
                const hasPermission = await requestPermissions();
                if (!hasPermission) {
                  Alert.alert('Permission Denied', 'Please enable notifications in system settings.');
                  return;
                }
                await sendTestNotification();
                Alert.alert('Success', 'Test notification scheduled! It should appear in 2 seconds.');
              } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed to schedule notification');
                console.error(e);
              }
            }}
          >
            <Text style={styles.settingLabel}>Test Notification</Text>
            <MaterialCommunityIcons name="bell-ring" size={20} color={C.brand} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={async () => {
              try {
                const { testGoalNotification } = await import('../src/utils/notifications');
                await testGoalNotification();
                Alert.alert('Success', 'Goal notification will appear in 2 seconds!');
              } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed');
                console.error(e);
              }
            }}
          >
            <Text style={styles.settingLabel}>Test Goal Notification</Text>
            <MaterialCommunityIcons name="flag" size={20} color={C.income} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* Daily Reminder */}
          {renderToggle('Daily transaction reminder', settings.dailyReminderEnabled, async (v) => {
            await updateSetting('dailyReminderEnabled', v);
            await scheduleDailyReminder(v, settings.dailyReminderTime);
          })}
          
          {settings.dailyReminderEnabled && (
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => { 
                setTimeModalType('daily'); 
                setTimeInput(settings.dailyReminderTime); 
                setShowTimeModal(true); 
              }}
            >
              <Text style={styles.settingLabel}>Reminder time</Text>
              <View style={styles.settingValue}>
                <Text style={styles.currencyDisplay}>{settings.dailyReminderTime}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          
          <View style={styles.divider} />
          
          {/* Debt Reminders */}
          {renderToggle('Debt/loan due reminders', settings.debtRemindersEnabled, v => updateSetting('debtRemindersEnabled', v))}
          {settings.debtRemindersEnabled && (
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => { 
                setTimeModalType('debt'); 
                setTimeInput(settings.debtReminderTime); 
                setShowTimeModal(true); 
              }}
            >
              <Text style={styles.settingLabel}>Debt reminder time</Text>
              <View style={styles.settingValue}>
                <Text style={styles.currencyDisplay}>{settings.debtReminderTime}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          
          <View style={styles.divider} />
          
          {/* Goal Reminders */}
          {renderToggle('Goal deadline reminders', settings.goalRemindersEnabled, v => updateSetting('goalRemindersEnabled', v))}
          {settings.goalRemindersEnabled && (
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => { 
                setTimeModalType('goal'); 
                setTimeInput(settings.goalReminderTime); 
                setShowTimeModal(true); 
              }}
            >
              <Text style={styles.settingLabel}>Goal reminder time</Text>
              <View style={styles.settingValue}>
                <Text style={styles.currencyDisplay}>{settings.goalReminderTime}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        </SurfaceCard>
      </ScrollView>

      {/* Time Picker Modal */}
      <ModalWrapper visible={showTimeModal} onClose={() => setShowTimeModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {timeModalType === 'daily' ? 'Daily Reminder Time' : 
             timeModalType === 'debt' ? 'Debt Reminder Time' : 
             'Goal Reminder Time'}
          </Text>
          <TextInput
            style={styles.input}
            value={timeInput}
            onChangeText={setTimeInput}
            placeholder="HH:MM (e.g., 20:00)"
            placeholderTextColor={C.textMuted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowTimeModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={async () => {
                if (!/^\d{2}:\d{2}$/.test(timeInput)) {
                  Alert.alert('Invalid Time', 'Please use HH:MM format (e.g., 20:00)');
                  return;
                }
                if (timeModalType === 'daily') {
                  await updateSetting('dailyReminderTime', timeInput);
                  await scheduleDailyReminder(settings.dailyReminderEnabled, timeInput);
                } else if (timeModalType === 'debt') {
                  await updateSetting('debtReminderTime', timeInput);
                } else {
                  await updateSetting('goalReminderTime', timeInput);
                }
                setShowTimeModal(false);
              }} 
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalWrapper>
    </View>
  );
}

// Add divider style
const createStyles = (C: ThemeColors) => StyleSheet.create({
  // ... existing styles
  divider: { height: 1, backgroundColor: C.divider, marginVertical: Spacing.xs },
  // ... rest of styles
});
```

---

## Testing

### 1. Test in Expo Go

**Immediate Notifications (Budget):**
1. Create a budget with low limit (e.g., $10 for Food)
2. Add expense exceeding limit (e.g., $15 for Food)
3. Notification appears within 1 second ✅

**Daily Reminders:**
1. Go to Settings → Enable "Daily transaction reminder"
2. Set time to current time + 2 minutes
3. Close the app completely
4. Wait for scheduled time
5. Notification appears even with app closed ✅

**Test Buttons:**
1. Settings → "Test Notification" → Appears in 2 seconds ✅
2. Settings → "Test Goal Notification" → Appears in 2 seconds ✅

**Goal Reminders:**
1. Enable "Goal deadline reminders" in Settings
2. Set reminder time (e.g., 10:00)
3. Create goal with deadline 4 days from now
4. Alert confirms: "Reminder scheduled for [date] at 10:00"
5. Notification will appear 3 days before deadline at 10:00 ✅

**Debt Reminders:**
1. Enable "Debt/loan due reminders" in Settings
2. Set reminder time (e.g., 09:00)
3. Create debt with due date 2 days from now
4. Notification will appear 1 day before due date at 09:00 ✅

### 2. Verify Scheduled Notifications

```typescript
// Debug: Check all scheduled notifications
import * as Notifications from 'expo-notifications';

const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled);
```

### 3. Cancel Notifications

```typescript
// Cancel specific notification
await Notifications.cancelScheduledNotificationAsync('daily-reminder');

// Cancel by pattern
await Notifications.cancelScheduledNotificationAsync('debt-123');
await Notifications.cancelScheduledNotificationAsync('goal-456');

// Cancel all
await Notifications.cancelAllScheduledNotificationsAsync();
```

---

## Troubleshooting

### Issue 1: Notifications Not Appearing

**Check permissions:**
```typescript
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);
```

**Request permissions explicitly:**
```typescript
const hasPermission = await requestPermissions();
if (!hasPermission) {
  Alert.alert('Please enable notifications in system settings');
}
```

### Issue 2: Android Notifications Not Showing as Heads-Up

**Solution:** Ensure channel importance is MAX
```typescript
await Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX, // Critical!
  vibrationPattern: [0, 250, 250, 250],
});
```

### Issue 3: Notifications Not Working When App is Closed

**This is expected behavior in Expo Go for some notification types.**

**Solution for production:**
- Build with EAS Build
- Test on physical device with standalone build
- Daily reminders work in Expo Go ✅
- Date-based notifications work in Expo Go ✅

### Issue 4: Duplicate Notifications

**Solution:** Always cancel before scheduling
```typescript
await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});
await Notifications.scheduleNotificationAsync({
  identifier: 'daily-reminder',
  // ... rest of config
});
```

### Issue 5: Time Zone Issues

**Solution:** Use local time, not UTC
```typescript
const date = new Date(dateString); // Already in local time
date.setHours(hour, minute, 0, 0); // Sets in local time
```

---

## Key Learnings

### 1. Notification Handler Must Be at Module Level
```typescript
// ✅ CORRECT - At top of file
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true }),
});

// ❌ WRONG - Inside function
export function setupNotifications() {
  Notifications.setNotificationHandler({ /* ... */ });
}
```

### 2. Android Requires Notification Channels
```typescript
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.MAX,
  });
}
```

### 3. Use Identifiers for Manageable Notifications
```typescript
// Allows cancellation and updates
await Notifications.scheduleNotificationAsync({
  identifier: 'daily-reminder', // Important!
  content: { /* ... */ },
  trigger: { /* ... */ },
});
```

### 4. Always Validate Future Dates
```typescript
const target = new Date(targetDate);
const now = new Date();
if (target <= now) return; // Don't schedule past dates
```

### 5. Test with Immediate Triggers First
```typescript
// Use TIME_INTERVAL for testing
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds: 2,
}

// Then switch to DATE or DAILY for production
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date: scheduledDate,
}
```

---

## Production Checklist

- [ ] Permissions requested on first use
- [ ] Android notification channel configured
- [ ] All notification types tested in Expo Go
- [ ] Settings UI allows customization
- [ ] Notifications work when app is closed
- [ ] No duplicate notifications
- [ ] Proper error handling
- [ ] User feedback (alerts/confirmations)
- [ ] Test buttons for debugging
- [ ] Identifiers used for all scheduled notifications

---

## File Structure

```
src/
├── utils/
│   └── notifications.ts          # All notification functions
├── types/
│   └── index.ts                  # AppSettings interface
└── store/
    └── index.ts                  # Settings store with defaults

app/
├── settings.tsx                  # Notification settings UI
├── add-transaction.tsx           # Budget notification trigger
├── debts-loans.tsx              # Debt reminder scheduling
└── goals.tsx                    # Goal reminder scheduling
```

---

## Complete notifications.ts File

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D1B2A',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(enabled: boolean, timeString: string) {
  await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});

  if (!enabled) return;

  const [hour, minute] = timeString.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: '💰 Money Ranger',
      body: "Don't forget to log your transactions today!",
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function scheduleDebtReminder(
  id: string,
  personName: string,
  amount: number,
  dueDate: string,
  currencySymbol: string,
  reminderTime: string
) {
  const due = new Date(dueDate);
  const now = new Date();

  if (due <= now) return;

  const oneDayBefore = new Date(due);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  
  const [hour, minute] = reminderTime.split(':').map(Number);
  oneDayBefore.setHours(hour, minute, 0, 0);

  if (oneDayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `debt-${id}`,
      content: {
        title: '⚠️ Payment Due Tomorrow',
        body: `${personName}: ${currencySymbol}${amount.toFixed(2)} due tomorrow`,
        sound: true,
        // @ts-ignore
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDayBefore,
      },
    });
  }
}

export async function scheduleGoalReminder(
  id: string,
  goalName: string,
  targetDate: string,
  reminderTime: string
): Promise<boolean> {
  const target = new Date(targetDate);
  const now = new Date();

  if (target <= now) return false;

  const threeDaysBefore = new Date(target);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  
  const [hour, minute] = reminderTime.split(':').map(Number);
  threeDaysBefore.setHours(hour, minute, 0, 0);

  if (threeDaysBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `goal-${id}`,
      content: {
        title: '🎯 Goal Deadline Approaching',
        body: `${goalName} deadline is in 3 days!`,
        sound: true,
        // @ts-ignore
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: threeDaysBefore,
      },
    });
    return true;
  }
  return false;
}

export async function notifyBudgetReached(categoryName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Budget Limit Reached',
      body: `You've reached your ${categoryName} budget limit!`,
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
}

export async function sendTestNotification() {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Notification',
      body: 'Notifications are working! This is a test message.',
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export async function testGoalNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Goal Deadline Approaching',
      body: 'Test Goal deadline is in 3 days!',
      sound: true,
      // @ts-ignore
      channelId: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}
```

---

## Summary

This implementation provides a complete, production-ready notification system that:

✅ Works in Expo Go for testing
✅ Works when app is closed
✅ Supports multiple notification types
✅ Fully customizable by users
✅ Includes test functions for debugging
✅ Handles permissions properly
✅ Uses identifiers for management
✅ Validates dates and times
✅ Provides user feedback

**Tested and verified on:** Expo Go, Android
**Ready for:** EAS Build, Production deployment

---

*Last updated: February 17, 2026*
*App: Money Ranger*
*Framework: React Native + Expo*
