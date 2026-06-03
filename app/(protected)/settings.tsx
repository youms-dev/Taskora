import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Radio } from "@/components/radio";
import { Select } from "@/components/select";
import { TextAnimated } from "@/components/text-animated";
import { ThemeCard } from "@/components/theme-card";
import { Toggle } from "@/components/toggle";
import { COLORS } from "@/constants/colors";
import { CONFIRM_STORAGE, LANGUAGE_STORAGE } from "@/constants/names";
import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useLocales } from "expo-localization";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, interpolateColor, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { theme, target, setTheme } = useTheme();
    const [confirm, setConfirm] = useState<boolean>(false);
    const { user, loading } = useAuth();
    const scrollY = useSharedValue(0);
    const headerHeight = 250;
    const minHeaderHeight = 100;
    const appTheme = useSharedValue<typeof theme>(theme);
    const [scroll, setScroll] = useState<number>(0);
    const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
    const [locales] = useLocales();
    const scrollViewRef = useRef<ScrollView>(null);
    const timeout = useRef<ReturnType<typeof setTimeout>>(0);

    const onScroll = (value: number) => {
        setScroll(value);
    }

    const forceScroll = (value: number) => {

    }

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: ((e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
            runOnJS(onScroll)(y);
        }),
    });

    const headerAnimation = useAnimatedStyle(() => ({
        height: interpolate(
            scrollY.value,
            [0, headerHeight - minHeaderHeight],
            [headerHeight, minHeaderHeight],
            Extrapolation.CLAMP,
        ),
        backgroundColor: scrollY.value >= headerHeight - minHeaderHeight ?
            appTheme.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)"
            :
            appTheme.value == "dark" ? "rgba(255, 255,255, .1)" : "rgba(0, 0, 0, .8)",
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
                    [0, 100],
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
                    [0, -50],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    const handleConfirmToggle = async () => {
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
    };

    useEffect(() => {
        appTheme.value = theme;
    }, [theme]);

    const titleAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, headerHeight - minHeaderHeight],
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
        zIndex: interpolate(
            scrollY.value,
            [0, headerHeight - minHeaderHeight],
            [-100, 1],
            Extrapolation.CLAMP,
        ),
    }));

    const changeLanguage = async (value: string | null) => {
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

    return (
        <Container safeArea={false}>
            <StatusBar
                style={scroll >= (headerHeight - minHeaderHeight) ? (theme == "dark" ? "light" : "dark") : "light"}
                translucent
            />

            <View className="flex-1 dark:bg-black bg-white/10">
                <Animated.View
                    style={headerAnimation}
                    className="absolute top-0 left-0 w-full flex justify-center items-center gap-12 z-[100] overflow-hidden"
                >
                    <Animated.View style={avatarAnimation}>
                        <Avatar
                            size={130}
                            name="Youmbi Le-duc"
                        />
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
                        className="absolute left-0 top-0 w-full h-full flex flex-row items-center pt-10 border-b dark:border-b-white/20 border-b-black/20"
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

                <AnimatedScrollView
                    ref={scrollViewRef}
                    onScroll={scrollHandler}
                    onMomentumScrollEnd={() => {
                        if (scroll > 0 && scroll < Math.round((headerHeight - minHeaderHeight) / 2)) {
                            scrollViewRef.current?.scrollTo({
                                y: 0,
                                animated: true,
                            });
                        }
                        else if (scroll > 0 && scroll < Math.round(headerHeight - minHeaderHeight)) {
                            scrollViewRef.current?.scrollTo({
                                y: headerHeight - minHeaderHeight,
                                animated: true,
                            });
                        }
                    }}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{
                        paddingTop: headerHeight + 10,
                    }}
                    contentContainerClassName="pb-[300px] px-3"
                >
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
                                        <Radio active={target == "light"} />
                                    </View>

                                    <ThemeCard value="light" />
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => setTheme("dark")}
                                    className="size-[110px] flex flex-col self-start items-center gap-2 p-3 mb-10"
                                >
                                    <View className="w-full">
                                        <Radio active={target == "dark"} />
                                    </View>

                                    <ThemeCard value="dark" />
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => setTheme("system")}
                                    className="size-[110px] flex flex-col self-start items-center gap-2 p-3 mb-10"
                                >
                                    <View className="w-full">
                                        <Radio active={target == "system"} />
                                    </View>

                                    <ThemeCard value="system" />
                                </PressableAnimated>
                            </ScrollView>
                        </View>
                    </View>

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
                                        scale={1}
                                        onPress={() => changeLanguage("fr")}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_french")}
                                        </TextAnimated>

                                        <Radio
                                            size={20}
                                            active={currentLanguage == "fr"}
                                        />
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={1}
                                        onPress={() => changeLanguage("en")}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_english")}
                                        </TextAnimated>

                                        <Radio
                                            size={20}
                                            active={currentLanguage == "en"}
                                        />
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={1}
                                        onPress={() => changeLanguage(null)}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_system")}
                                        </TextAnimated>

                                        <Radio
                                            size={20}
                                            active={!currentLanguage}
                                        />
                                    </PressableAnimated>
                                </View>
                            </Select>

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

                            <PressableAnimated
                                scale={1}
                                className="w-full flex flex-row justify-between"
                            >
                                <View className="w-[70%] pr-3">
                                    <TextAnimated className="text-lg">
                                        {t("deleting_setting")}
                                    </TextAnimated>
                                </View>

                                <View className="w-[20%] flex items-center shrink-0">
                                    <Toggle
                                        active={confirm}
                                        onPress={() =>
                                            handleConfirmToggle()
                                        }
                                    />
                                </View>
                            </PressableAnimated>
                        </View>
                    </View>

                    <View className="w-full flex flex-col gap-3 mt-6">
                        <View className="w-full">
                            <TextAnimated className="opacity-50">
                                {t("settings_notifications")}
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
                                        scale={1}
                                        onPress={() => changeLanguage("fr")}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_french")}
                                        </TextAnimated>

                                        <Radio
                                            size={20}
                                            active={currentLanguage == "fr"}
                                        />
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={1}
                                        onPress={() => changeLanguage("en")}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_english")}
                                        </TextAnimated>

                                        <Radio
                                            size={20}
                                            active={currentLanguage == "en"}
                                        />
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={1}
                                        onPress={() => changeLanguage(null)}
                                        className="w-full flex flex-row justify-between"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("settings_system")}
                                        </TextAnimated>

                                        <Radio
                                            size={20}
                                            active={!currentLanguage}
                                        />
                                    </PressableAnimated>
                                </View>
                            </Select>

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

                            <PressableAnimated
                                scale={1}
                                className="w-full flex flex-row justify-between"
                            >
                                <View className="w-[70%] pr-3">
                                    <TextAnimated className="text-lg">
                                        {t("deleting_setting")}
                                    </TextAnimated>
                                </View>

                                <View className="w-[20%] flex items-center shrink-0">
                                    <Toggle
                                        active={confirm}
                                        onPress={() =>
                                            handleConfirmToggle()
                                        }
                                    />
                                </View>
                            </PressableAnimated>
                        </View>
                    </View>
                </AnimatedScrollView>
            </View>
        </Container>
    );
}