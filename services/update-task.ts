import { DATABASE_NAME } from "@/config/sql";
import { TaskType } from "@/types/task";
import { openDatabaseAsync } from "expo-sqlite";

export async function backgroundUpdateTaskNotification(id: TaskType["idTask"], notification: TaskType["notificationId"], type: TaskType["type"]) {
    try {
        const db = await openDatabaseAsync(DATABASE_NAME);

        await db.runAsync("UPDATE task SET notification_id = ? WHERE id_task = ? AND type = ?", [notification, id, type]);

        await db.closeAsync();
    }
    catch (e) {
        console.log(e);
    }
}

export async function backgroundTaskTest() {
    try {
        const db = await openDatabaseAsync(DATABASE_NAME);
        const date = new Date();
        const target = new Date(date.getFullYear(), date.getMonth(), 30).getTime();

        await db.runAsync("INSERT INTO task(id_task, title, content, start_at, end_at, type, remind_before, notification_id)", ["new_id", "Nouveau titre", "Nouveau content", target, String(new Date(target)), "task", 5, "id-notification"]);

        // await db.closeAsync();
    }
    catch (e) {
        console.log(e);
    }
}