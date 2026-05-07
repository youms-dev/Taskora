import { Container } from "@/components/container";
import { Message, MessageProps } from "@/components/message";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { ThemeCard } from "@/components/theme-card";
import { Toggle } from "@/components/toggle";
import { COLORS } from "@/constants/colors";
import { AUTH_STORAGE, CONFIRM_STORAGE, THEME_STORAGE } from "@/constants/names";
import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import clsx from "clsx";
import { hasHardwareAsync, isEnrolledAsync } from "expo-local-authentication";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";

export default function Settings() {
    const { theme, target, setTheme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState<string>("");
    const [auth, setAuth] = useState<{
        exists: boolean;
        active: boolean;
    }>({
        exists: false,
        active: false,
    });
    const [message, setMessage] = useState<MessageProps>({
        show: false,
        message: "",
        action: () => { },
        onCancel: () => { },
    });
    const [confirm, setConfirm] = useState<boolean>(false);
    const { user, loading } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        (async () => {
            const { getItem } = useAsyncStorage(THEME_STORAGE);
            const { getItem: getLocalAuth } = useAsyncStorage(AUTH_STORAGE);
            const themeSaved = await getItem();
            const hasHardware = await hasHardwareAsync();
            const isEnrolled = await isEnrolledAsync();
            const saveValue = await getLocalAuth();
            const { getItem: confirmItem } = useAsyncStorage(CONFIRM_STORAGE);
            const exists = await confirmItem();

            if (themeSaved && ["light", "dark", "system"].includes(themeSaved)) {
                if (themeSaved == "light") setCurrentTheme("Clair");
                else if (themeSaved == "dark") setCurrentTheme("Sombre");
                else setCurrentTheme("Système");
            }

            if (hasHardware && isEnrolled) {
                setAuth({
                    ...auth,
                    exists: true,
                });

                if (saveValue) {
                    setAuth({
                        exists: true,
                        active: true
                    });
                }
            }

            if (exists != null) {
                setConfirm(true);
            }
            else {
                setConfirm(false);
            }
        })();
    }, [auth.active, confirm]);

    const handleLocalAuthToggle = async () => {
        const { setItem, removeItem } = useAsyncStorage(AUTH_STORAGE);

        if (auth.active) {
            await removeItem();
            setAuth({
                ...auth,
                active: false,
            });
        }
        else {
            setAuth({
                ...auth,
                active: true,
            });
            await setItem(JSON.stringify({
                verified: false,
            }));
        }
    }

    const handleSignOut = async () => {
        const { getItem, setItem } = useAsyncStorage(AUTH_STORAGE);
        const exists = await getItem();

        if (exists != null) {
            await setItem(JSON.stringify({
                verified: false
            }));
        }
        supabase.auth.signOut();
    }

    const handleConfirmToggle = async () => {
        const { setItem, removeItem } = useAsyncStorage(CONFIRM_STORAGE);

        if (confirm) {
            await removeItem();
            setConfirm(false);
        }
        else {
            await setItem("true");
            setConfirm(true);
        }
    }

    return (
        <Container centerX>
            <PageTitle
                title={t("settings")}
                icon={(
                    <FontAwesome6
                        name="gears"
                        size={25}
                        color={COLORS.emerald[500]}
                    />
                )}
            />

            <ScrollView
                horizontal={false}
                contentContainerClassName="w-full flex flex-col items-center pb-[100px]"
                className="w-full"
            >
                <View className="w-[97%] flex flex-col mt-8 dark:bg-white/10 bg-black/10 p-3 rounded-2xl">
                    <View className="flex flex-row items-center gap-3">
                        <Text className="dark:text-white text-black text-xl">Thème : </Text>
                        <Text className="text-emerald-500 text-xl font-extrabold tracking-[2px]">
                            {currentTheme}
                        </Text>
                    </View>

                    <View className="w-full pb-10 flex flex-row flex-wrap items-center gap-[30px_8px]">
                        <PressableAnimated onPress={() => setTheme("light")}>
                            <Animated.View className="size-[110px] flex flex-col items-center gap-2 p-3">
                                <View className="w-full flex flex-row">
                                    <View className={clsx(
                                        "size-8 flex flex-row justify-center items-center p-[5px] dark:bg-white/20 bg-black/20 dark:border-0 border-2 border-white/20 rounded-[50px]"
                                    )}>
                                        {
                                            target == "light" && (
                                                <View
                                                    style={{ borderRadius: 50 }}
                                                    className="size-full bg-emerald-500"
                                                />
                                            )
                                        }
                                    </View>
                                </View>
                                <ThemeCard value="light" />
                            </Animated.View>
                        </PressableAnimated>

                        <PressableAnimated onPress={() => setTheme("dark")}>
                            <Animated.View className="size-[110px] flex flex-col items-center gap-2 p-3">
                                <View className="w-full flex flex-row">
                                    <View className={clsx(
                                        "size-8 flex flex-row justify-center items-center p-[5px] dark:bg-white/20 bg-black/20 dark:border-0 border-2 border-white/20 rounded-[50px]"
                                    )}>
                                        {
                                            target == "dark" && (
                                                <View
                                                    style={{ borderRadius: 50 }}
                                                    className="size-full bg-emerald-500"
                                                />
                                            )
                                        }
                                    </View>
                                </View>
                                <ThemeCard value="dark" />
                            </Animated.View>
                        </PressableAnimated>

                        <PressableAnimated onPress={() => setTheme("system")}>
                            <Animated.View className="size-[110px] flex flex-col items-center gap-2 p-3">
                                <View className="w-full flex flex-row">
                                    <View className={clsx(
                                        "size-8 flex flex-row justify-center items-center p-[5px] dark:bg-white/20 bg-black/20 dark:border-0 border-2 border-white/20 rounded-[50px]"
                                    )}>
                                        {
                                            target == "system" && (
                                                <View
                                                    style={{ borderRadius: 50 }}
                                                    className="size-full bg-emerald-500"
                                                />
                                            )
                                        }
                                    </View>
                                </View>
                                <ThemeCard value="system" />
                            </Animated.View>
                        </PressableAnimated>
                    </View>
                </View>

                <View className="w-[97%] flex flex-col gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <View className="w-full flex flex-row items-center gap-3 overflow-hidden">
                        <View className="flex flex-row items-center gap-3">
                            <FontAwesome6
                                name="user-large"
                                size={20}
                                color={theme == "dark" ? "white" : "black"}
                            />
                            <Text className="w-max dark:text-white text-black text-xl">Nom :</Text>
                        </View>
                        {
                            loading && (
                                <View className="w-[220px] h-[30px]">
                                    <Skeleton />
                                </View>
                            )
                        }
                        {
                            !loading && (
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    className="w-3/4 text-emerald-500 text-xl tracking-widest font-bold"
                                >
                                    {user?.user_metadata.name}
                                </Text>
                            )
                        }
                    </View>
                </View>

                <View className="w-[97%] flex flex-col gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <View className="w-full flex flex-row items-center gap-3 overflow-hidden">
                        <View className="flex flex-row items-center gap-3">
                            <FontAwesome5 name="envelope-open-text" size={20} color={theme == "dark" ? "white" : "black"} />
                            <Text className="w-max dark:text-white text-black text-xl">Email :</Text>
                        </View>
                        {
                            loading && (
                                <View className="w-[220px] h-[30px]">
                                    <Skeleton />
                                </View>
                            )
                        }
                        {
                            !loading && (
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    className="w-3/4 text-emerald-500 text-xl tracking-widest font-bold"
                                >
                                    {user?.email}
                                </Text>
                            )
                        }
                    </View>
                </View>

                {
                    auth.exists && (
                        <View className="w-[97%] flex flex-row flex-wrap justify-between gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                            <Text className="text-xl dark:text-white text-black">Verrouillage de l'app</Text>
                            <Toggle
                                active={auth.active}
                                onChange={() => handleLocalAuthToggle()}
                            />
                        </View>
                    )
                }

                <View className="w-[97%] flex flex-row flex-wrap justify-between gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <Text className="text-xl dark:text-white text-black">Confirmation avant suppression</Text>
                    <Toggle
                        active={confirm}
                        onChange={() => handleConfirmToggle()}
                    />
                </View>

                <View className="w-[97%] flex flex-col gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <PressableAnimated
                        onPress={() => setMessage({
                            show: true,
                            message: "Êtes-vous sûr de vouloir vous déconnecter ?",
                            bottom: 90,
                            onCancel: () => setMessage({
                                ...message,
                                show: false,
                            }),
                            action: () => handleSignOut(),
                        })}
                        className="flex flex-row items-center self-start shrink gap-3"
                    >
                        <FontAwesome5 name="sign-out-alt" size={20} color="red" />
                        <Text className="w-max text-red-500 text-xl">Déconnexion</Text>
                    </PressableAnimated>
                </View>
            </ScrollView>

            <Message
                show={message.show}
                message={message.message}
                bottom={message.bottom}
                onCancel={() => message.onCancel()}
                action={() => message.action()}
            />
        </Container>
    );
}