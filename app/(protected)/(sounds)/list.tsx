import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useSettingsData } from "@/hooks/settings/use-settings-data";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { NotificationSoundType } from "@/types/setting";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeInUp, FadeOutDown, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

type SoundType = {
    id: string;
    name: string;
    source: string;
}

const SOUNDS: SoundType[] = [
    {
        id: "sound01.wav",
        name: "Sound 1",
        source: require("../../../assets/sounds/sound01.wav")
    },
    {
        id: "sound02.wav",
        name: "Sound 2",
        source: require("../../../assets/sounds/sound02.wav")
    },
    {
        id: "sound03.wav",
        name: "Sound 3",
        source: require("../../../assets/sounds/sound03.wav")
    },
    {
        id: "sound04.wav",
        name: "Sound 4",
        source: require("../../../assets/sounds/sound04.wav")
    },
];

interface SoundProps {
    sound: SoundType;
    selected: boolean;
    onSelect: () => void;
}

const Sound = memo(({ sound, selected, onSelect }: SoundProps) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const { theme } = useTheme();
    const player = useAudioPlayer(sound.source);
    const translateX = useSharedValue<number>(0);
    const barWidth = useSharedValue<number>(0);

    const onPress = useCallback(() => {
        if (isPlaying) {
            player.pause();
            return;
        }

        if (player.currentTime >= player.duration) {
            player.seekTo(0);
        }

        player.play();
    }, [sound, isPlaying, player]);

    useEffect(() => {
        const { remove } = player.addListener("playbackStatusUpdate", (status) => {
            setIsPlaying(status.playing);

            if (status.duration > 0) {
                const position = status.currentTime / status.duration;

                translateX.value = position * (barWidth.value - 15);
            }

            if (status.didJustFinish) {
                setIsPlaying(false);
                translateX.value = 0;
            }
        }
        );

        return () => remove();
    }, [player]);

    const animation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.value,
            }
        ]
    }));

    return (
        <Pressable
            onPress={onSelect}
            className="w-full flex items-center gap-5 pr-3"
        >
            <View className="w-full flex flex-row items-center gap-5">
                <View className="pointer-events-none">
                    <Checkbox
                        checked={selected}
                        size={30}
                        borderRadius={8}
                    />
                </View>

                <View className="w-[85%] flex flex-row justify-between items-center">
                    <View className="max-w-[80%]">
                        <TextAnimated className="text-lg">
                            {sound.name}
                        </TextAnimated>
                    </View>

                    <PressableAnimated
                        scale={.95}
                        onPress={onPress}
                        className="size-[40px] flex justify-center items-center dark:bg-white/10 bg-white rounded-full border dark:border-white/5 border-black/5"
                    >
                        <MaterialCommunityIcons
                            name={isPlaying ? "pause" : "play"}
                            size={25}
                            color={isPlaying ?
                                (theme == "dark" ? "rgba(255, 255, 255, .8)" : 'rgba(0, 0, 0, .8)')
                                :
                                COLORS.emerald[500]
                            }
                        />
                    </PressableAnimated>
                </View>
            </View>

            <View
                onLayout={(e) => barWidth.value = e.nativeEvent.layout.width}
                className="w-full h-[4px] flex justify-center dark:bg-white/10 bg-white"
            >
                <Animated.View
                    style={animation}
                    className="absolute left-0 size-[15px] bg-emerald-500 rounded-full"
                />
            </View>
        </Pressable>
    );
});

export default function SoundsList() {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [selected, setSelected] = useState<SoundType | null>(null);
    const { setting, setSetting } = useSettingsData();
    const { setToast } = useToast();

    const handleSubmit = useCallback(() => {
        if (!selected) return;
        const data = JSON.stringify({
            name: selected.name,
            fileName: selected.id,
        } as NotificationSoundType);

        setSetting({
            ...setting!,
            notificationSound: data,
        });
        setSelected(null);
        setToast(t("sounds_list_success"), "success");
    }, [setting, selected, setToast, i18n.language]);

    return (
        <Container centerX>
            <View className="w-full flex flex-row items-center px-3 gap-3 py-2">
                <PressableAnimated
                    scale={.95}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        }
                        else {
                            router.navigate({
                                pathname: "/",
                            });
                        }
                    }}
                    className="size-[50px] dark:bg-black bg-white rounded-full"
                >
                    <View className="size-full flex justify-center items-center rounded-full border-2 dark:border-white/5 border-black/5 dark:bg-white/10 bg-white">
                        <Entypo
                            name="chevron-left"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>
                </PressableAnimated>

                <View className="max-w-[80%]">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-xl"
                    >
                        {t("sounds_list_title")}
                    </TextAnimated>
                </View>
            </View>

            <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={false}
                className="w-full h-full mt-10"
                contentContainerClassName="w-full flex items-center gap-12 px-3"
            >
                {
                    SOUNDS.map((sound, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeInUp
                                .delay(i * 200)
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="w-full"
                        >
                            <Sound
                                sound={sound}
                                selected={selected?.id == sound.id}
                                onSelect={() => {
                                    if (selected && selected.id == sound.id) {
                                        setSelected(null);
                                    }
                                    else {
                                        setSelected(sound);
                                    }
                                }}
                            />
                        </Animated.View>
                    ))
                }
            </ScrollView>

            {
                selected && (
                    <View
                        style={{
                            transform: [
                                {
                                    translateY: -20,
                                }
                            ]
                        }}
                        className="absolute left-0 bottom-0 w-full flex flex-row justify-center px-3 pb-5 z-[10]"
                    >
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                        >
                            <PressableAnimated
                                scale={.95}
                                onPress={handleSubmit}
                                className="w-[200px] h-[50px] rounded-2xl"
                            >
                                <View
                                    style={{
                                        transform: [
                                            {
                                                translateY: 8,
                                            },
                                        ],
                                        filter: "blur(5px)",
                                    }}
                                    className="absolute size-full dark:bg-emerald-500/40 bg-black/30 rounded-2xl"
                                />

                                <View className="size-full flex justify-center items-center bg-emerald-500 rounded-2xl">
                                    <Text
                                        numberOfLines={1}
                                        className="text-2xl font-medium"
                                    >
                                        {t("sounds_list_submit")}
                                    </Text>
                                </View>
                            </PressableAnimated>
                        </Animated.View>
                    </View>
                )
            }
        </Container>
    );
}