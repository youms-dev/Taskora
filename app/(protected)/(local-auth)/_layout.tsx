import { AttemptsProvider } from "@/hooks/local-auth/use-attempts";
import { Stack } from "expo-router";

export default function LocalAuthLayout() {
    return (
        <AttemptsProvider>
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
        </AttemptsProvider>
    );
}