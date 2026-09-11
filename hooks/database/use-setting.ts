import { SettingType, SQLiteSettingType } from "@/types/setting";
import { useDatabase } from "./use-database";

export const useSettings = () => {
    const { db } = useDatabase();

    async function getSetting(): Promise<SettingType | unknown> {
        if (!db) return;

        try {
            const data = await db.getFirstAsync("SELECT * FROM setting") as SQLiteSettingType;
            const { id_setting, id_user, notification_sound, confirm_before_delete, enable_2FA, created_at, updated_at, ...rest } = data;

            return {
                ...rest,
                idSetting: id_setting,
                idUser: id_user,
                notificationSound: notification_sound,
                confirmBeforeDelete: Boolean(confirm_before_delete),
                enable2FA: Boolean(enable_2FA),
                createdAt: created_at,
                updatedAt: updated_at,
            } as SettingType;
        }
        catch (e) {
            throw e;
        }
    }

    async function setSetting(data: Required<SettingType>): Promise<Boolean | unknown> {
        if (!db) return;

        try {
            await db.runAsync("UPDATE setting SET language = ?, notification_sound = ?, confirm_before_delete = ?, enable_2FA = ?", [data.language, data.notificationSound, Boolean(data.confirmBeforeDelete), Boolean(data.enable2FA)]);

            return true;
        }
        catch (e) {
            throw e;
        }
    }

    return ({
        getSetting,
        setSetting,
    });
}