import { useDatabase } from "@/hooks/database/use-database";
import { SessionType, SQLiteSessionType } from "@/types/database/session";
import { createId } from "@paralleldrive/cuid2";

export const useSessions = () => {
    const { db } = useDatabase();

    async function getSessions(id: string): Promise<SessionType[] | unknown> {
        if (!db) return;

        try {
            const data: SQLiteSessionType[] = await db.getAllAsync("SELECT * FROM session WHERE id_user = ?", [id]);
            const dataParsed: SessionType[] = [];

            if (data.length > 0) {
                data.map((session) => {
                    const { id_session, id_user, id_device, device_name, device_brand, device_type, last_connection, created_at, ...rest } = session;

                    dataParsed.push({
                        ...rest,
                        idSession: id_session,
                        idUser: id_user,
                        idDevice: id_device,
                        deviceName: device_name,
                        deviceBrand: device_brand,
                        deviceType: device_type,
                        lastConnection: last_connection,
                        createdAt: created_at,
                    });
                });
            }

            return dataParsed;
        }
        catch (e) {
            throw e;
        }
    }

    async function createSession(data: Omit<SessionType, "idSession" | "idSetting" | "createdAt" | "lastConnection">): Promise<true | unknown> {
        if (!db) return;

        try {
            const session = await db.getFirstAsync("SELECT * FROM session WHERE id_device = ? AND id_user = ?", [data.idDevice, data.idUser]);

            if (!session) {
                const id = createId();

                await db.runAsync("INSERT INTO session (id_session, id_user, id_device, device_name, device_brand, device_type) VALUES(?, ?, ?, ?, ?, ?)", [id, data.idUser, data.idDevice, data.deviceName, data.deviceBrand, data.deviceType]);
            }

            return true;
        }
        catch (e) {
            console.log("error :", e);
            throw e;
        }
    }

    return {
        getSessions,
        createSession,
    }
}
