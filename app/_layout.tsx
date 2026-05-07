import { Container } from "@/components/container";
import { Loader } from "@/components/loader";
import { AuthProvider } from "@/hooks/auth-provider";
import { ThemeProvider } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../lib/i18n";
import "./global.css";

export default function Layout() {
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<Session["user"] | undefined>(undefined);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView>
                <ThemeProvider>
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
                                }}>
                                    <Stack.Protected guard={user ? false : true}>
                                        <Stack.Screen name="index" />
                                    </Stack.Protected>

                                    <Stack.Protected guard={user ? false : true}>
                                        <Stack.Screen name="register" />
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
                </ThemeProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    )
}