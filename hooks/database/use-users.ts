import { useDatabase } from "@/hooks/database/use-database";
import { SQLiteUserType, UserType } from "@/types/database/user";
import { createId } from "@paralleldrive/cuid2";

export const useUsers = () => {
    const { db } = useDatabase();

    async function getUser(email: string): Promise<UserType | null | unknown> {
        if (!db) return;

        try {
            const data: SQLiteUserType | null = await db.getFirstAsync("SELECT * FROM user WHERE email = ?", [email.toLowerCase().trim()]);
            let dataParsed: UserType | null = null;

            if (data) {
                const { id_user, id_setting, created_at, updated_at, ...rest } = data;

                dataParsed = {
                    ...rest,
                    idUser: id_user,
                    idSetting: id_setting,
                    createdAt: created_at,
                    updatedAt: updated_at,
                };
            }

            return dataParsed;
        }
        catch (e) {
            throw e;
        }
    }

    async function createUser(data: Omit<UserType, "idUser" | "idSetting" | "createdAt" | "updatedAt">): Promise<string | unknown> {
        if (!db) return;

        try {
            const user = await db.getFirstAsync("SELECT * FROM user WHERE email = ?", [data.email.toLowerCase().trim()]);

            if (user) {
                throw 429;
            }
            const idSetting = createId();
            const idUser = createId();
            
            await db.withTransactionAsync(async () => {
                await db.runAsync("INSERT INTO setting (id_setting) VALUES(?)", [idSetting]);

                await db.runAsync("INSERT INTO user (id_user, id_setting, email, provider, photo) VALUES(?, ?, ?, ?, ?)", [idUser, idSetting, data.email.toLowerCase().trim(), data.provider ?? null, data.photo ?? null]);
            });

            return idUser;
        }
        catch (e) {
            throw e;
        }
    }

    async function updateUser(value: string | null, email: string, target: "photo" | "name"): Promise<true | unknown> {
        if (!db) return;

        try {
            const user = await db.getFirstAsync("SELECT * FROM user WHERE email = ?", [email.toLowerCase().trim()]);

            if (!user) {
                throw 404;
            }

            if(target == "photo") {
                await db.runAsync("UPDATE user SET photo = ? WHERE email = ?", [value, email.toLowerCase().trim()]);
            }
            else {
                await db.runAsync("UPDATE user SET name = ? WHERE email = ?", [value, email.toLowerCase().trim()]);
            }

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    return {
        getUser,
        createUser,
        updateUser,
    }
}
