import { Stack } from "expo-router";

export default function LocalAuthLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="index" />

            <Stack.Screen
                name="create"
                options={{
                    animation: "fade",
                }}
            />
        </Stack>
    );
}