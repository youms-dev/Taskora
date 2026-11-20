import { AUTH_STORE } from "@/constants/secure-store";
import { AuthType } from "@/types/auth";
import { UserType } from "@/types/database/user";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useUsers } from "./database/use-users";

type AuthContextType = {
    user: UserType | null;
    loading: boolean;
    getUser: () => void;
    updatePhoto: (value: string | null) => void;
    auth: Omit<AuthType, "accessToken" | "refreshToken"> | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    getUser: () => { },
    updatePhoto: () => { },
    auth: null,
});

interface Props {
    children: ReactNode;
    auth: AuthContextType["auth"] | null;
    refresh: () => void;
}

export const AuthProvider = ({ children, auth, refresh }: Props) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthContextType["user"] | null>(null);
    const { getUser, updateUserPhoto } = useUsers();

    const handleGetUser = useCallback(async () => {
        if (!auth) return;

        try {
            setLoading(true);

            const data = await getUser(auth.email) as typeof user;

            setUser(data);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            setLoading(false);
        }
    }, [auth]);

    const handleUpdatePhoto = useCallback(async (photo: string | null) => {
        if (!auth || !user) return;
        setLoading(true);

        await updateUserPhoto(user.email, photo);

        await SecureStore.setItemAsync(AUTH_STORE, JSON.stringify({
            ...auth,
            photo,
        }));

        setUser({
            ...user,
            photo,
        });

        refresh();

        setLoading(false);
    }, [user, auth, refresh]);

    useEffect(() => {
        handleGetUser();
    }, [handleGetUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                getUser: handleGetUser,
                updatePhoto: handleUpdatePhoto,
                auth,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
