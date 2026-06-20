import { Stack } from "expo-router";

export default function UserLayout() {
    return (
        <Stack
            initialRouteName="profile"
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen name="profile" />
        </Stack>
    );
}