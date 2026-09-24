import { DATABASE_NAME } from "@/config/sql";
import { TaskType } from "@/types/task";
import { openDatabaseAsync } from "expo-sqlite";

export const STORAGE_TEST = "test-background";

export async function backgroundUpdateTaskNotification(id: TaskType["idTask"], notification: TaskType["notificationId"], type: TaskType["type"]) {
    try {
        const db = await openDatabaseAsync(DATABASE_NAME, {
            useNewConnection: true,
        });

        await db.runAsync("UPDATE task SET notification_id = ? WHERE id_task = ? AND type = ?", [notification, id, type]);

        await db.closeAsync();
    }
    catch (e) {
        console.log(e);
    }
}

export async function backgroundMarkTaskDone(id: TaskType["idTask"]) {
    try {
        const db = await openDatabaseAsync(DATABASE_NAME, {
            useNewConnection: true,
        });

        await db.runAsync("UPDATE task SET done = ? WHERE id_task = ? AND type = ?", [1, id, "task"]);

        await db.closeAsync();
    }
    catch (e) {
        console.log(e);
    }
}

export async function backgroundDeleteTask(id: TaskType["idTask"], type: TaskType["type"]) {
    try {
        const db = await openDatabaseAsync(DATABASE_NAME, {
            useNewConnection: true,
        });

        await db.runAsync("DELETE FROM task WHERE id_task = ? AND type = ?", [id, type]);

        await db.closeAsync();
    }
    catch (e) {
        throw e;
    }
}

// export async function backgroundDeleteTask(id: TaskType["idTask"], type: TaskType["type"]): Promise<boolean | unknown> {
//     try {
//         const db = await openDatabaseAsync(DATABASE_NAME);
//         const date = new Date();
//         const target = new Date(date.getFullYear(), date.getMonth(), 30).getTime();

//         await db.runAsync("INSERT INTO task(id_task, title, content, start_at, end_at, type, remind_before, notification_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [createId(), "Nouveau titre - " + id, "Nouveau content - " + type, target, String(new Date(target)), "task", 5, "id-notification"]);

//         return true;
//     }
//     catch (e) {
//         throw e;
//     }
// }