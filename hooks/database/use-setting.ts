import { SettingType, SQLiteSettingType } from "@/types/database/setting";
import { useDatabase } from "./use-database";

export const useSettings = () => {
    const { db } = useDatabase();

    async function getSetting(idUser: string): Promise<SettingType | unknown> {
        if (!db) return;

        try {
            const data = await db.getFirstAsync("SELECT s.* FROM setting s JOIN user u WHERE u.id_user = ?", [idUser]) as SQLiteSettingType;
            let dataParsed: SettingType | null = null;

            if (data) {
                const { id_setting, notification_sound, confirm_before_delete, _2FA, auto_sync, created_at, updated_at, ...rest } = data;

                dataParsed = {
                    ...rest,
                    idSetting: id_setting,
                    notificationSound: notification_sound,
                    confirmBeforeDelete: Boolean(confirm_before_delete),
                    _2FA: Boolean(_2FA),
                    autoSync: Boolean(auto_sync),
                    createdAt: created_at,
                    updatedAt: updated_at,
                } as SettingType;
            }

            return dataParsed;
        }
        catch (e) {
            throw e;
        }
    }

    async function setSetting(data: Required<SettingType>): Promise<true | unknown> {
        if (!db) return;

        try {
            const setting = db.getFirstAsync("SELECT * FROM setting WHERE id_setting = ?", [data.idSetting]);

            if (!setting) {
                throw 404;
            }

            await db.runAsync("UPDATE setting SET language = ?, notification_sound = ?, confirm_before_delete = ?, _2FA = ?, auto_sync = ? WHERE id_setting = ?", [data.language, data.notificationSound, Number(data.confirmBeforeDelete), Number(data._2FA), Number(data.autoSync), data.idSetting]);

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