import { DATABASE_NAME } from "@/config/sql";
import { TaskType } from "@/types/task";
import { openDatabaseAsync } from "expo-sqlite";

export async function backgroundUpdateTaskNotification(id: TaskType["idTask"], notification: TaskType["notificationId"], type: TaskType["type"]) {
    try {
        const db = await openDatabaseAsync(DATABASE_NAME);

        // await db.runAsync("UPDATE task SET notification_id = ? WHERE id_task = ? AND type = ?", [notification, id, type]);
        await db.runAsync("UPDATE task SET notification_id = ?, title = 'Massa' WHERE id_task = ? AND type = ?", [notification, id, type]);

        await db.closeAsync();
    }
    catch (e) {
        console.log(e);
    }
}