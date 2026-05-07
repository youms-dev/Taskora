import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/axios";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        })

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_, session) => {
                setSession(session);

                if (session?.access_token) {
                    api.defaults.headers.common.Authorization = `Bearer ${session.access_token}`;
                }
                else {
                    api.defaults.headers.common.Authorization = "";
                }
            }
        )

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
