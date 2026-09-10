import { EVENTS_CHANNEL_ID, TASKS_CHANNEL_ID } from "@/constants/notification";
import { AndroidAudioContentType, AndroidAudioUsage, AndroidImportance, AndroidNotificationPriority, AndroidNotificationVisibility, deleteNotificationChannelAsync, getNotificationChannelAsync, getNotificationChannelsAsync, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";

export default function ProtectedLayout() {
    console.log("\n");
    console.log("\n");

    const handleNotifs = useCallback(async () => {
        const channels = await getNotificationChannelsAsync();

        if (channels.length > 0) {
            console.log("Channels found :", channels.length);
            
            channels.forEach(async (channel) => {
                await deleteNotificationChannelAsync(channel.id);
            });
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

        await setNotificationChannelAsync(TASKS_CHANNEL_ID, {
            name: "Reminders",
            importance: AndroidImportance.HIGH,
            sound: "sound01.wav",
            // sound: "default",
            enableVibrate: true,
            showBadge: true,
            audioAttributes: {
                usage: AndroidAudioUsage.NOTIFICATION,
                contentType: AndroidAudioContentType.SONIFICATION,
            }

            // vibrationPattern: [0, 250, 250, 250],
        });

        await setNotificationChannelAsync(EVENTS_CHANNEL_ID, {
            name: "Events",
            importance: AndroidImportance.HIGH,
            sound: "sound02.wav"
        });
    }, []);

    useEffect(() => {
        handleNotifs();
    }, [handleNotifs]);

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