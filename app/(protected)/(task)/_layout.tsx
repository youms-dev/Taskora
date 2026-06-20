import { Stack } from "expo-router";

export default function UserLayout() {
    return (
        <Stack
            initialRouteName="archives"
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen name="[id]" />

            <Stack.Screen name="archives" />
        </Stack>
    );
}