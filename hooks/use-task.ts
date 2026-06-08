import { useDatabase } from "@/hooks/use-database";
import { api } from "@/lib/axios";
import { SQLiteTaskType, TaskType } from "@/types/task";

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
                        [item.idTask, item.title ?? null, item.content, Number(item.done)]
                    );
                }
            }
            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function getTasks(limit: number = 10, offset: number = 0): Promise<TaskType[] | unknown> {
        if (!db) return;
        const stmt = await db.prepareAsync("SELECT * FROM task WHERE archived = $archived ORDER BY updated_at DESC LIMIT $limit OFFSET $offset");

        try {
            const result = await db.getAllAsync("SELECT * FROM task  WHERE archived = ?  ORDER BY updated_at DESC  LIMIT ? OFFSET ?", [0, limit, offset]) as SQLiteTaskType[];
            const dataParsed: TaskType[] = result.length > 0 ? result.map((item) => {
                const { id_task, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    createdAt: created_at,
                    updatedAt: updated_at,
                });
            }) : [];

            return dataParsed;
        }
        catch (e) {
            throw e;
        }
        finally {
            await stmt.finalizeAsync();
        }
    }

    async function getTasksCount(): Promise<number | unknown> {
        if (!db) return;
        try {
            const data = await db.getFirstAsync(`SELECT COUNT(*) as count FROM task WHERE archived = ${0}`) as { count: number };

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function searchTasks(value: string, limit: number = 0, offset: number = 0, archived: boolean = false): Promise<{
        data: TaskType[];
        count: number;
    } | unknown> {
        if (!db) return;
        const like = `%${value}%`;

        try {
            const data = await db.getAllAsync("SELECT * FROM task WHERE (title LIKE ? OR content LIKE ?) AND archived = ? ORDER BY updated_at LIMIT ? OFFSET ?", [like, like, archived ? 1 : 0, limit, offset]) as SQLiteTaskType[];

            const { count } = await db.getFirstAsync("SELECT COUNT(*) as count FROM task WHERE (title LIKE ? OR content LIKE ?) AND archived = ?", [like, like, archived ? 1 : 0]) as { count: number };

            const dataParsed = data.length > 0 ? data.map(item => {
                const { id_task, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    createdAt: created_at,
                    updatedAt: updated_at,
                } as TaskType);
            }) : [];

            return {
                data: dataParsed,
                count,
            };
        }
        catch (e) {
            throw e;
        }
    }

    async function archiveTasks(data: Array<TaskType["idTask"]>): Promise<boolean | unknown> {
        if (!db) return;
        if (data.length == 0) return true;
        const placeholder = Array(data.length).fill(0).map((_) => "?").join(",");

        try {
            await db.runAsync(`UPDATE task set archived = ? WHERE id_task IN (${placeholder})`, [1, ...data]);
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

    return {
        syncTasks,
        getTasks,
        getTasksCount,
        searchTasks,
        deleteTasks,
        archiveTasks,
    }
}
