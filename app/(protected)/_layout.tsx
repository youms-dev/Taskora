import { Stack } from "expo-router";

export default function ProtectedLayout() {
    return (
        <Stack
            initialRouteName="(tabs)"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="(local-auth)" />

            <Stack.Screen name="(user)" />

            <Stack.Screen name="(task)" />
        </Stack>
    );
}