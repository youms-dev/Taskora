import { SettingsProvider } from "@/hooks/settings/use-settings-data";
import { addNotificationResponseReceivedListener, AndroidImportance, AndroidNotificationPriority, cancelAllScheduledNotificationsAsync, deleteNotificationCategoryAsync, deleteNotificationChannelAsync, getNotificationCategoriesAsync, getNotificationChannelsAsync, NotificationChannelInput, setNotificationCategoryAsync, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

const CONFIG: NotificationChannelInput = {
    name: "Reminders",
    importance: AndroidImportance.HIGH,
    enableVibrate: true,
    showBadge: true,
};

export default function ProtectedLayout() {
    console.log("\n");
    console.log("\n");
    const { t, i18n } = useTranslation();

    const handleNotifs = useCallback(async () => {
        const channels = await getNotificationChannelsAsync();
        const categories = await getNotificationCategoriesAsync();

        await cancelAllScheduledNotificationsAsync();

        console.log("Channels found :", channels.length);
        console.log("Categories found :", categories.length);

        if (channels.length > 0) {
            console.log("Deleting channels ...");

            await deleteNotificationCategoryAsync("reminder");

            await Promise.all(
                channels.map(async (channel) => {
                    await deleteNotificationChannelAsync(channel.id);
                }),
            );

            console.log("Deleting channels done ...");
            const finalChannels = await getNotificationChannelsAsync();

            console.log("Final channels :", finalChannels.length);
        }
        if (categories.length > 0) {
            console.log("Deleting categories ...");

            await Promise.all(
                categories.map(async (cat) => {
                    await deleteNotificationCategoryAsync(cat.identifier);
                }),
            );

            console.log("Deleting categories done ...");
            const finalCategories = await getNotificationCategoriesAsync();

            console.log("Final categories :", finalCategories.length);
        }

        await setNotificationCategoryAsync("reminder", [
            {
                identifier: "SNOOZE",
                buttonTitle: t("layout_(protected)_snooze"),
                options: {
                    opensAppToForeground: false,
                },
            },
            {
                identifier: "DELETE",
                buttonTitle: t("layout_(protected)_delete"),
                options: {
                    opensAppToForeground: false,
                    isDestructive: true,
                },
            },
        ]);

        setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
                priority: AndroidNotificationPriority.HIGH,
            }),
        });

        await setNotificationChannelAsync("reminder_sound01", {
            ...CONFIG,
            sound: "sound01.wav",
        });
        await setNotificationChannelAsync("reminder_sound02", {
            ...CONFIG,
            sound: "sound02.wav",
        });
        await setNotificationChannelAsync("reminder_sound03", {
            ...CONFIG,
            sound: "sound03.wav",
        });
        await setNotificationChannelAsync("reminder_sound04", {
            ...CONFIG,
            sound: "sound04.wav",
        });
    }, [i18n.language]);

    useEffect(() => {
        handleNotifs();
    }, [handleNotifs]);

    useEffect(() => {
        const { remove } = addNotificationResponseReceivedListener((response) => {
            const identifier = response.actionIdentifier;

            console.log("Identifier :", identifier);
        });

        return () => remove();
    }, []);

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