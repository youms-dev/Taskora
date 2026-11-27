import { REFRESH_AUTH } from "@/constants/emitters";
import { AUTH_STORE, DEVICE_STORE } from "@/constants/secure-store";
import { emitter } from "@/lib/event-emitter";
import { AuthType } from "@/types/auth";
import { AUTH_PROVIDER, UserType } from "@/types/database/user";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useUsers } from "./database/use-users";

type AuthContextType = {
    user: UserType | null;
    loading: boolean;
    updateAuth: (value: string | null, target: "photo" | "name" | "email", provider?: AUTH_PROVIDER | null) => void;
    auth: AuthType | null;
    refresh: () => void;
    idDevice: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    updateAuth: () => { },
    auth: null,
    refresh: () => { },
    idDevice: null,
});

interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthContextType["user"] | null>(null);
    const { getUser, updateUser } = useUsers();
    const [auth, setAuth] = useState<AuthType | null>(null);
    const [idDevice, setIdDevice] = useState<string | null>(null);

    const handleGetIdDevice = useCallback(async () => {
        const data = await SecureStore.getItemAsync(DEVICE_STORE);

        setIdDevice(data);
    }, []);

    const handleGetAuth = useCallback(async () => {
        const data = await SecureStore.getItemAsync(AUTH_STORE);
        let auth: AuthType | null = null;

        if (data) {
            auth = JSON.parse(data) as AuthType;
        }
        setAuth(auth);

        return auth;
    }, []);

    const handleGetUser = useCallback(async () => {
        const auth = await handleGetAuth();

        if (!auth) return;

        try {
            setLoading(true);

            const data = await getUser(auth.user.email) as typeof user;

            setUser(data);
        }
        finally {
            setLoading(false);
        }
    }, []);

    const handleUpdateAuth = useCallback(async (value: string | null, target: "photo" | "email" | "name", provider: AUTH_PROVIDER | null = null) => {
        const auth = await handleGetAuth();

        if (!auth || !user) return;

        try {
            setLoading(true);

            await updateUser(value, user.idUser, target, provider);

            if (target == "photo") {
                await SecureStore.setItemAsync(AUTH_STORE, JSON.stringify({
                    ...auth,
                    user: {
                        ...auth.user,
                        photo: value,
                    }
                }));
            }
            else if (target == "email") {
                await SecureStore.setItemAsync(AUTH_STORE, JSON.stringify({
                    ...auth,
                    user: {
                        ...auth.user,
                        email: value,
                    }
                }));
            }

            handleGetUser();
            emitter.emit(REFRESH_AUTH);
        }
        finally {
            setLoading(false);
        }
    }, [user]);

    const handleRefresh = useCallback(() => {
        handleGetAuth();
        handleGetUser();
    }, []);

    useEffect(() => {
        handleRefresh();

        emitter.addListener(REFRESH_AUTH, handleRefresh);

        return () => {
            emitter.removeListener(REFRESH_AUTH, handleRefresh);
        }
    }, []);

    useEffect(() => {
        handleGetIdDevice();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                updateAuth: handleUpdateAuth,
                auth,
                refresh: handleRefresh,
                idDevice,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
