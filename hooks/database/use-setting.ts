import { SettingType, SQLiteSettingType } from "@/types/setting";
import { useDatabase } from "./use-database";

export const useSettings = () => {
    const { db } = useDatabase();

    async function getSetting(): Promise<SettingType | unknown> {
        if (!db) return;

        try {
            const data = await db.getFirstAsync("SELECT * FROM setting") as SQLiteSettingType;
            const { id_setting, id_user, notification_sound, confirm_before_delete, _2FA, auto_sync, created_at, updated_at, ...rest } = data;

            return {
                ...rest,
                idSetting: id_setting,
                idUser: id_user,
                notificationSound: notification_sound,
                confirmBeforeDelete: Boolean(confirm_before_delete),
                _2FA: Boolean(_2FA),
                autoSync: Boolean(auto_sync),
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
            await db.runAsync("UPDATE setting SET language = ?, notification_sound = ?, confirm_before_delete = ?, _2FA = ?, auto_sync = ?", [data.language, data.notificationSound, Number(data.confirmBeforeDelete), Number(data._2FA), Number(data.autoSync)]);

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