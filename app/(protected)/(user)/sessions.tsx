import { ConfirmBox } from "@/components/confirm-box";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { MultiSessionAnimation } from "@/components/sessions/multi-session-animation";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/hooks/auth-provider";
import { useSessions } from "@/hooks/database/use-sessions";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { DeviceType, SessionType } from "@/types/database/session";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, FadeInUp, FadeOutDown, interpolate, SlideInLeft, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface Props {
    session: SessionType;
    onSelect: () => void;
    loading: boolean
}

const Session = memo(({ session, onSelect, loading }: Props) => {
    const { t, i18n } = useTranslation();
    const { idDevice } = useAuth();
    const { theme } = useTheme();

    const isAndroid = useMemo(() => {
        return (session.deviceType == DeviceType.ANDROID);
    }, [session]);

    return (
        <View className="size-full flex flex-row items-center gap-3 dark:bg-white/10 bg-white px-3 py-2 rounded-2xl">

            {/* Device overview */}

            <View
                style={{
                    borderRadius: isAndroid ? 10 : 12,
                }}
                className="w-[45px] h-full dark:bg-black bg-white"
            >
                <View
                    style={{
                        borderRadius: isAndroid ? 10 : 12,
                    }}
                    className="size-full flex items-center dark:bg-black bg-[rgba(0,0,0,.06)] py-1"
                >
                    <View
                        style={{
                            transform: [
                                {
                                    translateY: 5,
                                }
                            ]
                        }}
                        className="absolute w-[40%] h-[4px] dark:bg-white/15 bg-black/15 rounded-2xl"
                    />

                    <View className="size-full flex justify-center items-center">
                        <MaterialCommunityIcons
                            name={isAndroid ? "android" : "apple"}
                            size={25}
                            color={COLORS.emerald[500]}
                        />
                    </View>
                </View>
            </View>

            {/* Device data  */}

            <View className="w-[80%] h-full flex justify-center items-center gap-1">
                <View className="w-full flex flex-row items-center gap-2">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg font-medium opacity-90 tracking-widest"
                    >
                        {session.deviceName}
                        &nbsp;
                        &bull;
                        &nbsp;
                        {session.deviceModel}
                    </TextAnimated>
                </View>

                <View className="w-full flex flex-row items-center gap-2 overflow-hidden">
                    <View className="px-3 py-1 dark:bg-black/30 bg-[rgba(0,0,0,.06)] rounded-2xl border dark:border-white/10 border-black/10">
                        <Text
                            numberOfLines={1}
                            className="text-emerald-500 tracking-widest"
                        >
                            {(session.deviceBrand).toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View className="w-full flex flex-row justify-between items-center gap-3">
                    <View className="max-w-[85%]">
                        <TextAnimated
                            numberOfLines={1}
                            className="tracking-widest"
                        >
                            {format(session.createdAt, i18n.language == "en" ? "MM-dd-yyyy HH:mm:ss" : "dd-MM-yyyy HH:mm:ss")}
                        </TextAnimated>
                    </View>

                    {
                        idDevice && session.idDevice != idDevice && (
                            <PressableAnimated
                                scale={.95}
                                disabled={loading}
                                onPress={onSelect}
                            >
                                {
                                    loading ?
                                        (
                                            <ActivityIndicator
                                                size={20}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                            />
                                        )
                                        :
                                        (
                                            <Entypo
                                                name="trash"
                                                size={25}
                                                color={COLORS.red[500]}
                                            />
                                        )
                                }
                            </PressableAnimated>
                        )
                    }
                </View>
            </View>
        </View>
    );
});

export default function SessionsPage() {
    const { theme, themeShared } = useTheme();
    const { t, i18n } = useTranslation();
    const [sessions, setSessions] = useState<SessionType[]>([]);
    const deviceHeight = 100;
    const devicesGap = 15;
    const threshold = deviceHeight;
    const scrollY = useSharedValue<number>(0);
    const headerContainerWidth = useSharedValue<number>(0);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [loading, setLoading] = useState<boolean>(false);
    const [selected, setSelected] = useState<SessionType | null>(null);
    const screenHeightShared = useSharedValue<number>(screenHeight);
    const router = useRouter();
    const { getSessions, deleteSession } = useSessions();
    const { setToast } = useToast();
    const { user, idDevice } = useAuth();
    const [deleting, setDeleting] = useState<boolean>(false);

    const headerContainerAnimation = useAnimatedStyle(() => ({
        borderWidth: 1,
        borderColor: (
            scrollY.value >= threshold ?
                themeShared.value == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .1)"
                :
                themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .06)"
        ),
    }));

    const headerBackgroundAnimation = useAnimatedStyle(() => ({
        width: interpolate(
            scrollY.value,
            [0, threshold],
            [50, headerContainerWidth.value],
            Extrapolation.CLAMP,
        )
    }));

    const headerShadowAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, threshold],
            [0, 1],
            Extrapolation.CLAMP,
        )
    }));

    const renderItem = useCallback(({ item, index }: { item: SessionType, index: number }) => {
        return (
            <Animated.View
                entering={FadeInUp
                    .delay(index * 100)
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                exiting={FadeOutDown
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    height: deviceHeight,
                }}
                className="w-full rounded-2xl"
            >
                <Session
                    session={item}
                    onSelect={() => setSelected(item)}
                    loading={deleting}
                />
            </Animated.View>
        );
    }, [deleting]);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }
    });

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: deviceHeight + devicesGap,
        offset: index * (deviceHeight + devicesGap),
        index,
    }), []);

    const overviewAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, threshold * .8],
            [1, 0],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, threshold / 2, threshold],
                    [80, 40, 100],
                    Extrapolation.CLAMP,
                ),
            }
        ]
    }));

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        gap: devicesGap,
                    }}
                    className="w-full flex items-center"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeInUp
                                    .delay(i * 100)
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={{
                                    height: deviceHeight,
                                }}
                                className="w-full rounded-2xl overflow-hidden"
                            >
                                <Skeleton delay={i * 200} />
                            </Animated.View>
                        ))
                    }
                </View>
            );
        }
        return null;
    }, [loading]);

    useEffect(() => {
        screenHeightShared.value = screenHeight;
    }, [screenHeight]);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (selected != null) {
                setSelected(null);
                return true;
            }

            return false;
        });

        return () => remove();
    }, [selected]);

    const handleGetSessions = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            const data = await getSessions(user.idUser) as typeof sessions;

            setSessions(data);
        }
        catch (e) {
            console.log(e);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
        }
    }, [user]);

    const handleGetDeleteSession = useCallback(async () => {
        if (deleting || !selected || !user || selected.idDevice == idDevice) return;

        setSelected(null);
        try {
            setDeleting(true);

            await api.delete("/session/delete", {
                data: {
                    idDevice: selected.idDevice,
                },
            });

            await deleteSession(user.idUser, selected.idSession);

            handleGetSessions();
        }
        catch (e) {
            setToast(t("error"), "error");
        }
        finally {
            setDeleting(false);
        }
    }, [deleting, selected, user, idDevice]);

    useEffect(() => {
        handleGetSessions();
    }, []);

    return (
        <Container centerX>

            {/* Top linear gradient */}

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={theme == "dark" ? [0, 0, 1] : [0, .4, 1]}
                className="absolute left-0 top-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={theme == "dark" ? [0, 0, 1] : [0, .4, 1]}
                    className="w-full h-[20px]"
                />
            </LinearGradient>

            {/* Header */}

            <Animated.View
                onLayout={(e) => headerContainerWidth.value = e.nativeEvent.layout.width}
                entering={SlideInLeft
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    transform: [
                        {
                            translateX: 12,
                        },
                        {
                            translateY: 8,
                        },
                    ],
                }}
                className="absolute left-0 top-0 z-[10] rounded-[50px]"
            >
                <Animated.View
                    style={[
                        {
                            transform: [
                                {
                                    translateY: 8,
                                },
                            ],
                            filter: "blur(5px)",
                        },
                        headerShadowAnimation,
                    ]}
                    className="absolute left-0 top-0 size-full rounded-[50px] dark:bg-black/50 bg-black/30"
                />

                <Animated.View
                    style={headerContainerAnimation}
                    className="rounded-[50px] dark:bg-black bg-white"
                >
                    <View className="flex flex-row items-center gap-3 rounded-[50px] pr-5 dark:bg-black bg-[rgba(0,0,0,0.06)] overflow-hidden">
                        <Animated.View
                            style={headerBackgroundAnimation}
                            className="absolute left-0 top-0 size-full dark:bg-white/10 bg-white rounded-[50px]"
                        />

                        <PressableAnimated
                            scale={.95}
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                }
                                else {
                                    router.dismissTo({
                                        pathname: "/(protected)/(tabs)/settings"
                                    });
                                }
                            }}
                            className="size-[50px] dark:bg-black bg-white rounded-full"
                        >
                            <View className="size-full flex justify-center items-center border-2 dark:border-white/5 border-black/5 rounded-full dark:bg-white/10 bg-white">
                                <Entypo
                                    name="chevron-left"
                                    size={25}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                />
                            </View>
                        </PressableAnimated>

                        <View>
                            <TextAnimated
                                numberOfLines={1}
                                className="text-xl tracking-widest"
                            >
                                {t("sessions_list_title")}
                            </TextAnimated>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>

            {/* Overview */}

            <Animated.View
                style={overviewAnimation}
                className="absolute w-full flex justify-center items-center z-[2] px-5 rounded-[20px] pointer-events-none"
            >
                <View className="w-full dark:bg-black bg-white rounded-[20px]">
                    <View className="w-full flex justify-center items-center dark:bg-white/10 bg-white pt-5 rounded-[20px] pb-3">
                        <View className="w-full flex-row justify-center">
                            <MultiSessionAnimation
                                width={screenWidth * .8}
                                height={200}
                            />
                        </View>

                        <View className="w-full flex flex-row justify-center px-5">
                            <TextAnimated className="text-center font-medium tracking-wider opacity-80">
                                {t("sessions_list_explanation")}
                            </TextAnimated>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Data */}

            <Animated.FlatList
                horizontal={false}
                showsVerticalScrollIndicator={false}
                updateCellsBatchingPeriod={0}
                scrollEventThrottle={16}
                data={sessions}
                keyExtractor={(item) => item.idDevice}
                renderItem={renderItem}
                onScroll={onScroll}
                getItemLayout={getItemLayout}
                ListFooterComponent={listFooterComponent}
                className="w-full h-full"
                contentContainerStyle={{
                    gap: devicesGap,
                    paddingBottom: 220,
                }}
                contentContainerClassName="w-full flex px-3 pt-[400px]"
            />

            {/* Confirmation box */}

            <ConfirmBox
                active={selected != null}
                message={t("sessions_list_confirm_box_desc")}
                backdropBackground="rgba(0, 0, 0, .2)"
                cancelLabel={t("sessions_list_confirm_box_cancel")}
                submitLabel={t("sessions_list_confirm_box_submit")}
                onCancel={() => setSelected(null)}
                onSubmit={handleGetDeleteSession}
            />

            {/* Bottom linear gradient */}

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                locations={[0, .3, 1]}
                className="absolute left-0 bottom-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .3, 1]}
                    className="w-full h-[30px]"
                />
            </LinearGradient>
        </Container>
    );
}