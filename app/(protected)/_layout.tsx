import { DELETE_CATEGORY, EVENT_REMINDER_CATEGORY, MARK_DONE_CATEGORY, REMINDER_CHANNEL, SNOOZE_CATEGORY, TASK_REMINDER_CATEGORY } from "@/constants/notifications";
import { useDatabase } from "@/hooks/database/use-database";
import { useTasks } from "@/hooks/database/use-tasks";
import { SettingsProvider } from "@/hooks/settings/use-settings-data";
import { event, EVENTS_CHANGED, TASKS_CHANGED } from "@/lib/event-emitter";
import { addNotificationResponseReceivedListener, AndroidImportance, AndroidNotificationPriority, dismissNotificationAsync, getLastNotificationResponse, NotificationChannelInput, NotificationResponse, NotificationTriggerInput, SchedulableTriggerInputTypes, scheduleNotificationAsync, setNotificationCategoryAsync, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

const CONFIG: NotificationChannelInput = {
    name: "Reminders",
    importance: AndroidImportance.HIGH,
    enableVibrate: true,
    showBadge: true,
};

export default function ProtectedLayout() {
    const { t, i18n } = useTranslation();
    const { db } = useDatabase();
    const { updateTaskNotification, deleteTasks, markTasksDone } = useTasks();
    const router = useRouter();

    const setupNotifications = useCallback(async () => {
        await setNotificationCategoryAsync(TASK_REMINDER_CATEGORY, [
            {
                identifier: MARK_DONE_CATEGORY,
                buttonTitle: t("layout_(protected)_mark_done"),
                options: {
                    opensAppToForeground: Platform.OS == "android" != true,
                },
            },
            {
                identifier: DELETE_CATEGORY,
                buttonTitle: t("layout_(protected)_delete"),
                options: {
                    opensAppToForeground: Platform.OS == "android" != true,
                    isDestructive: true,
                },
            },
        ]);

        await setNotificationCategoryAsync(EVENT_REMINDER_CATEGORY, [
            {
                identifier: SNOOZE_CATEGORY,
                buttonTitle: t("layout_(protected)_snooze"),
                options: {
                    opensAppToForeground: Platform.OS == "android" != true,
                },
            },
            {
                identifier: DELETE_CATEGORY,
                buttonTitle: t("layout_(protected)_delete"),
                options: {
                    opensAppToForeground: Platform.OS == "android" != true,
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

        await setNotificationChannelAsync(`${REMINDER_CHANNEL}sound01`, {
            ...CONFIG,
            sound: "sound01.wav",
        });
        await setNotificationChannelAsync(`${REMINDER_CHANNEL}sound02`, {
            ...CONFIG,
            sound: "sound02.wav",
        });
        await setNotificationChannelAsync(`${REMINDER_CHANNEL}sound03`, {
            ...CONFIG,
            sound: "sound03.wav",
        });
        await setNotificationChannelAsync(`${REMINDER_CHANNEL}sound04`, {
            ...CONFIG,
            sound: "sound04.wav",
        });
    }, [i18n.language]);

    useEffect(() => {
        setupNotifications();
    }, [setupNotifications]);

    const onNotificationResponseReceived = useCallback(async (response: NotificationResponse) => {
        const notificationId = response.notification.request.identifier;
        const notification = response.notification.request;
        const action = response.actionIdentifier;
        const taskId = response.notification.request.content.data?.taskId ?? null;
        const taskType = notification.content.data?.taskType ?? null;

        await dismissNotificationAsync(notificationId);
        console.log("Action :", action);

        if (taskId && typeof taskId == "string" && taskId.trim().length > 0 && taskType && typeof taskType == "string" && (taskType == "task" || taskType == "event")) {
            if (action == SNOOZE_CATEGORY && taskType == "event") {
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
                        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                        channelId: (notification.trigger as NotificationTriggerInput)?.channelId ?? "reminder_sound02",
                        // seconds: 60 * 5,
                        seconds: 2,
                    },
                });

                await updateTaskNotification(taskId, notificationId, taskType);
            }
            else if (action == MARK_DONE_CATEGORY && taskType == "task") {
                await markTasksDone([taskId]);
                event.emit(TASKS_CHANGED);
            }
            else if (action == DELETE_CATEGORY) {
                await deleteTasks([taskId]);
                if (taskType == "task") event.emit(TASKS_CHANGED);
                else event.emit(EVENTS_CHANGED);
            }
            else {
                router.navigate({
                    pathname: "/(protected)/(task)/[id]",
                    params: {
                        id: taskId,
                    },
                });
            }
        }
    }, []);

    const handleLastNotification = useCallback(async () => {
        const response = getLastNotificationResponse();

        if (response) {
            onNotificationResponseReceived(response);
        }
    }, []);

    useEffect(() => {
        const { remove } = addNotificationResponseReceivedListener(async (response) => {
            onNotificationResponseReceived(response);
        });

        // handleLastNotification();

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