import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Appointment } from '../types';
import { useThemeStore, NotificationSound } from '../stores/useThemeStore';

function getSoundPayload(soundState: NotificationSound): boolean | string {
    return soundState === 'default' ? true : soundState;
}

// Global background handler behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
    const { notificationSound } = useThemeStore.getState();

    if (Platform.OS === 'android') {
        const channelId = notificationSound === 'default' ? 'default' : `custom-${notificationSound}`;

        await Notifications.setNotificationChannelAsync(channelId, {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
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

/**
 * Calculates explicit trigger dates or intervals and schedules a notification.
 */
export async function scheduleMedicationReminder(medication: Medication) {
    // 1. First, always wipe any existing scheduled notifications for this specific medication ID to prevent duplicates.
    // We iterate over a potential 10 maximum daily doses just to ensure clean slate.
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

        // Loop over the specific times they are supposed to take it today/daily
        for (let i = 0; i < medication.schedule.length; i++) {
            const entry = medication.schedule[i];
            const [hours, minutes] = entry.time.split(':').map(Number);

            // If the medication is daily, we set up a DAILY trigger for this specific hour:minute
            if (medication.frequency === 'Daily') {
                await Notifications.scheduleNotificationAsync({
                    identifier: `med-${medication.id}-${i}`,
                    content: {
                        title: '💊 Medication Reminder',
                        body: `It's time to take your ${medication.name} (${entry.dosage} ${medication.dosageUnit})`,
                        sound: soundPayload,
                        // @ts-ignore
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
                // One-off schedule implementation for non-daily
                const triggerDate = new Date(medication.startDate);
                triggerDate.setHours(hours, minutes, 0, 0);

                if (triggerDate.getTime() > Date.now()) {
                    await Notifications.scheduleNotificationAsync({
                        identifier: `med-${medication.id}-${i}`,
                        content: {
                            title: '💊 Medication Reminder',
                            body: `It's time to take your ${medication.name} (${entry.dosage} ${medication.dosageUnit})`,
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
    // 1. Erase any existing reminders for this appointment
    await Notifications.cancelScheduledNotificationAsync(`appt-${appointment.id}`);

    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) return;

    const { notificationSound } = useThemeStore.getState();
    const androidChannelId = notificationSound === 'default' ? 'default' : `custom-${notificationSound}`;
    const soundPayload = getSoundPayload(notificationSound);

    try {
        const appointmentDate = new Date(appointment.dateTime);

        // Calculate the reminder time based on the string (e.g. "30 minutes before")
        const reminderTime = new Date(appointmentDate.getTime());

        // Let's implement basic parsing for common relative offsets:
        let label = "Upcoming";
        if (appointment.reminder) {
            if (appointment.reminder === 'None') return;

            const parsed = new Date(appointment.reminder);
            if (!isNaN(parsed.getTime())) {
                reminderTime.setTime(parsed.getTime());
                label = "Scheduled";
            } else if (appointment.reminder.includes('1 hour')) {
                reminderTime.setHours(reminderTime.getHours() - 1);
                label = "In 1 hour";
            } else if (appointment.reminder.includes('30 min')) {
                reminderTime.setMinutes(reminderTime.getMinutes() - 30);
                label = "In 30 minutes";
            } else if (appointment.reminder.includes('1 day')) {
                reminderTime.setDate(reminderTime.getDate() - 1);
                label = "Tomorrow";
            } else {
                // If we don't understand the format, let's just default to exactly at the appointment time
            }
        }

        // Only schedule if the computed reminder time is actually in the future!
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
            body: 'Notifications are actively working! This is a test message.',
            sound: soundPayload,
            // @ts-ignore
            channelId: androidChannelId,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 2, // triggers exactly 2 seconds from now
        },
    });
}
