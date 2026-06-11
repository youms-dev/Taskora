import { SQLiteDatabase } from "expo-sqlite";
import { createContext, ReactNode, useContext } from "react";

const Context = createContext<{
    db: SQLiteDatabase | null;
}>({
    db: null,
});

interface Props {
    children: ReactNode;
    db: SQLiteDatabase;
}

export const DatabaseProvider = ({ children, db }: Props) => {
    return (
        <Context.Provider value={{
            db,
        }}>
            {children}
        </Context.Provider>
    );
}

export const useDatabase = () => useContext(Context);