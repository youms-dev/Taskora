import { useDatabase } from "@/hooks/database/use-database";
import { api } from "@/lib/axios";
import { FolderType } from "@/types/folder";
import { SQLiteTaskType, TaskType } from "@/types/task";
import { endOfDay, startOfDay } from "date-fns";

export const useTasks = () => {
    const { db } = useDatabase();

    async function syncTasks(position: number = 0): Promise<boolean | unknown> {
        if (!db) return;

        try {
            const { data }: { data: TaskType[] } = await api.post(`/task/list?skip=${position}`);

            if (data.length > 0) {
                for (const item of data) {
                    await db.runAsync(
                        `INSERT OR IGNORE INTO task (id_task, title, content, done) VALUES (?, ?, ?, ?)`,
                        [item.idTask, item.title ?? null, item.content ?? null, Number(item.done)]
                    );
                }
            }
            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTasks(limit: number = 10, offset: number = 0, archived: boolean | null = null, type: TaskType["type"] = "task"): Promise<TaskType[] | unknown> {
        if (!db) return;

        try {
            let result: SQLiteTaskType[] = [];

            if (archived != null) {
                result = await db.getAllAsync("SELECT * FROM task WHERE archived = ? AND type = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?", [archived ? 1 : 0, type, limit, offset]);
            }
            else {
                result = await db.getAllAsync("SELECT * FROM task WHERE type = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?", [type, limit, offset]);
            }

            const dataParsed: TaskType[] = result.length > 0 ?
                result.map((item) => {
                    const { id_task, id_folder, done, start_at, end_at, archived, notification_id, created_at, updated_at, ...rest } = item;

                    return ({
                        ...rest,
                        idTask: id_task,
                        idFolder: id_folder,
                        startAt: start_at,
                        endAt: end_at ? new Date(end_at) : null,
                        archived: Boolean(archived),
                        done: Boolean(done),
                        pinned: Boolean(item.pinned),
                        notificationId: notification_id,
                        createdAt: created_at,
                        updatedAt: updated_at,
                    });
                })
                :
                [];

            return dataParsed;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTasksByDate(date: Date, limit: number = 10, offset: number = 0): Promise<TaskType[] | unknown> {
        if (!db) return;
        const start = startOfDay(date).getTime();
        const end = endOfDay(date).getTime();

        try {
            const result = await db.getAllAsync("SELECT * FROM task WHERE type = ? AND start_at >= ? AND start_at <= ? ORDER BY updated_at DESC  LIMIT ? OFFSET ?", ["event", start, end, limit, offset]) as SQLiteTaskType[];
            const dataParsed: TaskType[] = result.length > 0 ? result.map((item) => {
                const { id_task, id_folder, start_at, end_at, archived, done, notification_id, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    idFolder: id_folder,
                    startAt: start_at,
                    endAt: end_at ? new Date(end_at) : null,
                    archived: Boolean(archived),
                    done: Boolean(done),
                    pinned: Boolean(item.pinned),
                    notificationId: notification_id,
                    createdAt: created_at,
                    updatedAt: updated_at,
                });
            }) : [];

            return dataParsed;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTasksCount(archived: boolean | null = null): Promise<number | unknown> {
        if (!db) return;

        try {
            let data: { count: number } = { count: 0 };

            if (archived != null) {
                data = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE archived = ? AND type = ?", [archived ? 1 : 0, "task"]) as { count: number };
            }
            else {
                data = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE type = ?", ["task"]) as { count: number };
            }

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTasksCountByDate(date: Date): Promise<number | unknown> {
        if (!db) return;
        const start = startOfDay(date).getTime();
        const end = endOfDay(date).getTime();

        try {
            const data = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE type = ? AND start_at >= ? AND start_at <= ?", ["event", start, end]) as { count: number };

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function searchTasks(value: string, limit: number = 0, offset: number = 0, archived: boolean | null = null, type: TaskType["type"] = "task"): Promise<{
        data: TaskType[];
        count: number;
    } | unknown> {
        if (!db) return;
        const valueFormatted = `%${value.trim()}%`;

        try {
            let data: SQLiteTaskType[] = [];
            let dataCount: { count: number } = { count: 0 };

            if (type == "event") {
                data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ? ORDER BY updated_at LIMIT ? OFFSET ?", [valueFormatted, valueFormatted, type, limit, offset]) as SQLiteTaskType[];

                dataCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ?", [valueFormatted, valueFormatted, type]) as { count: number };
            }
            else {
                if (archived != null) {
                    data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND archived = ? AND type = ? ORDER BY updated_at LIMIT ? OFFSET ?", [valueFormatted, valueFormatted, archived ? 1 : 0, type, limit, offset]) as SQLiteTaskType[];

                    dataCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND archived = ? AND type = ?", [valueFormatted, valueFormatted, archived ? 1 : 0, type]) as { count: number };
                }
                else {
                    data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ? ORDER BY updated_at LIMIT ? OFFSET ?", [valueFormatted, valueFormatted, type, limit, offset]) as SQLiteTaskType[];

                    dataCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ?", [valueFormatted, valueFormatted, type]) as { count: number };
                }
            }

            const dataParsed = data.length > 0 ? data.map(item => {
                const { id_task, start_at, end_at, archived, done, notification_id, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    startAt: start_at,
                    endAt: end_at ? new Date(end_at) : null,
                    archived: Boolean(archived),
                    done: Boolean(done),
                    notificationId: notification_id,
                    createdAt: created_at,
                    updatedAt: updated_at,
                } as TaskType);
            }) : [];

            return {
                data: dataParsed,
                count: dataCount.count,
            };
        }
        catch (e) {
            throw e;
        }
    }

    async function toggleArchiveTasks(data: Array<TaskType["idTask"]>, archived: boolean = false): Promise<boolean | unknown> {
        if (!db) return;
        if (data.length == 0) return true;
        const placeholder = Array(data.length).fill(0).map((_) => "?").join(",");

        try {
            await db.runAsync(`UPDATE task set archived = ? WHERE id_task IN (${placeholder})`, [archived ? 1 : 0, ...data]);
            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function deleteTasks(data: Array<TaskType["idTask"]>): Promise<boolean | unknown> {
        if (!db) return;
        if (data.length == 0) return true;
        const placeholder = Array(data.length).fill(0).map((_) => "?").join(",");

        try {
            await db.runAsync(`DELETE FROM task WHERE id_task IN (${placeholder})`, [...data]);
            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTask(id: TaskType["idTask"], type: TaskType["type"] | null = null): Promise<TaskType | unknown> {
        if (!db) return;
        try {
            let task: SQLiteTaskType & {
                folder_title: FolderType["title"];
            };

            if (type) {
                task = await db.getFirstAsync("SELECT t.*, f.title as folder_title FROM task t LEFT JOIN folder f ON t.id_folder = f.id_folder WHERE t.id_task = ? AND t.type = ?", [id, type]) as SQLiteTaskType & {
                    folder_title: FolderType["title"];
                }
            }
            else {
                task = await db.getFirstAsync("SELECT t.*, f.title as folder_title FROM task t LEFT JOIN folder f ON t.id_folder = f.id_folder WHERE t.id_task = ?", [id]) as SQLiteTaskType & {
                    folder_title: FolderType["title"];
                };
            }

            const { id_task, id_folder, folder_title, start_at, archived, end_at, done, remind_before, notification_id, created_at, updated_at, ...rest } = task;

            return {
                ...rest,
                idTask: id_task,
                idFolder: id_folder,
                folderTitle: folder_title,
                startAt: start_at,
                endAt: end_at ? new Date(end_at) : null,
                archived: Boolean(archived),
                done: Boolean(done),
                remindBefore: remind_before,
                notificationId: notification_id,
                createdAt: created_at,
                updatedAt: updated_at,
            } as TaskType & {
                folderTitle: FolderType["title"];
            };
        }
        catch (e) {
            throw e;
        }
    }

    async function togglePinTask(tasks: TaskType["idTask"][], pin: boolean = false): Promise<boolean | unknown> {
        if (!db) return;
        const placeholder = tasks.map(() => "?").join(",");

        try {
            await db.runAsync(`UPDATE task SET pinned = ? WHERE id_task IN (${placeholder}) AND type = ?`, [Number(pin), ...tasks, "task"]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function moveTasks(tasks: TaskType["idTask"][], folder: FolderType["idFolder"] | null): Promise<boolean | unknown> {
        if (!db) return;
        const placeholder = tasks.map(() => "?").join(",");

        try {
            await db.runAsync(`UPDATE task SET id_folder = ? WHERE id_task IN (${placeholder}) AND type = ?`, [folder ? folder : null, ...tasks, "task"]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function markTasksDone(tasks: TaskType["idTask"][]): Promise<boolean | unknown> {
        if (!db) return;
        const placeholder = tasks.map(() => "?").join(",");

        try {
            await db.runAsync(`UPDATE task SET done = ? WHERE id_task IN (${placeholder}) AND type = ?`, [1, ...tasks, "task"]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function createTask(task: Omit<TaskType, "createdAt" | "updatedAt" | "pinned" | "done">): Promise<boolean | unknown> {
        if (!db) return;

        try {
            if (task.type == "task") {
                await db.runAsync("INSERT INTO task (id_task, id_folder, title, content, icon, archived, start_at, notification_id, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [task.idTask, task.idFolder ?? null, task.title ?? null, task.content ?? null, task.icon ?? null, task.archived ? 1 : 0, task.startAt, task.notificationId, task.type]);
            }
            else {
                await db.runAsync("INSERT INTO task (id_task, title, content, icon, start_at, end_at, remind_before, notification_id, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [task.idTask, task.title ?? null, task.content ?? null, task.icon ?? null, task.startAt, String(task.endAt), task.remindBefore ?? null, task.notificationId, task.type]);
            }

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function updateTaskNotification(id: TaskType["idTask"], notification: TaskType["notificationId"], type: TaskType["type"]): Promise<boolean | unknown> {
        if (!db) return;

        try {
            await db.runAsync("UPDATE task SET notification_id = ? WHERE id_task = ? AND type = ?", [notification, id, type]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    return {
        syncTasks,
        getTasks,
        getTasksByDate,
        getTasksCount,
        searchTasks,
        deleteTasks,
        toggleArchiveTasks,
        getTasksCountByDate,
        getTask,
        togglePinTask,
        moveTasks,
        markTasksDone,
        createTask,
        updateTaskNotification,
    }
}
