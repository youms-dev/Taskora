import { Stack } from "expo-router";

export default function UserLayout() {
    return (
        <Stack
            initialRouteName="profile"
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen name="profile" />

            <Stack.Screen name="sessions" />

            <Stack.Screen
                name="update-email"
                options={{
                    animation: "fade",
                }}
            />
        </Stack>
    );
}