import { LocalAuthType } from "@/types/auth";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { LOCAL_AUTH_STORE } from "@/constants/secure-store";

const Context = createContext<{
    localAuth: LocalAuthType | null;
    save: (value: LocalAuthType) => void;
    remove: () => void;
}>({
    localAuth: null,
    save: () => { },
    remove: () => { },
});

interface Props {
    children: ReactNode;
}

export const LocalAuthProvider = ({ children }: Props) => {
    const [auth, setAuth] = useState<LocalAuthType | null>(null);

    const save = useCallback(async (value: LocalAuthType) => {
        await SecureStore.setItemAsync(LOCAL_AUTH_STORE, JSON.stringify(value));
        get();
    }, []);

    const remove = useCallback(async () => {
        await SecureStore.deleteItemAsync(LOCAL_AUTH_STORE);
        get();
    }, []);

    const get = useCallback(async () => {
        const data = await SecureStore.getItemAsync(LOCAL_AUTH_STORE);

        if (data) {
            const dataParsed = JSON.parse(data) as LocalAuthType;

            if ("enabled" in dataParsed && "code" in dataParsed && "systemAuth" in dataParsed) {
                setAuth(dataParsed);
            }
            else {
                setAuth(null);
            }
        }
        else {
            setAuth(null);
        }
    }, []);

    useEffect(() => {
        get();
    }, []);

    return (
        <Context.Provider value={{
            localAuth: auth,
            save,
            remove,
        }}>
            {children}
        </Context.Provider>
    );
}

export const useLocalAuth = () => useContext(Context);