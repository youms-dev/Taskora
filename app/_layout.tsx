import { SplashScreen as SplashScreenComponent } from "@/components/spash-screen";
import { DATABASE_NAME, INIT_DATABASE } from "@/config/sql";
import { ATTEMPTS_STORAGE, LANGUAGE_STORAGE } from "@/constants/async-storage";
import { LOGOUT, REFRESH_AUTH } from "@/constants/emitters";
import { AUTH_STORE, DEVICE_STORE, LOCAL_AUTH_ATTEMPTS_STORE, LOCAL_AUTH_STORE } from "@/constants/secure-store";
import { AuthProvider } from "@/hooks/auth-provider";
import { DatabaseProvider } from "@/hooks/database/use-database";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";
import { emitter } from "@/lib/event-emitter";
import { AuthType } from "@/types/auth";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as BackgroundTask from "expo-background-task";
import { useLocales } from "expo-localization";
import { Stack, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../config/task-manager";
import "../lib/i18n";
import "./global.css";
import { api } from "@/lib/axios";
import { LocalAuthProvider } from "@/hooks/local-auth/use-local-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import * as ScreenCapture from "expo-screen-capture";

SplashScreen.setOptions({
    fade: true,
});
SplashScreen.preventAutoHideAsync();

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
});

export default function Layout() {
    const [loading, setLoading] = useState<boolean>(false);
    const [auth, setAuth] = useState<AuthType | null>(null);
    const { colorScheme } = useColorScheme();
    const [locales] = useLocales();
    const { i18n } = useTranslation();
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const authRef = useRef<typeof auth>(null);
    const pathname = usePathname();

    useEffect(() => {
        (async () => {
            const { getItem } = useAsyncStorage(LANGUAGE_STORAGE);
            const value = await getItem();
            const lng = locales.languageTag.trim().split("-").shift()?.toLowerCase() ?? "en";

            if (value) i18n.changeLanguage(value.toLowerCase());
            else i18n.changeLanguage(lng);
        })();
    }, []);

    const openDatabase = useCallback(async () => {
        if (!db) {
            const database = await openDatabaseAsync(DATABASE_NAME);

            setDb(database);
            await database.execAsync(INIT_DATABASE);
            await SplashScreen.hideAsync();
        }
    }, [db]);

    useEffect(() => {
        openDatabase();
    }, [openDatabase]);

    const deleteAttempts = useCallback(async () => {
        const { removeItem } = useAsyncStorage(ATTEMPTS_STORAGE);

        await removeItem();
    }, []);

    useEffect(() => {
        authRef.current = auth;
    }, [auth]);

    useEffect(() => {
        deleteAttempts();
    }, []);

    const handleGetAuth = useCallback(async () => {
        try {
            !authRef.current && setLoading(true);
            const authData = await SecureStore.getItemAsync(AUTH_STORE);
            let authFormatted: AuthType | null = null;

            if (authData) {
                authFormatted = JSON.parse(authData) as AuthType;
                setAuth(authFormatted);
            }
            else {
                setAuth(null);
            }
        }
        catch { }
        finally {
            setLoading(false);
        }
    }, []);

    const handleLogout = useCallback(async () => {
        if (!authRef.current) return;
        const currentAuth = authRef.current;

        setAuth(null);

        await SecureStore.deleteItemAsync(AUTH_STORE);
        await SecureStore.deleteItemAsync(LOCAL_AUTH_STORE);
        await SecureStore.deleteItemAsync(LOCAL_AUTH_ATTEMPTS_STORE);

        await deleteAttempts();

        await ScreenCapture.allowScreenCaptureAsync();

        try {
            const idDevice = await SecureStore.getItemAsync(DEVICE_STORE);

            await api.post("/auth/logout", {
                idDevice,
                idUser: currentAuth.user.id,
            });
        }
        catch { }
    }, []);

    useEffect(() => {
        handleGetAuth();
    }, []);

    useEffect(() => {
        emitter.addListener(REFRESH_AUTH, handleGetAuth);
        emitter.addListener(LOGOUT, handleLogout);

        return () => {
            emitter.removeAllListeners(REFRESH_AUTH);
            emitter.removeAllListeners(LOGOUT);
        }
    }, []);

    // useEffect(() => {
    //     const { remove } = AppState.addEventListener("change", async (state) => {
    //         if (state == "background") {
    //             console.log("We're in background");
    //             await BackgroundTask.triggerTaskWorkerForTestingAsync();
    //         }
    //     });

    //     () => remove();
    // }, []);

    if (!db || loading) return (
        <SplashScreenComponent />
    )

    return (
        <SafeAreaProvider>
            <KeyboardProvider>
                <ThemeProvider>
                    <DatabaseProvider db={db}>
                        <LocalAuthProvider>
                            <GestureHandlerRootView style={{
                                flex: 1,
                                backgroundColor: colorScheme == "dark" ? "black" : "white"
                            }}>
                                <ToastProvider>
                                    <AuthProvider
                                        auth={auth}
                                        refresh={handleGetAuth}
                                    >
                                        <Stack
                                            screenOptions={{
                                                headerShown: false,
                                                animation: "fade",
                                                contentStyle: {
                                                    backgroundColor: colorScheme == "dark" ? "black" : "rgba(0, 0, 0, .05)"
                                                }
                                            }}
                                        >
                                            <Stack.Protected guard={!auth}>
                                                <Stack.Screen name="index" />
                                            </Stack.Protected>

                                            <Stack.Protected guard={!auth}>
                                                <Stack.Screen
                                                    name="register"
                                                    options={{
                                                        animation: "fade_from_bottom"
                                                    }}
                                                />
                                            </Stack.Protected>

                                            <Stack.Protected guard={!!auth}>
                                                <Stack.Screen
                                                    name="(protected)"
                                                    options={{
                                                        animation: "fade",
                                                    }}
                                                />
                                            </Stack.Protected>

                                            <Stack.Protected guard={false}>
                                                <Stack.Screen name="onboarding" />
                                            </Stack.Protected>

                                            <Stack.Screen name="reset-password" />
                                        </Stack>
                                    </AuthProvider>
                                </ToastProvider>
                            </GestureHandlerRootView>
                        </LocalAuthProvider>
                    </DatabaseProvider>
                </ThemeProvider>
            </KeyboardProvider>
        </SafeAreaProvider>
    )
}