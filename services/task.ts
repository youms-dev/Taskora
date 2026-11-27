import { DATABASE_NAME } from "@/config/sql";
import { TaskType } from "@/types/database/task";
import { openDatabaseAsync } from "expo-sqlite";

export const STORAGE_TEST = "test-background";

export async function backgroundUpdateTaskNotification(id: TaskType["idTask"], notification: TaskType["notificationId"], type: TaskType["type"]) {
    const db = await openDatabaseAsync(DATABASE_NAME, {
        useNewConnection: true,
    });

    try {
        await db.runAsync("UPDATE task SET notification_id = ? WHERE id_task = ? AND type = ?", [notification, id, type]);
    }
    catch (e) {
        console.log("Background update task error :", e);
    }
    finally {
        await db.closeAsync();
    }
}

export async function backgroundMarkTaskDone(id: TaskType["idTask"]) {
    const db = await openDatabaseAsync(DATABASE_NAME, {
        useNewConnection: true,
    });

    try {
        await db.runAsync("UPDATE task SET done = ? WHERE id_task = ? AND type = ?", [1, id, "task"]);

    }
    catch (e) {
        console.log("Background mark task done error :", e);
    }
    finally {
        await db.closeAsync();
    }
}

export async function backgroundDeleteTask(id: TaskType["idTask"], type: TaskType["type"]) {
    const db = await openDatabaseAsync(DATABASE_NAME, {
        useNewConnection: true,
    });

    try {
        await db.runAsync("DELETE FROM task WHERE id_task = ? AND type = ?", [id, type]);
    }
    catch (e) {
        console.log("Background delete task error :", e);
    }
    finally {
        await db.closeAsync();
    }
}