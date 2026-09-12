import { useTasks } from "@/hooks/database/use-tasks";
import { SettingsProvider } from "@/hooks/settings/use-settings-data";
import { event, TASKS_CHANGED } from "@/lib/event-emitter";
import { addNotificationResponseReceivedListener, AndroidImportance, AndroidNotificationPriority, cancelAllScheduledNotificationsAsync, deleteNotificationCategoryAsync, deleteNotificationChannelAsync, dismissNotificationAsync, getNotificationCategoriesAsync, getNotificationChannelsAsync, NotificationChannelInput, NotificationTriggerInput, SchedulableTriggerInputTypes, scheduleNotificationAsync, setNotificationCategoryAsync, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

const CONFIG: NotificationChannelInput = {
    name: "Reminders",
    importance: AndroidImportance.HIGH,
    enableVibrate: true,
    showBadge: true,
};

export default function ProtectedLayout() {
    const { t, i18n } = useTranslation();
    const { updateTaskNotification, deleteTasks } = useTasks();

    const handleNotifs = useCallback(async () => {
        const channels = await getNotificationChannelsAsync();
        const categories = await getNotificationCategoriesAsync();

        await cancelAllScheduledNotificationsAsync();

        if (channels.length > 0) {
            await Promise.all(
                channels.map(async (channel) => {
                    await deleteNotificationChannelAsync(channel.id);
                }),
            );
        }
        if (categories.length > 0) {
            await Promise.all(
                categories.map(async (cat) => {
                    await deleteNotificationCategoryAsync(cat.identifier);
                }),
            );
        }

        await setNotificationCategoryAsync("reminder", [
            {
                identifier: "SNOOZE",
                buttonTitle: t("layout_(protected)_snooze"),
                options: {
                    opensAppToForeground: false,
                },
            },
            {
                identifier: "DELETE",
                buttonTitle: t("layout_(protected)_delete"),
                options: {
                    opensAppToForeground: false,
                    isDestructive: true,
                },
            },
        ]);

        setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
                priority: AndroidNotificationPriority.HIGH,
            }),
        });

        await setNotificationChannelAsync("reminder_sound01", {
            ...CONFIG,
            sound: "sound01.wav",
        });
        await setNotificationChannelAsync("reminder_sound02", {
            ...CONFIG,
            sound: "sound02.wav",
        });
        await setNotificationChannelAsync("reminder_sound03", {
            ...CONFIG,
            sound: "sound03.wav",
        });
        await setNotificationChannelAsync("reminder_sound04", {
            ...CONFIG,
            sound: "sound04.wav",
        });
    }, [i18n.language]);

    useEffect(() => {
        handleNotifs();
    }, [handleNotifs]);

    useEffect(() => {
        const { remove } = addNotificationResponseReceivedListener(async (response) => {
            const action = response.actionIdentifier;
            const notificationId = response.notification.request.identifier;
            const notification = response.notification.request;
            const taskId = notification.content.data?.taskId ?? null;
            const taskType = notification.content.data?.taskType ?? null;

            await dismissNotificationAsync(notificationId);

            if (taskId && typeof taskId == "string" && taskId.trim().length > 0 && taskType && typeof taskType == "string" && (taskType == "task" || taskType == "event")) {
                if (action == "SNOOZE") {
                    console.log("SNOOZE");
                    const notificationId = await scheduleNotificationAsync({
                        content: {
                            title: notification.content.title,
                            subtitle: notification.content.subtitle,
                            body: notification.content.body,
                            sound: notification.content.sound ?? "sound02.wav",
                            categoryIdentifier: notification.content.categoryIdentifier ?? "reminder",
                            data: {
                                taskId,
                                taskType,
                            }
                        },
                        trigger: {
                            type: SchedulableTriggerInputTypes.DATE,
                            channelId: (notification.trigger as NotificationTriggerInput)?.channelId ?? "reminder_sound02",
                            // seconds: 5,
                        },
                    });

                    await updateTaskNotification(taskId, notificationId, taskType);

                    console.log("New schedule :", notificationId);
                }
                else if (action == "DELETE") {
                    console.log("DELETE");
                    await deleteTasks([taskId]);
                    event.emit(TASKS_CHANGED);
                }
            }
        });

        return () => remove();
    }, []);

    return (
        <SettingsProvider>
            <Stack
                initialRouteName="(tabs)"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="(tabs)" />

                <Stack.Screen name="(local-auth)" />

                <Stack.Screen name="(user)" />

                <Stack.Screen name="(task)" />
            </Stack>
        </SettingsProvider>
    );
}