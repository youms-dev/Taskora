import { BACKGROUND_TASK_MANAGEMENT, NOTIFICATION_BACKGROUND_MANAGEMENT } from "@/config/task-manager";
import { EVENTS_CHANGED, LOCK, TASKS_CHANGED, UNLOCK } from "@/constants/emitters";
import { DELETE_CATEGORY, EVENT_REMINDER_CATEGORY, MARK_DONE_CATEGORY, REMINDER_CHANNEL, SNOOZE_CATEGORY, TASK_REMINDER_CATEGORY } from "@/constants/notifications";
import { useTasks } from "@/hooks/database/use-tasks";
import { useLocalAuth } from "@/hooks/local-auth/use-local-auth";
import { SettingsProvider } from "@/hooks/settings/use-settings-data";
import { emitter } from "@/lib/event-emitter";
import * as BackgroundTask from "expo-background-task";
import { addNotificationResponseReceivedListener, AndroidImportance, AndroidNotificationPriority, dismissNotificationAsync, getLastNotificationResponse, NotificationChannelInput, NotificationResponse, NotificationTriggerInput, registerTaskAsync, SchedulableTriggerInputTypes, scheduleNotificationAsync, setNotificationCategoryAsync, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Platform } from "react-native";

const CONFIG: NotificationChannelInput = {
    name: "Reminders",
    importance: AndroidImportance.HIGH,
    enableVibrate: true,
    showBadge: true,
};

export default function ProtectedLayout() {
    const { t, i18n } = useTranslation();
    const { updateTaskNotification, deleteTasks, markTasksDone } = useTasks();
    const router = useRouter();
    const [locked, setLocked] = useState<boolean>(false);
    const { localAuth } = useLocalAuth();
    const pathname = usePathname();
    const currentPathname = useRef<string>(pathname);

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
                        seconds: 60 * 5,
                    },
                });

                await updateTaskNotification(taskId, notificationId, taskType);
            }
            else if (action == MARK_DONE_CATEGORY && taskType == "task") {
                await markTasksDone([taskId]);
                emitter.emit(TASKS_CHANGED);
            }
            else if (action == DELETE_CATEGORY) {
                await deleteTasks([taskId]);
                if (taskType == "task") emitter.emit(TASKS_CHANGED);
                else emitter.emit(EVENTS_CHANGED);
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

        handleLastNotification();

        return () => remove();
    }, []);

    const handleRegisterTasks = useCallback(async () => {
        const isNotificationsTaskRegistered = await TaskManager.isTaskRegisteredAsync(NOTIFICATION_BACKGROUND_MANAGEMENT);
        const isBackgroundTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_MANAGEMENT);

        if (!isNotificationsTaskRegistered) {
            await registerTaskAsync(NOTIFICATION_BACKGROUND_MANAGEMENT);
        }

        if (!isBackgroundTaskRegistered) {
            await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_MANAGEMENT, {
                minimumInterval: 15,
            });
        }
    }, []);

    useEffect(() => {
        handleRegisterTasks();
    }, []);

    const onLock = useCallback(async () => {
        setLocked(true);
        currentPathname.current = pathname;
    }, [pathname]);
    
    const onUnLock = useCallback(async() => {
        setLocked(false);
        if (currentPathname.current) {
            router.navigate(currentPathname.current as any);
            currentPathname.current = pathname;
        }
    }, [pathname]);

    useEffect(() => {
        if (localAuth?.enabled && currentPathname.current == pathname) {
            onLock();
        }

        const { remove } = AppState.addEventListener("change", (state) => {
            if (localAuth?.enabled && state != "active" && state != "inactive") {
                onLock();
            }
        });

        emitter.addListener(LOCK, onLock);
        emitter.addListener(UNLOCK, onUnLock);

        return () => {
            remove();
            emitter.removeAllListeners(LOCK);
            emitter.removeAllListeners(UNLOCK);
        }
    }, [localAuth, onLock, onUnLock]);

    return (
        <SettingsProvider>
            <Stack screenOptions={{
                headerShown: false,
            }}>
                <Stack.Protected guard={!locked}>
                    <Stack.Screen name="(tabs)" />

                    <Stack.Screen name="(folders)" />

                    <Stack.Screen name="(task)" />

                    <Stack.Screen name="(user)" />

                    <Stack.Screen
                        name="sounds"
                        options={{
                            animation: "fade_from_bottom",
                        }}
                    />

                    <Stack.Screen name="sync-data" />

                    <Stack.Screen name="(local-auth)" />
                </Stack.Protected>

                <Stack.Protected guard={locked}>
                    <Stack.Screen
                        name="lock-screen"
                        options={{
                            animation: "fade",
                        }}
                    />
                </Stack.Protected>
            </Stack>
        </SettingsProvider>
    );
}