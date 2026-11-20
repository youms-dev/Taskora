import { AUTH_STORE } from "@/constants/secure-store";
import { AuthType } from "@/types/auth";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";

type AuthContextType = {
    user: Omit<AuthType, "accessToken" | "refreshToken"> | null;
    loading: boolean;
    getUser: () => void;
    updatePhoto: (value: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    getUser: () => { },
    updatePhoto: () => { },
});

interface Props {
    children: ReactNode;
    user: AuthContextType["user"] | null;
}

export const AuthProvider = ({ children, user: entryUser }: Props) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthContextType["user"] | null>(entryUser);

    const handleGetUser = useCallback(async () => {
        setLoading(true);

        const data = await SecureStore.getItemAsync(AUTH_STORE);

        if (data) {
            const { accessToken, refreshToken, ...rest } = JSON.parse(data) as AuthType;

            setUser({ ...rest });
        }

        setLoading(false);
    }, []);

    const handleUpdatePhoto = useCallback(async (photo: string | null) => {
        if (!user) return;
        setLoading(true);

        await SecureStore.setItemAsync(AUTH_STORE, JSON.stringify({
            ...user,
            photo,
        }));

        setUser({
            ...user,
            photo,
        });

        setLoading(false);
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                getUser: handleGetUser,
                updatePhoto: handleUpdatePhoto,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
