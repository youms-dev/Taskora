import { SplashScreen } from "@/components/spash-screen";
import { DATABASE_NAME, INIT_DATABASE } from "@/config/sql";
import { LANGUAGE_STORAGE } from "@/constants/async-storage";
import { AUTH_STORE } from "@/constants/secure-store";
import { AuthProvider } from "@/hooks/auth-provider";
import { DatabaseProvider } from "@/hooks/database/use-database";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";
import { AuthType } from "@/types/auth";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as BackgroundTask from "expo-background-task";
import { useLocales } from "expo-localization";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../config/task-manager";
import "../lib/i18n";
import "./global.css";

preventAutoHideAsync();

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

    useEffect(() => {
        (async () => {
            const { getItem } = useAsyncStorage(LANGUAGE_STORAGE);
            const value = await getItem();
            const lng = locales.languageTag.trim().split("-").shift()?.toLowerCase() ?? "en";

            if (value) i18n.changeLanguage(value.toLowerCase());
            else i18n.changeLanguage(lng);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (!db) {
                const database = await openDatabaseAsync(DATABASE_NAME);

                setDb(database);
                await database.execAsync(INIT_DATABASE);
                await hideAsync();
            }
        })();
    }, [db]);

    const handleGetAuth = useCallback(async () => {
        try {
            !auth && setLoading(true);
            const authData = await SecureStore.getItemAsync(AUTH_STORE);
            let authFormatted: AuthType | null = null;

            if (authData) {
                authFormatted = JSON.parse(authData);
            }

            console.log("Auth user :", authFormatted);
            setAuth(authFormatted);
        }
        catch { }
        finally {
            setLoading(false);
        }
    }, [auth]);

    useEffect(() => {
        // handleGetAuth();
    }, []);

    useEffect(() => {
        const { remove } = AppState.addEventListener("change", async (state) => {
            if (state == "background") {
                console.log("We're in background");
                await BackgroundTask.triggerTaskWorkerForTestingAsync();
            }
        });

        () => remove();
    }, []);

    if (!db || loading) return (
        <SplashScreen />
    )

    return (
        <SafeAreaProvider>
            <KeyboardProvider>
                <ThemeProvider>
                    <DatabaseProvider db={db}>
                        <GestureHandlerRootView style={{
                            flex: 1,
                            backgroundColor: colorScheme == "dark" ? "black" : "white"
                        }}>
                            <ToastProvider>
                                <AuthProvider>
                                    {
                                        !loading && (
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
                                            </Stack>
                                        )
                                    }
                                </AuthProvider>
                            </ToastProvider>
                        </GestureHandlerRootView>
                    </DatabaseProvider>
                </ThemeProvider>
            </KeyboardProvider>
        </SafeAreaProvider >
    )
}