import { Container } from "@/components/container";
import { Loader } from "@/components/loader";
import { AuthProvider } from "@/hooks/auth-provider";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../lib/i18n";
import "./global.css";

export default function Layout() {
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<Session["user"] | undefined>(undefined);
    const { colorScheme } = useColorScheme();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SafeAreaProvider>
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
        </SafeAreaProvider>
    )
}