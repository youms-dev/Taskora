import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Radio } from "@/components/radio";
import { Select } from "@/components/select";
import { TextAnimated } from "@/components/text-animated";
import { TextGradient } from "@/components/text-gradient";
import { ThemeCard } from "@/components/theme-card";
import { Toggle } from "@/components/toggle";
import { COLORS } from "@/constants/colors";
import { APP_NAME, CONFIRM_STORAGE, LANGUAGE_STORAGE } from "@/constants/names";
import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { FontAwesome, Octicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useLocales } from "expo-localization";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { theme, target, setTheme } = useTheme();
    const [confirm, setConfirm] = useState<boolean>(false);
    const { user, loading } = useAuth();
    const scrollY = useSharedValue(0);
    const headerHeight = 250;
    const minHeaderHeight = 100;
    const appTheme = useSharedValue<typeof theme>(theme);
    const [change, setChange] = useState<boolean>(false);
    const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
    const [locales] = useLocales();
    const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: ((e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }),
    });

    const headerContainerAnimation = useAnimatedStyle(() => ({
        height: interpolate(
            scrollY.value,
            [0, headerHeight - minHeaderHeight],
            [headerHeight, minHeaderHeight],
            Extrapolation.CLAMP,
        ),
    }));

    const avatarAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, 150],
                    [20, -100],
                    Extrapolation.CLAMP
                ),
            },
            {
                scale: interpolate(
                    scrollY.value,
                    [0, 80],
                    [1, 0.2],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    const usernameAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, 100],
            [1, 0],
            Extrapolation.CLAMP
        ),
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, 100],
                    [-5, -50],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    const handleConfirmToggle = useCallback(async () => {
        const { setItem, removeItem } =
            useAsyncStorage(CONFIRM_STORAGE);

        if (confirm) {
            await removeItem();
            setConfirm(false);
        }
        else {
            await setItem("true");
            setConfirm(true);
        }
    }, [confirm]);

    useEffect(() => {
        appTheme.value = theme;
    }, [theme]);

    const titleAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, (headerHeight - minHeaderHeight) * .8],
                    [headerHeight + minHeaderHeight, 0],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: interpolate(
            scrollY.value,
            [0, headerHeight - minHeaderHeight],
            [0, 1],
            Extrapolation.CLAMP,
        ),
        zIndex: scrollY.value >= (headerHeight - minHeaderHeight) ? 1 : -100,
    }));

    const changeLanguage = async (value: string | null) => {
        if (currentLanguage == value) return;

        const { setItem, removeItem } = useAsyncStorage(LANGUAGE_STORAGE);
        const lng = locales.languageTag.trim().split("-").shift()?.toLowerCase() ?? "en";

        if (value) {
            i18n.changeLanguage(value);
            setCurrentLanguage(value);
            await setItem(value);
            return;
        };

        i18n.changeLanguage(lng);
        setCurrentLanguage(null);
        await removeItem();
    }

    useEffect(() => {
        (async () => {
            const { getItem } = useAsyncStorage(LANGUAGE_STORAGE);
            const value = await getItem();

            if (value) setCurrentLanguage(value);
        })();
    }, []);

    const onMomentumScrollEnd = useAnimatedProps(() => ({
        onMomentumScrollEnd: () => {
            if (scrollY.value >= (headerHeight - minHeaderHeight) * .6) {
                scheduleOnRN(setChange, true);
            }
            else {
                scheduleOnRN(setChange, false);
            }

            if (scrollY.value > 0 && scrollY.value < Math.round((headerHeight - minHeaderHeight) / 2)) {
                scheduleOnRN(setChange, false);
                scrollViewRef.current?.scrollTo({
                    y: 0,
                });
            }
            else if (scrollY.value > 0 && scrollY.value < Math.round(headerHeight - minHeaderHeight)) {
                scheduleOnRN(setChange, true);
                scrollViewRef.current?.scrollTo({
                    y: headerHeight - minHeaderHeight,
                });
            }
        }
    }));

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, (headerHeight - minHeaderHeight)],
            [1, 0],
            Extrapolation.CLAMP,
        )
    }));

    return (
        <Container
            safeArea={false}
            statusBarColor={change ? (theme == "dark" ? "light" : "dark") : "light"}
        >

            <View className="flex-1 dark:bg-black bg-white/10">
                <Animated.View
                    style={headerContainerAnimation}
                    className="absolute top-0 left-0 w-full z-[100] overflow-hidden"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .6)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .7, 1]}
                        className="w-full"
                    >
                        <LinearGradient
                            colors={theme == "dark" ?
                                ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .6)", "rgba(0, 0, 0, 0)"]
                                :
                                ["rgba(255, 255, 255, .04)", "rgba(255, 255, 255, .04)", "rgba(255, 255, 255, 0)"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, .7, 1]}
                            className="w-full h-full"
                        >
                            <Animated.View
                                style={opacityAnimation}
                                className="absolute w-full h-full dark:bg-black bg-white"
                            >
                                <Animated.View
                                    style={opacityAnimation}
                                    className="size-full dark:bg-white/10 bg-black/80"
                                />
                            </Animated.View>

                            <Animated.View className="w-full h-full flex justify-center items-center gap-12 overflow-hidden z-[1]">
                                <Animated.View style={avatarAnimation}>
                                    <View
                                        style={{
                                            transform: [
                                                {
                                                    translateY: 8,
                                                }
                                            ],
                                            filter: "blur(5px)",
                                        }}
                                        className="absolute size-[130px] dark:bg-black/60 bg-black/40 rounded-full"
                                    />
                                    <View className="z-[1]">
                                        <Avatar
                                            size={130}
                                            name="Youmbi Le-duc"
                                        />
                                    </View>
                                </Animated.View>

                                <Animated.View style={usernameAnimation}>
                                    <View className="w-full flex items-center">
                                        <TextAnimated
                                            dark="rgba(255, 255, 255, .8)"
                                            light="rgba(255, 255, 255, .8)"
                                            className="text-lg font-bold tracking-widest"
                                        >
                                            Youmbi Le-duc
                                        </TextAnimated>
                                    </View>
                                </Animated.View>

                                <Animated.View
                                    style={titleAnimation}
                                    className="absolute left-0 top-0 w-full h-full flex justify-center items-center pt-8"
                                >
                                    <PageTitle>
                                        <View className="w-full flex flex-row items-center gap-2 overflow-hidden">
                                            <FontAwesome6
                                                name="gears"
                                                size={25}
                                                color={COLORS.emerald[500]}
                                            />
                                            <Text className="text-xl text-emerald-500 font-bold">
                                                {t("settings")}
                                            </Text>
                                        </View>
                                    </PageTitle>
                                </Animated.View>
                            </Animated.View>
                        </LinearGradient>
                    </LinearGradient>
                </Animated.View>

                <Animated.ScrollView
                    ref={scrollViewRef}
                    onScroll={scrollHandler}
                    animatedProps={onMomentumScrollEnd}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{
                        paddingTop: headerHeight + 10,
                    }}
                    contentContainerClassName="pb-[300px] px-3"
                >

                    {/* Appearance */}

                    <View className="w-full flex flex-col gap-3">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_appearance")}
                            </TextAnimated>
                        </View>

                        <View className="dark:bg-white/10 bg-white/80 rounded-2xl p-3">
                            <View className="flex flex-row items-center gap-3">
                                <MaterialCommunityIcons
                                    name="invert-colors"
                                    size={25}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                />

                                <TextAnimated className="text-lg">
                                    {t("theme")} :
                                </TextAnimated>

                                <Text className="text-lg font-extrabold tracking-[2px] text-emerald-500 lowercase">
                                    {(() => {
                                        if (target == "system") return t("settings_system");
                                        else if (target == "dark") return t("settings_dark");
                                        return t("settings_light");
                                    })()}
                                </Text>
                            </View>

                            <ScrollView
                                horizontal
                                nestedScrollEnabled
                                showsHorizontalScrollIndicator={false}
                                className="w-full"
                                contentContainerClassName="flex flex-row items-center gap-2"
                            >
                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => setTheme("light")}
                                    className="size-[110px] flex flex-col self-start items-center gap-2 p-3 mb-10"
                                >
                                    <View className="w-full">
                                        <Radio
                                            size={24}
                                            active={target == "light"}
                                        />
                                    </View>

                                    <ThemeCard value="light" />
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => setTheme("dark")}
                                    className="size-[110px] flex flex-col self-start items-center gap-2 p-3 mb-10"
                                >
                                    <View className="w-full">
                                        <Radio
                                            size={24}
                                            active={target == "dark"}
                                        />
                                    </View>

                                    <ThemeCard value="dark" />
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => setTheme("system")}
                                    className="size-[110px] flex flex-col self-start items-center gap-2 p-3 mb-10"
                                >
                                    <View className="w-full">
                                        <Radio
                                            size={24}
                                            active={target == "system"}
                                        />
                                    </View>

                                    <ThemeCard value="system" />
                                </PressableAnimated>
                            </ScrollView>
                        </View>
                    </View>

                    {/* System */}

                    <View className="w-full flex flex-col gap-3 mt-6">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_system")}
                            </TextAnimated>
                        </View>

                        <View className="w-full flex items-center gap-8 dark:bg-white/10 bg-white/80 p-5 rounded-2xl">
                            <Select
                                open
                                header={(
                                    <View className="w-full flex flex-row items-center gap-6">
                                        <Entypo
                                            name="language"
                                            size={20}
                                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                        />
                                        <TextAnimated className="text-lg">
                                            {t("settings_language")}
                                        </TextAnimated>
                                    </View>
                                )}
                            >
                                <View className="w-full flex items-center gap-5 py-2 px-5">
                                    <PressableAnimated
                                        scale={.98}
                                        onPress={() => changeLanguage("fr")}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_french")}
                                        </TextAnimated>

                                        <Radio
                                            size={24}
                                            active={currentLanguage == "fr"}
                                        />
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={.98}
                                        onPress={() => changeLanguage("en")}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_english")}
                                        </TextAnimated>

                                        <Radio
                                            size={24}
                                            active={currentLanguage == "en"}
                                        />
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={.98}
                                        onPress={() => changeLanguage(null)}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_system")}
                                        </TextAnimated>

                                        <Radio
                                            size={24}
                                            active={!currentLanguage}
                                        />
                                    </PressableAnimated>
                                </View>
                            </Select>

                            <PressableAnimated
                                scale={1}
                                className="w-full flex flex-row justify-between items-center"
                            >
                                <View className="w-[70%] pr-3">
                                    <TextAnimated className="text-lg">
                                        {t("deleting_setting")}
                                    </TextAnimated>
                                </View>

                                <View className="w-[20%] h-full flex items-center shrink-0">
                                    <Toggle
                                        active={confirm}
                                        onPress={handleConfirmToggle}
                                    />
                                </View>
                            </PressableAnimated>
                        </View>
                    </View>

                    {/* Notifications */}

                    <View className="w-full flex flex-col gap-3 mt-6">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_notifications")}
                            </TextAnimated>
                        </View>

                        <View className="w-full flex items-center gap-8 dark:bg-white/10 bg-white/80 p-5 rounded-2xl">
                            <Pressable className="w-full flex flex-row gap-5">
                                <View>
                                    <MaterialCommunityIcons
                                        name="music-note"
                                        size={25}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
                                    />
                                </View>

                                <View className="max-w-[80%] flex gap-3">
                                    <View>
                                        <TextAnimated className="text-lg">
                                            {t("settings_sound")}
                                        </TextAnimated>
                                    </View>

                                    <View className={clsx(
                                        "dark:bg-white/10 bg-black/5 px-3 py-1 rounded-xl border dark:border-white/10 border-black/10",
                                    )}>
                                        <TextAnimated className="text-lg opacity-80">
                                            {t("settings_default_sound")}
                                        </TextAnimated>
                                    </View>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* Management */}

                    <View className="w-full flex flex-col gap-3 mt-6">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_management")}
                            </TextAnimated>
                        </View>

                        <View className="w-full flex items-center gap-8 dark:bg-white/10 bg-white/80 p-5 rounded-2xl">
                            <Pressable className="flex flex-row items-center gap-5 self-start">
                                <View>
                                    <MaterialCommunityIcons
                                        name="folder-cog"
                                        size={28}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"} />
                                </View>

                                <TextAnimated className="text-lg">
                                    {t("settings_management_folders")}
                                </TextAnimated>
                            </Pressable>
                        </View>
                    </View>

                    {/* Security */}

                    <View className="w-full flex flex-col gap-3 mt-6">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_security")}
                            </TextAnimated>
                        </View>

                        <View className="w-full flex items-center gap-8 dark:bg-white/10 bg-white/80 p-5 rounded-2xl">
                            <PressableAnimated
                                scale={1}
                                className="flex self-start flex-row gap-5"
                            >
                                <FontAwesome5
                                    name="user-lock"
                                    size={20}
                                    color={
                                        theme == "dark"
                                            ? "rgba(255, 255, 255, .3)"
                                            : "rgba(0, 0, 0, .3)"
                                    }
                                />

                                <TextAnimated className="max-w-[90%] text-lg">
                                    {t("lock_app")}
                                </TextAnimated>
                            </PressableAnimated>

                            <View className="w-full flex items-center gap-3">
                                <View className="w-full flex flex-row justify-between items-center gap-2">
                                    <View className="w-[75%] flex flex-row items-center gap-4">
                                        <FontAwesome5
                                            name="user-shield"
                                            size={22}
                                            color={
                                                theme == "dark"
                                                    ? "rgba(255, 255, 255, .3)"
                                                    : "rgba(0, 0, 0, .3)"
                                            }
                                        />

                                        <View className="w-[80%] flex justify-center">
                                            <TextAnimated className="text-lg">
                                                {t("settings_2FA")}
                                            </TextAnimated>
                                        </View>
                                    </View>

                                    <Toggle

                                    />
                                </View>

                                <View className="w-full px-2">
                                    <TextAnimated className="text-lg opacity-50">
                                        {t("settings_2FA_description")}
                                    </TextAnimated>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Other */}

                    <View className="w-full flex flex-col gap-3 mt-6">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_other")}
                            </TextAnimated>
                        </View>

                        <View className="w-full flex items-center gap-8 dark:bg-white/10 bg-white/80 p-5 rounded-2xl">
                            <Pressable
                                className="flex self-start flex-row items-center gap-5"
                            >
                                <View>
                                    <FontAwesome
                                        name="file-text"
                                        size={23}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
                                    />
                                </View>

                                <View className="max-w-[85%]">
                                    <TextAnimated className="text-lg">
                                        {t("settings_policy")}
                                    </TextAnimated>
                                </View>
                            </Pressable>

                            <Pressable
                                className="flex self-start flex-row gap-5"
                            >
                                <View>
                                    <FontAwesome5
                                        name="sync"
                                        size={22}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
                                    />
                                </View>

                                <View className="max-w-[85%]">
                                    <TextAnimated className="text-lg">
                                        {t("settings_check_updates")}
                                    </TextAnimated>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    <View className="w-full flex items-center gap-2 pt-10">
                        <TextGradient
                            colors={[COLORS.emerald[500], theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"]}
                            className="text-xl"
                        >
                            {APP_NAME}
                        </TextGradient>

                        <TextAnimated>
                            V0.0
                        </TextAnimated>
                    </View>
                </Animated.ScrollView>
            </View>

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                className="absolute left-0 bottom-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    className="w-full h-[50px]"
                />
            </LinearGradient>
        </Container>
    );
}