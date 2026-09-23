import { DELETE_CATEGORY, SNOOZE_CATEGORY } from "@/constants/notifications";
import { backgroundUpdateTaskNotification } from "@/services/update-task";
import { dismissNotificationAsync, NotificationTaskPayload, NotificationTriggerInput, registerTaskAsync, SchedulableTriggerInputTypes, scheduleNotificationAsync } from "expo-notifications";
import { defineTask, isTaskRegisteredAsync } from "expo-task-manager";

console.log("File loaded");

export const NOTIFICATION_BACKGROUND_MANAGEMENT = "notification-background-management";

defineTask<NotificationTaskPayload>(NOTIFICATION_BACKGROUND_MANAGEMENT, async ({ data, error }) => {
    if (error) {
        console.error("task manager error :", error);

        return;
    }

    if (!("actionIdentifier" in data) || !("notification" in data)) {
        return;
    }

    const { actionIdentifier, notification } = data;
    const notificationId = notification.request.identifier;
    const taskId = notification.request.content.data?.taskId ?? null;
    const taskType = notification.request.content.data?.taskType ?? null;

    await dismissNotificationAsync(notificationId);

    if (actionIdentifier === SNOOZE_CATEGORY) {
        const newNotificationId = await scheduleNotificationAsync({
            content: {
                title: notification.request.content.title,
                subtitle: notification.request.content.subtitle,
                body: notification.request.content.body,
                sound: notification.request.content.sound ?? "sound02.wav",
                categoryIdentifier: notification.request.content.categoryIdentifier ?? "reminder",
                data: {
                    taskId,
                    taskType,
                }
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                channelId: (notification.request.trigger as NotificationTriggerInput)?.channelId ?? "reminder_sound02",
                // seconds: 60 * 5,
                seconds: 2,
            },
        });

        await backgroundUpdateTaskNotification(taskId as string, newNotificationId, taskType as "task" | "event");
    }

    if (actionIdentifier === DELETE_CATEGORY) {
        // Supprimer / traiter la tâche
    }
});

async function checkRegisteredTask() {
    const registered = await isTaskRegisteredAsync(NOTIFICATION_BACKGROUND_MANAGEMENT);

    if (!registered) {
        await registerTaskAsync(NOTIFICATION_BACKGROUND_MANAGEMENT);
    }
}

checkRegisteredTask();

console.log("Reading completed");