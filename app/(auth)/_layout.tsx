import { Stack } from "expo-router";
import { LayoutComponent } from "@/components/layout";

export default function Layout() {
    return (
        <LayoutComponent>
            <Stack screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: "horizontal",
                animation: "fade_from_bottom",
                animationDuration: 500,
            }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
            </Stack>
        </LayoutComponent>
    )
}