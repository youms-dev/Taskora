import { DELETE_CATEGORY, MARK_DONE_CATEGORY, SNOOZE_CATEGORY } from "@/constants/notifications";
import { backgroundDeleteTask, backgroundMarkTaskDone, backgroundUpdateTaskNotification } from "@/services/task";
import { dismissNotificationAsync, NotificationContent, NotificationTaskPayload, NotificationTriggerInput, SchedulableTriggerInputTypes, scheduleNotificationAsync } from "expo-notifications";
import { defineTask } from "expo-task-manager";

export const NOTIFICATION_BACKGROUND_MANAGEMENT = "notification-background-management";

defineTask<NotificationTaskPayload>(NOTIFICATION_BACKGROUND_MANAGEMENT, async ({ data, error }) => {
    if (error || !("actionIdentifier" in data) || !("notification" in data)) {
        return;
    }

    const { actionIdentifier, notification } = data;
    const notificationId = notification.request.identifier;
    const notificationData = (notification.request.content as NotificationContent & { dataString?: string; }).dataString;

    if (!notificationData || typeof notificationData != "string") {
        return;
    }

    const taskData = JSON.parse(notificationData) as {
        taskId: string;
        taskType: string;
    };

    if (!taskData.taskId || !taskData.taskType || typeof taskData.taskId != "string" || (taskData.taskType != "event" && taskData.taskType != "task")) {
        return;
    }

    const taskId = taskData.taskId;
    const taskType = taskData.taskType;

    await dismissNotificationAsync(notificationId);

    if (actionIdentifier === MARK_DONE_CATEGORY && taskType == "task") {
        await backgroundMarkTaskDone(taskId);
    }
    else if (actionIdentifier === SNOOZE_CATEGORY && taskType == "event") {
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
                seconds: 60 * 5,
            },
        });

        if (!taskId || !taskType) {
            return;
        }

        await backgroundUpdateTaskNotification(taskId, newNotificationId, taskType);
    }
    else if (actionIdentifier === DELETE_CATEGORY) {
        await backgroundDeleteTask(taskId, taskType);
    }
});