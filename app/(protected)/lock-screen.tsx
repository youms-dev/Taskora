import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { TextGradient } from "@/components/text-gradient";
import { COLORS } from "@/constants/colors";
import { UNLOCK } from "@/constants/emitters";
import { APP_NAME } from "@/constants/names";
import { LOCAL_AUTH_ATTEMPTS_STORE } from "@/constants/secure-store";
import { useLocalAuth } from "@/hooks/local-auth/use-local-auth";
import { useTheme } from "@/hooks/use-theme";
import { emitter } from "@/lib/event-emitter";
import { AttemptsType } from "@/types/auth";
import { FontAwesome5 } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import clsx from "clsx";
import * as Authentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, FlatList, Text, useWindowDimensions, Vibration, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const SIZE = 70;
const MARGIN = 10;
const LETTERS = [
    "ABC",
    "DEF",
    "GHI",
    "JKL",
    "MNO",
    "PQRS",
    "TUV",
    "WXYZ",
];

interface ButtonProps {
    index: number;
    value: number;
    onBackSpacePress: () => void;
    onFingerPrintPress: () => void;
    onPress: () => void;
    delayLongPress: number;
    onLongPress: () => void;
    hideFingerButton: boolean;
}

const Button = memo(({ index, value, onBackSpacePress, onFingerPrintPress, onPress, delayLongPress, onLongPress, hideFingerButton }: ButtonProps) => {
    const { theme } = useTheme();
    const isFingerPrint = index == 9;
    const isBackSpace = index == 11;
    const touchable = !isFingerPrint || !hideFingerButton;

    const handlePress = useCallback(() => {
        if (!touchable) return;

        if (isFingerPrint) {
            onFingerPrintPress();
        }
        else if (isBackSpace) {
            onBackSpacePress();
        }
        else {
            onPress();
        }
    }, [onBackSpacePress, onFingerPrintPress, onPress]);

    const handleLongPress = useCallback(() => {
        isBackSpace && onLongPress();
    }, [onLongPress, isFingerPrint, isBackSpace]);

    return (
        <PressableAnimated
            scale={.9}
            onPress={handlePress}
            delayLongPress={delayLongPress}
            onLongPress={handleLongPress}
            style={{
                width: SIZE,
                height: SIZE,
                marginHorizontal: MARGIN,
                opacity: isFingerPrint ? (!touchable ? 0 : 1) : 1,
            }}
            className="rounded-full dark:bg-black bg-white"
        >
            <View
                style={{
                    transform: [
                        {
                            translateX: -6,
                        },
                        {
                            translateY: -6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full left-0 top-0 dark:bg-white/5 bg-white rounded-full pointer-events-none"
            />

            <View
                style={{
                    transform: [
                        {
                            translateX: 6,
                        },
                        {
                            translateY: 6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full right-0 bottom-0 dark:bg-black/50 bg-black/10 rounded-full pointer-events-none"
            />

            <View className="size-full rounded-full dark:bg-black bg-white">
                <View
                    style={{
                        backgroundColor: theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .05)"
                    }}
                    className="size-full flex justify-center items-center rounded-full"
                >
                    {
                        !isFingerPrint && !isBackSpace && (
                            <TextAnimated
                                style={{
                                    transform: [
                                        {
                                            translateY: -5,
                                        }
                                    ]
                                }}
                                className="text-2xl font-medium"
                            >
                                {value}
                            </TextAnimated>
                        )
                    }

                    {
                        isFingerPrint && (
                            <FontAwesome5
                                name="fingerprint"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .8)"}
                            />
                        )
                    }

                    {
                        isBackSpace && (
                            <FontAwesome5
                                name="backspace"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .8)"}
                            />
                        )
                    }

                    {
                        (value > 1 || index == 10) && (
                            <View
                                style={{
                                    transform: [
                                        {
                                            translateY: 15,
                                        }
                                    ]
                                }}
                                className="absolute"
                            >
                                <TextAnimated className={clsx(
                                    "tracking-widest",
                                    index != 10 ? "text-sm opacity-60" : "text-xl opacity-50",
                                )}>
                                    {index != 10 ? LETTERS[index - 1] : "+"}
                                </TextAnimated>
                            </View>
                        )
                    }
                </View>
            </View>
        </PressableAnimated >
    );
});

interface BoxProps {
    active: boolean;
    shake: SharedValue<boolean>;
}

const Box = memo(({ active, shake }: BoxProps) => {
    const { theme, themeShared } = useTheme();

    const animation = useAnimatedStyle(() => ({
        backgroundColor: (
            shake.value ?
                COLORS.red[500]
                :
                themeShared.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
        ),
    }));

    const shakingAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: (
                    shake.value ?
                        withRepeat(
                            withSequence(
                                withTiming(-15, {
                                    duration: 50,
                                    easing: Easing.inOut(Easing.linear),
                                }),
                                withTiming(15, {
                                    duration: 50,
                                    easing: Easing.inOut(Easing.linear),
                                }),
                                withTiming(0, {
                                    duration: 50,
                                    easing: Easing.inOut(Easing.linear),
                                }),
                            ),
                            Infinity,
                            true,
                        )
                        :
                        0
                ),
            }
        ]
    }));

    return (
        <Animated.View
            style={shakingAnimation}
            className="size-[25px] rounded-full dark:bg-black bg-white"
        >
            <View
                style={{
                    transform: [
                        {
                            translateX: -6,
                        },
                        {
                            translateY: -6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full left-0 top-0 dark:bg-white/5 bg-white rounded-full pointer-events-none"
            />

            <View
                style={{
                    transform: [
                        {
                            translateX: 6,
                        },
                        {
                            translateY: 6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full right-0 bottom-0 dark:bg-black/50 bg-black/10 rounded-full pointer-events-none"
            />

            <View className="size-full rounded-full dark:bg-black bg-white">
                <View
                    style={{
                        backgroundColor: theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .05)"
                    }}
                    className="size-full flex justify-center items-center rounded-full p-2"
                >
                    {
                        active && (
                            <Animated.View
                                entering={FadeIn
                                    .duration(200)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={FadeOut
                                    .duration(200)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={animation}
                                className="size-full rounded-full"
                            />
                        )
                    }
                </View>
            </View>
        </Animated.View>
    );
});

interface TimerProps {
    entry: number;
    onEndReached: () => void;
}

const Timer = memo(({ entry, onEndReached }: TimerProps) => {
    const interval = useRef<ReturnType<typeof setInterval>>(null);
    const [time, setTime] = useState<string>(String(entry));

    useEffect(() => {
        let val = entry;

        setTime(String(entry));

        interval.current = setInterval(() => {
            if (val == 0) {
                onEndReached();
                interval.current && clearInterval(interval.current);
                return;
            }

            val--;
            setTime(String(val));
        }, 1000);

        return () => {
            interval.current && clearInterval(interval.current);
        }
    }, [entry, onEndReached]);

    return (
        <Text>
            {time}
        </Text>
    );
});

export default function LockScreen() {
    const { theme } = useTheme();
    const [lock, setLock] = useState<boolean>(true);
    const lockShared = useSharedValue<boolean>(true);
    const themeShared = useSharedValue<typeof theme>(theme);
    const scale = useSharedValue<number>(0);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [value, setValue] = useState<string>("");
    const shake = useSharedValue<boolean>(false);
    const shakeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const { t, i18n } = useTranslation();
    const [active, setActive] = useState<boolean>(false);
    const { localAuth } = useLocalAuth();
    const attemptsRef = useRef<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const count = useRef<number>(1);
    const [expiresAt, setExpiresAt] = useState<number>(0);

    const numbers = useMemo(() => Array(12).fill(0).map((_, i, tab) => i < tab.length - 3 ? i + 1 : 0), []);

    const attempts = useMemo(() => ({
        increment: async () => {
            if (attemptsRef.current >= 5) {
                const val = count.current * 5;
                const exp = Date.now() + (1000 * val);

                await SecureStore.setItemAsync(LOCAL_AUTH_ATTEMPTS_STORE, JSON.stringify({
                    attempts: count.current,
                    expiresAt: exp,
                } as AttemptsType));

                count.current = count.current + 1;
                setActive(false);
                setExpiresAt(val);
            }
            else {
                attemptsRef.current = attemptsRef.current + 1;
            }
        },
        reset: async (all?: boolean) => {
            await SecureStore.deleteItemAsync(LOCAL_AUTH_ATTEMPTS_STORE);
            setActive(true);
            attemptsRef.current = 0;
            setExpiresAt(0);
            if (all) count.current = 1;
        },
    }), []);

    const upHalfAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withDelay(500,
                withTiming(lockShared.value ? 32 : 20, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad)
                })
            )
        }],
        borderColor: withDelay(500,
            withTiming((
                !lockShared.value ?
                    COLORS.emerald[500]
                    :
                    (themeShared.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
            ), {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
        )
    }));

    const upHalfChildAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: 10,
            },
            {
                translateY: withDelay(500,
                    withTiming(lockShared.value ? 10 : 0, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad)
                    })
                )
            },
        ],
    }));

    const lowerHalfAnimation = useAnimatedStyle(() => ({
        backgroundColor: withDelay(500,
            withTiming((
                !lockShared.value ?
                    COLORS.emerald[500]
                    :
                    (themeShared.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
            ), {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        )
    }));

    const animation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: scale.value,
            }
        ]
    }));

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    const onSuccess = useCallback(() => {
        attempts.reset(true);
        lockShared.value = false;
        setLock(false);
        setValue("");
        timeout.current = setTimeout(() => {
            setLock(true);
            lockShared.value = true;
            emitter.emit(UNLOCK);
        }, 1500);
    }, []);

    const handleSystemAuth = useCallback(async () => {
        timeout.current && clearTimeout(timeout.current);
        const { success } = await Authentication.authenticateAsync({
            requireConfirmation: false,
            promptMessage: t("lock_screen_item_1", { name: APP_NAME }),
            promptDescription: t("lock_screen_item_2", { name: APP_NAME }),
        });

        if (success) {
            onSuccess();
        }
    }, [i18n.language]);

    useEffect(() => {
        if (!lock) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad)
                    }),
                    withTiming(1.2, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad)
                    }),
                    withDelay(
                        600,
                        withTiming(1, {
                            duration: 300,
                            easing: Easing.inOut(Easing.quad)
                        }),
                    )
                ),
                1
            );
        }
        else {
            scale.value = 1;
        }
    }, [lock]);

    useEffect(() => {
        return () => {
            timeout.current && clearTimeout(timeout.current);
            shakeTimeout.current && clearTimeout(shakeTimeout.current);
        }
    }, []);

    const onPress = useCallback((item: number) => {
        if (shake.value || !localAuth) return;
        const next = (value + String(item)).slice(0, 5);

        if (next.trim().length == 5) {
            if (next == localAuth.code) {
                onSuccess();
            }
            else {
                shake.value = true;
                attempts.increment();
            }
        }

        setValue(next);
    }, [value, onSuccess, localAuth]);

    const renderItem = useCallback(({ item, index }: { item: number; index: number }) => {
        return (
            <Button
                index={index}
                value={item}
                onBackSpacePress={() => setValue(prev => {
                    if (prev.length > 0) {
                        return prev.slice(0, prev.length - 1);
                    }
                    return prev;
                })}
                onFingerPrintPress={handleSystemAuth}
                onPress={() => onPress(item)}
                delayLongPress={150}
                onLongPress={() => setValue("")}
                hideFingerButton={!localAuth?.systemAuth}
            />
        );
    }, [onPress, localAuth]);

    const getItemLayout = useCallback((_data: any, index: number) => ({
        length: SIZE,
        offset: index * (SIZE + MARGIN),
        index,
    }), []);

    const handleShaking = useCallback(() => {
        shakeTimeout.current && clearTimeout(shakeTimeout.current);
        Vibration.vibrate(500);
        shakeTimeout.current = setTimeout(() => {
            shake.value = false;
            setValue("");
        }, 800);
    }, []);

    useAnimatedReaction(
        () => shake.value,
        (next, prev) => {
            if (next && next != prev) {
                scheduleOnRN(handleShaking);
            }
        }
    );

    const getAttempts = useCallback(async () => {
        if (!localAuth) return;
        const data = await SecureStore.getItemAsync(LOCAL_AUTH_ATTEMPTS_STORE);

        if (data) {
            const dataParsed = JSON.parse(data) as AttemptsType;
            const diff = dataParsed.expiresAt - Date.now();

            if (diff > 0) {
                count.current = dataParsed.attempts;
                setExpiresAt(Math.ceil(diff / 1000));
                setActive(false);
            }
            else {
                attempts.reset();
                localAuth.systemAuth && handleSystemAuth();
            }
        }
        else {
            attempts.reset();
            localAuth.systemAuth && handleSystemAuth();
        }
        setLoading(false);
        setActive(true);
    }, [localAuth]);

    useEffect(() => {
        getAttempts();

        const { remove } = AppState.addEventListener("change", (state) => {
            if (state == "active") {
                getAttempts();
            }
        });

        return () => remove();
    }, [getAttempts]);

    return (
        <Container centerX>
            <View
                style={{
                    width: screenWidth,
                    height: screenHeight + (screenHeight * .2),
                    transform: [
                        {
                            translateY: -screenHeight * .1,
                        }
                    ]
                }}
                className="absolute left-0 top-0 size-full dark:bg-white/10 pointer-events-none"
            />

            {/* Section 1 */}

            <View className="w-full flex justify-center items-center">
                <Animated.View
                    style={animation}
                    className="w-[120px] flex justify-center items-center shrink-0"
                >
                    {/* Lock top */}

                    <Animated.View
                        style={upHalfAnimation}
                        className="relative w-[60%] h-[80px] border-[10px] rounded-3xl"
                    >
                        <Animated.View
                            style={upHalfChildAnimation}
                            className="absolute right-0 bottom-0 w-[10px] h-[50%] dark:bg-black bg-white"
                        >
                            <View
                                style={{
                                    backgroundColor: theme == "dark" ? "black" : "rgba(0, 0, 0, .05)"
                                }}
                                className="size-full"
                            />
                        </Animated.View>
                    </Animated.View>

                    {/* Lock bottom */}

                    <View className="w-[80%] h-[60px] rounded-xl dark:bg-black bg-white">
                        <Animated.View
                            style={lowerHalfAnimation}
                            className="size-full flex justify-center items-center rounded-xl"
                        >
                            <FontAwesome6
                                name="key"
                                size={35}
                                color={lock ?
                                    (theme === "dark" ? "black" : "rgba(255, 255, 255, .8)")
                                    :
                                    "black"
                                }
                            />
                        </Animated.View>
                    </View>
                </Animated.View>
            </View>

            {/* Section 2 */}

            <View className="w-full h-[75%] flex items-center gap-10 pt-20">
                {
                    !loading && (
                        <>
                            {/* Timer */}

                            {
                                !active && (
                                    <View className="w-full flex items-center">
                                        <TextAnimated className="text-center text-xl font-bold">
                                            {t("lock_screen_429_item_1")}
                                        </TextAnimated>

                                        <TextAnimated className="text-center text-lg mt-3">
                                            {t("lock_screen_429_item_2")}
                                        </TextAnimated>

                                        <View className="flex justify-center items-center mt-2">
                                            <TextAnimated className="text-lg font-medium">
                                                <Timer
                                                    entry={expiresAt}
                                                    onEndReached={() => attempts.reset()}
                                                /> s
                                            </TextAnimated>
                                        </View>
                                    </View>
                                )
                            }

                            {/* Pad */}

                            {
                                active && (
                                    <>
                                        <View className="w-full flex flex-row justify-center items-center gap-5 px-3">
                                            {
                                                Array(5).fill(0).map((_, i) => {
                                                    return (
                                                        <Box
                                                            key={i}
                                                            active={!!value[i]}
                                                            shake={shake}
                                                        />
                                                    );
                                                })
                                            }
                                        </View>

                                        <View className="w-full flex items-center">
                                            <FlatList
                                                data={numbers}
                                                keyExtractor={(_, i) => String(i)}
                                                numColumns={3}
                                                renderItem={renderItem}
                                                getItemLayout={getItemLayout}
                                                contentContainerStyle={{
                                                    rowGap: 20,
                                                    paddingVertical: 10,
                                                }}
                                                contentContainerClassName="w-full flex items-center"
                                            />
                                        </View>
                                    </>
                                )
                            }
                        </>
                    )
                }
            </View>

            {/* Section 3 */}

            <View className="w-full h-[10%] flex flex-row justify-center gap-3 p-3">
                <TextGradient
                    colors={[
                        COLORS.emerald[500],
                        theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    className="text-3xl font-extrabold"
                >
                    {APP_NAME}
                </TextGradient>
            </View>
        </Container>
    );
}