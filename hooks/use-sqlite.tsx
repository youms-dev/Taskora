import { DATABASE_NAME, INIT_DATABASE } from "@/constants/database";
import { usePathname } from "expo-router";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

const Context = createContext<{
    db: SQLiteDatabase | null,
}>({
    db: null,
});

interface Props {
    children: ReactNode;
}

export const DatabaseProvider = ({ children }: Props) => {
    const db = useRef<SQLiteDatabase>(null);
    const pathname = usePathname();

    useEffect(() => {
        (async () => {
            if (!db.current) {
                db.current = await openDatabaseAsync(DATABASE_NAME);
            }
            await db.current.execAsync(INIT_DATABASE);
        })();
    }, [pathname]);

    return (
        <Context.Provider value={{
            db: db.current,
        }}>
            {children}
        </Context.Provider>
    )
}

export const useDatabase = () => useContext(Context);