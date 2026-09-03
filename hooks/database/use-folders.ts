import { useDatabase } from "@/hooks/database/use-database";
import { FolderType, SQLiteFolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import { createId } from "@paralleldrive/cuid2";

export const useFolders = () => {
    const { db } = useDatabase();

    async function getFolders(offset: number | null = null, limit: number | null = null): Promise<FolderType[] | unknown> {
        if (!db) return;

        try {
            let result: SQLiteFolderType[] = [];

            if (offset != null && limit != null) {
                result = await db.getAllAsync("SELECT * FROM folder ORDER BY updated_at DESC LIMIT ? OFFSET ?", [limit, offset]);
            }
            else {
                result = await db.getAllAsync("SELECT * FROM folder ORDER BY updated_at DESC");
            }

            const dataParsed: FolderType[] = result.length > 0 ? result.map(item => {
                const { id_folder, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idFolder: id_folder,
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

    async function getFoldersCount(): Promise<number | unknown> {
        if (!db) return;

        try {
            const data = await db.getFirstAsync("SELECT COUNT(*) as count FROM folder") as { count: number };

            return data.count ?? 0;
        }
        catch (e) {
            throw e;
        }
    }

    async function deleteFolder(id: FolderType["idFolder"]): Promise<boolean | unknown> {
        if (!db) return;
        if (id.trim().length == 0) return false;

        try {
            await db.runAsync("DELETE FROM folder WHERE id_folder = ?", [id]);
            return true;
        }
        catch (e) {
            throw e;
        }
    }

    async function createFolder(title: FolderType["title"], tasks: TaskType["idTask"][] = []): Promise<boolean | unknown> {
        if (!db) return;
        const titleFormatted = (title.charAt(0).toUpperCase() + title.slice(1)).trim();

        try {
            await db.withTransactionAsync(async () => {
                const folderId = createId();

                await db.runAsync("INSERT INTO folder (id_folder, title) VALUES (?, ?)", [folderId, titleFormatted]);

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

    return {
        getFolders,
        getFoldersCount,
        deleteFolder,
        createFolder,
    }
}
