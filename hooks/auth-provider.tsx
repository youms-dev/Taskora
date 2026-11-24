import { AUTH_STORE } from "@/constants/secure-store";
import { AuthType } from "@/types/auth";
import { UserType } from "@/types/database/user";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useUsers } from "./database/use-users";

type AuthContextType = {
    user: UserType | null;
    loading: boolean;
    updateAuth: (value: string | null, target: "photo" | "name" | "email") => void;
    auth: AuthType | null;
    refresh: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    updateAuth: () => { },
    auth: null,
    refresh: () => { },
});

interface Props {
    children: ReactNode;
    auth: AuthContextType["auth"] | null;
    refresh: () => Promise<void>;
}

export const AuthProvider = ({ children, auth, refresh }: Props) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthContextType["user"] | null>(null);
    const { getUser, updateUser } = useUsers();

    const handleGetUser = useCallback(async () => {
        if (!auth) return;
        try {
            setLoading(true);

            const data = await getUser(auth.user.email) as typeof user;

            setUser(data);
        }
        finally {
            setLoading(false);
        }
    }, [auth]);

    const handleUpdateAuth = useCallback(async (value: string | null, target: "photo" | "email" | "name") => {
        if (!auth || !user) return;
        try {
            setLoading(true);

            await updateUser(value, user.idUser, target);

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

            await refresh();
            handleGetUser();
        }
        finally {
            setLoading(false);
        }
    }, [user, auth, refresh, handleGetUser]);

    useEffect(() => {
        handleGetUser();
    }, [handleGetUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                updateAuth: handleUpdateAuth,
                auth,
                refresh: async () => {
                    await refresh();
                    handleGetUser();
                },
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
