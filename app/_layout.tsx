import { Stack } from "expo-router";
import { LayoutComponent } from "@/components/layout";
import { Container } from "@/components/container";
import { View } from "react-native";
import { Loader } from "@/components/loader";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

export default function Layout() {
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<Session["user"] | undefined>(undefined);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user);
            setLoading(false);
        });

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user);
        });

        return () => data.subscription.unsubscribe();
    }, []);

    return (
        <LayoutComponent>
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
                        gestureEnabled: true,
                        gestureDirection: "horizontal",
                        animation: "slide_from_right",
                        animationDuration: 500,
                    }}>

                        <Stack.Protected guard={user && !user.user_metadata.name ? true : false}>
                            <Stack.Screen name="onboarding" />
                        </Stack.Protected>

                        <Stack.Protected guard={user ? false : true}>
                            <Stack.Screen
                                name="(auth)"
                                options={{
                                    animation: "fade",
                                }}
                            />
                        </Stack.Protected>

                        <Stack.Protected guard={user ? true : false}>
                            <Stack.Screen name="app" />
                        </Stack.Protected>

                        <Stack.Screen
                            name="hardware-auth"
                            options={{
                                animation: "fade",
                            }}
                        />

                        <Stack.Protected guard={user ? true : false}>
                            <Stack.Screen
                                name="[id]"
                                options={{
                                    animation: "slide_from_left",
                                }}
                            />
                        </Stack.Protected>

                    </Stack>
                )
            }
        </LayoutComponent>
    )
}