import { Container } from "@/components/container";
import { Loader } from "@/components/loader";
import { SplashScreen } from "@/components/spash-screen";
import { DATABASE_NAME, INIT_DATABASE } from "@/config/sql";
import { LANGUAGE_STORAGE } from "@/constants/names";
import { AuthProvider } from "@/hooks/auth-provider";
import { DatabaseProvider } from "@/hooks/database/use-database";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { useLocales } from "expo-localization";
import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../lib/i18n";
import "./global.css";

preventAutoHideAsync();

export default function Layout() {
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<Session["user"] | undefined>(undefined);
    const { colorScheme } = useColorScheme();
    const [locales] = useLocales();
    const { i18n } = useTranslation();
    const [loaded, error] = useFonts({
        "InterVariable": require("../assets/fonts/InterVariable.ttf"),
        "InterVariableItalic": require("../assets/fonts/InterVariable-Italic.ttf"),
        "Magnetob": require("../assets/fonts/magnetob.ttf"),
        "Papyrus": require("../assets/fonts/papyrus.ttf"),
    });
    const [db, setDb] = useState<SQLiteDatabase | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

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
    }, []);

    if (!db) return (
        <SplashScreen />
    )

    return (
        <SafeAreaProvider>
            <DatabaseProvider db={db}>
                <GestureHandlerRootView style={{
                    flex: 1,
                    backgroundColor: colorScheme == "dark" ? "black" : "rgba(0, 0, 0, .1)",
                }}>
                    <ThemeProvider>
                        <ToastProvider>
                            <AuthProvider>
                                {
                                    loading && (
                                        <Container centerX>
                                            <View className="w-full h-full flex justify-center items-center">
                                                <View className="size-[100px]">
                                                    <Loader />
                                                </View>
                                            </View>
                                        </Container>
                                    )
                                }

                                {
                                    !loading && (
                                        <Stack screenOptions={{
                                            headerShown: false,
                                            animation: "fade",
                                            contentStyle: {
                                                backgroundColor: colorScheme == "dark" ? "black" : "rgba(0, 0, 0, .01)"
                                            }
                                        }}>
                                            <Stack.Protected guard={user ? false : true}>
                                                {/* <Stack.Protected guard={true}> */}
                                                <Stack.Screen name="index" />
                                            </Stack.Protected>

                                            <Stack.Protected guard={user ? false : true}>
                                                {/* <Stack.Protected guard={true}> */}
                                                <Stack.Screen
                                                    name="register"
                                                    options={{
                                                        animation: "fade_from_bottom"
                                                    }}
                                                />
                                            </Stack.Protected>

                                            <Stack.Protected guard={user ? true : false}>
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
                    </ThemeProvider>
                </GestureHandlerRootView>
            </DatabaseProvider>
        </SafeAreaProvider>
    )
}