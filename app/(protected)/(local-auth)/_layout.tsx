import { Stack } from "expo-router";

export default function LocalAuthLayout() {
    return (
        <Stack
            initialRouteName="lock-screen"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="lock-screen" />
        </Stack>
    );
}