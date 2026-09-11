import { SettingsProvider } from "@/hooks/settings/use-settings-data";
import { AndroidImportance, AndroidNotificationPriority, cancelAllScheduledNotificationsAsync, deleteNotificationChannelAsync, getNotificationChannelsAsync, NotificationChannelInput, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";

const CONFIG: NotificationChannelInput = {
    name: "Reminders",
    importance: AndroidImportance.HIGH,
    sound: "sound02.wav",
    // sound: "default",
    enableVibrate: true,
    showBadge: true,
};

export default function ProtectedLayout() {
    console.log("\n");
    console.log("\n");

    const handleNotifs = useCallback(async () => {
        const channels = await getNotificationChannelsAsync();

        await cancelAllScheduledNotificationsAsync();

        console.log("Channels found :", channels.length);

        if (channels.length > 0) {
            console.log("Deleting ...");

            await Promise.all(
                channels.map(async (channel) => {
                    await deleteNotificationChannelAsync(channel.id);
                }),
            );

            console.log("Deleting done ...");
            const finalChannels = await getNotificationChannelsAsync();

            console.log("Final channels :", finalChannels.length);
        }

        setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
                priority: AndroidNotificationPriority.HIGH,
            }),
        });

        await setNotificationChannelAsync("reminder_sound01", CONFIG);
        await setNotificationChannelAsync("reminder_sound02", CONFIG);
        await setNotificationChannelAsync("reminder_sound03", CONFIG);
        await setNotificationChannelAsync("reminder_sound04", CONFIG);
    }, []);

    useEffect(() => {
        // handleNotifs();
    }, [handleNotifs]);

    return (
        <SettingsProvider>
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
        </SettingsProvider>
    );
}