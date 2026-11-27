import { useDatabase } from "@/hooks/database/use-database";
import { FolderType, SQLiteFolderType } from "@/types/database/folder";
import { TaskType } from "@/types/database/task";
import { createId } from "@paralleldrive/cuid2";

export const useFolders = () => {
    const { db } = useDatabase();

    async function getFolders(idUser: string, offset: number | null = null, limit: number | null = null): Promise<FolderType[] | unknown> {
        if (!db) return;

        try {
            let result: SQLiteFolderType[] = [];

            if (offset != null && limit != null) {
                result = await db.getAllAsync("SELECT * FROM folder WHERE id_user = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?", [idUser, limit, offset]);
            }
            else {
                result = await db.getAllAsync("SELECT * FROM folder WHERE id_user = ? ORDER BY updated_at DESC");
            }

            const dataParsed: FolderType[] = result.length > 0 ? result.map(item => {
                const { id_folder, id_user, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idFolder: id_folder,
                    idUser: id_user,
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

    async function getFoldersCount(idUser: string): Promise<number | unknown> {
        if (!db) return;

        try {
            const data = await db.getFirstAsync("SELECT COUNT(*) as count FROM folder WHERE id_user = ?", [idUser]) as { count: number };

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function deleteFolder(id: FolderType["idFolder"], tasks: TaskType["idTask"][] = []): Promise<boolean | unknown> {
        if (!db) return;
        if (id.trim().length == 0) return false;

        try {
            if (tasks.length > 0) {
                const placeholders = tasks.map(() => "?").join(",");

                await db.withTransactionAsync(async () => {
                    await db.runAsync(`DELETE FROM task WHERE id_task IN (${placeholders}) AND type = ?`, [...tasks, "task"]);

                    await db.runAsync("DELETE FROM folder WHERE id_folder = ?", [id]);
                });
            }
            else {
                await db.runAsync("DELETE FROM folder WHERE id_folder = ?", [id]);
            }

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function createFolder(idUser: string, title: FolderType["title"], tasks: TaskType["idTask"][] = []): Promise<boolean | unknown> {
        if (!db) return;
        const titleFormatted = (title.trim().charAt(0).toUpperCase() + title.trim().slice(1)).trim();

        try {
            await db.withTransactionAsync(async () => {
                const folderId = createId();

                await db.runAsync("INSERT INTO folder (id_folder, id_user, title) VALUES (?, ?, ?)", [folderId, idUser, titleFormatted]);

                if (tasks.length > 0) {
                    const placeholder = tasks.map(() => '?').join(",");

                    await db.runAsync(`UPDATE task SET id_folder = ? WHERE id_task IN (${placeholder})`, [folderId, ...tasks]);
                }
            });

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function deleteFolders(folders: FolderType["idFolder"][]): Promise<boolean | unknown> {
        if (!db || folders.length == 0) return;
        const placeholders = folders.map(() => "?").join(",");

        try {
            await db.runAsync(`DELETE FROM folder WHERE id_folder IN (${placeholders})`, [...folders]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function updateFolder(id: FolderType["idFolder"], title: string): Promise<boolean | unknown> {
        if (!db) return;
        const titleFormatted = (title.trim().charAt(0).toUpperCase() + title.trim().slice(1)).trim();

        try {
            await db.runAsync("UPDATE folder SET title = ? WHERE id_folder = ?", [titleFormatted, id]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    return {
        getFolders,
        getFoldersCount,
        deleteFolder,
        createFolder,
        deleteFolders,
        updateFolder,
    }
}
