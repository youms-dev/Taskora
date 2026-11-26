import { useDatabase } from "@/hooks/database/use-database";
import { FolderType } from "@/types/database/folder";
import { SQLiteTaskType, TaskType } from "@/types/database/task";
import { endOfDay, startOfDay } from "date-fns";

export const useTasks = () => {
    const { db } = useDatabase();

    async function getTasks(idUser: string, limit: number = 10, offset: number = 0, archived: boolean | null = null, type: TaskType["type"] = "task"): Promise<TaskType[] | unknown> {
        if (!db) return;

        try {
            let result: SQLiteTaskType[] = [];

            if (archived != null) {
                result = await db.getAllAsync("SELECT * FROM task WHERE archived = ? AND type = ? AND id_user = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?", [archived ? 1 : 0, type, limit, offset, idUser]);
            }
            else {
                result = await db.getAllAsync("SELECT * FROM task WHERE type = ? AND id_user = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?", [type, limit, offset, idUser]);
            }

            const dataParsed: TaskType[] = result.length > 0 ?
                result.map((item) => {
                    const { id_task, id_folder, id_user, done, start_at, end_at, archived, notification_id, created_at, updated_at, ...rest } = item;

                    return ({
                        ...rest,
                        idTask: id_task,
                        idFolder: id_folder,
                        idUser: id_user,
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

    async function getTasksByDate(idUser: string, date: Date, limit: number = 10, offset: number = 0): Promise<TaskType[] | unknown> {
        if (!db) return;
        const start = startOfDay(date).getTime();
        const end = endOfDay(date).getTime();

        try {
            const result = await db.getAllAsync("SELECT * FROM task WHERE type = ? AND start_at >= ? AND start_at <= ? AND id_user = ? ORDER BY updated_at DESC  LIMIT ? OFFSET ?", ["event", start, end, limit, offset, idUser]) as SQLiteTaskType[];

            const dataParsed: TaskType[] = result.length > 0 ? result.map((item) => {
                const { id_task, id_folder, id_user, start_at, end_at, archived, done, notification_id, remind_before, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    idFolder: id_folder,
                    idUser: id_user,
                    startAt: start_at,
                    endAt: end_at ? new Date(end_at) : null,
                    archived: Boolean(archived),
                    done: Boolean(done),
                    pinned: Boolean(item.pinned),
                    notificationId: notification_id,
                    remindBefore: remind_before,
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

    async function getTasksCount(idUser: string, archived: boolean | null = null): Promise<number | unknown> {
        if (!db) return;

        try {
            let data: { count: number } = { count: 0 };

            if (archived != null) {
                data = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE archived = ? AND type = ? AND id_user = ?", [archived ? 1 : 0, "task", idUser]) as { count: number };
            }
            else {
                data = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE type = ? AND id_user = ?", ["task", idUser]) as { count: number };
            }

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTasksCountByDate(idUser: string, date: Date): Promise<number | unknown> {
        if (!db) return;
        const start = startOfDay(date).getTime();
        const end = endOfDay(date).getTime();

        try {
            const data = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE type = ? AND start_at >= ? AND start_at <= ? AND id_user = ?", ["event", start, end, idUser]) as { count: number };

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function searchTasks(idUser: string, value: string, limit: number = 0, offset: number = 0, archived: boolean | null = null, type: TaskType["type"] = "task"): Promise<{
        data: TaskType[];
        count: number;
    } | unknown> {
        if (!db) return;
        const valueFormatted = `%${value.trim()}%`;

        try {
            let data: SQLiteTaskType[] = [];
            let dataCount: { count: number } = { count: 0 };

            if (type == "event") {
                data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ? AND id_user = ? ORDER BY updated_at LIMIT ? OFFSET ?", [valueFormatted, valueFormatted, type, limit, offset, idUser]) as SQLiteTaskType[];

                dataCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ? AND id_user = ?", [valueFormatted, valueFormatted, type, idUser]) as { count: number };
            }
            else {
                if (archived != null) {
                    data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND archived = ? AND type = ? AND id_user = ? ORDER BY updated_at LIMIT ? OFFSET ?", [valueFormatted, valueFormatted, archived ? 1 : 0, type, limit, offset, idUser]) as SQLiteTaskType[];

                    dataCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND archived = ? AND type = ? AND id_user = ?", [valueFormatted, valueFormatted, archived ? 1 : 0, type, idUser]) as { count: number };
                }
                else {
                    data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ? AND id_user = ? ORDER BY updated_at LIMIT ? OFFSET ?", [valueFormatted, valueFormatted, type, limit, offset, idUser]) as SQLiteTaskType[];

                    dataCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND type = ? AND id_user = ?", [valueFormatted, valueFormatted, type, idUser]) as { count: number };
                }
            }

            const dataParsed = data.length > 0 ? data.map(item => {
                const { id_task, id_user, start_at, end_at, archived, done, notification_id, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    idUser: id_user,
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

    async function getTask(id: TaskType["idTask"], idUser: string, type: TaskType["type"] | null = null): Promise<TaskType | unknown> {
        if (!db) return;
        try {
            let task: SQLiteTaskType & {
                folder_title: FolderType["title"];
            };

            if (type) {
                task = await db.getFirstAsync("SELECT t.*, f.title as folder_title FROM task t LEFT JOIN folder f ON t.id_folder = f.id_folder WHERE t.id_task = ? AND t.type = ? AND t.id_user = ?", [id, type, idUser]) as SQLiteTaskType & {
                    folder_title: FolderType["title"];
                }
            }
            else {
                task = await db.getFirstAsync("SELECT t.*, f.title as folder_title FROM task t LEFT JOIN folder f ON t.id_folder = f.id_folder WHERE t.id_task = ? AND t.id_user = ?", [id, idUser]) as SQLiteTaskType & {
                    folder_title: FolderType["title"];
                };
            }

            const { id_task, id_folder, id_user, folder_title, start_at, archived, end_at, done, remind_before, notification_id, created_at, updated_at, ...rest } = task;

            return {
                ...rest,
                idTask: id_task,
                idUser: id_user,
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
            await db.runAsync(`UPDATE task SET pinned = ? WHERE id_task IN (${placeholder}) AND type = ? AND`, [Number(pin), ...tasks, "task"]);

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

    async function createTask(idUser: string, task: Omit<TaskType, "idUser" | "createdAt" | "updatedAt" | "pinned" | "done">): Promise<boolean | unknown> {
        if (!db) return;

        try {
            if (task.type == "task") {
                await db.runAsync(
                    "INSERT INTO task (id_task, id_user, id_folder, title, content, icon, archived, start_at, notification_id, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        task.idTask,
                        idUser,
                        task.idFolder ?? null,
                        (task.title ?
                            task.title.trim() : null
                        ),
                        (task.content ?
                            task.content.trim() : null
                        ),
                        task.icon ?? null,
                        task.archived ? 1 : 0,
                        task.startAt,
                        task.notificationId,
                        task.type,
                    ]);
            }
            else {
                await db.runAsync(
                    "INSERT INTO task (id_task, id_user, title, content, icon, start_at, end_at, remind_before, notification_id, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        task.idTask,
                        idUser,
                        (task.title ?
                            task.title.trim() : null
                        ),
                        (task.content ?
                            task.content.trim() : null
                        ),
                        task.icon ?? null,
                        task.startAt,
                        String(task.endAt),
                        task.remindBefore ?? null,
                        task.notificationId,
                        task.type,
                    ]);
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

    async function updateTask(id: TaskType["idTask"], data: Partial<TaskType>): Promise<boolean | unknown> {
        if (!db) return;
        let task: Partial<TaskType> = {
            ...data,
            startAt: data.startAt ? new Date(data.startAt).getTime() : new Date().getTime(),
        };

        try {
            await db.runAsync(
                "UPDATE task SET id_folder = ?, title = ?, content = ?, icon = ?, start_at = ?, end_at = ?, archived = ?, remind_before = ?, notification_id = ?, type = ? WHERE id_task = ?",
                [
                    task.type == "task" ? task.idFolder ?? null : null,
                    task.title ? task.title.trim() : null,
                    task.content ? task.content.trim() : null,
                    task.icon ?? null,
                    task.startAt!,
                    task.type == "task" ? null : String(task.endAt ?? new Date()),
                    task.type == "task" ? task.archived ? 1 : 0 : 0,
                    task.remindBefore ? task.remindBefore : task.type == "event" ? 5 : null,
                    task.notificationId ?? "",
                    task.type ?? "task",
                    id,
                ]
            );

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    return {
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
        updateTask,
    }
}
