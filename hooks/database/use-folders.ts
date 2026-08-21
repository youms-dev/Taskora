import { useDatabase } from "@/hooks/database/use-database";
import { FolderType, SQLiteFolderType } from "@/types/folder";

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

    return {
        getFolders,
        getFoldersCount,
        deleteFolder,
    }
}
