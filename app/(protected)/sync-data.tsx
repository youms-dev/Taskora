import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { SyncAnimation } from "@/components/sync-animation";
import { TextAnimated } from "@/components/text-animated";
import { Toggle } from "@/components/toggle";
import { useSettingsData } from "@/hooks/settings/use-settings-data";
import { useTheme } from "@/hooks/use-theme";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { Easing, SlideInLeft } from "react-native-reanimated";

export default function SyncDataPage() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { width: screenWidth } = useWindowDimensions();
    const router = useRouter();
    const { setting, setSetting } = useSettingsData();

    return (
        <Container centerX>

            {/* Header */}

            <Animated.View
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
                className="absolute left-0 top-0 flex flex-row items-center gap-3 pr-5 z-[10] rounded-[50px]"
            >
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

                <View className="max-w-[80%]">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-xl tracking-widest"
                    >
                        {t("auto-sync_title")}
                    </TextAnimated>
                </View>
            </Animated.View>

            <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={false}
                className="w-full h-full"
                contentContainerClassName="w-full flex px-3 pt-[80px] pb-[50px]"
            >
                {/* Overview */}

                <View className="w-full flex justify-center items-center dark:bg-white/10 bg-white pt-5 rounded-[20px] pb-3">
                    <View className="w-full flex-row justify-center">
                        <SyncAnimation
                            width={screenWidth * .8}
                            height={200}
                        />
                    </View>

                    <View className="w-full flex flex-row justify-center px-5">
                        <TextAnimated className="text-center font-medium tracking-wider opacity-80 leading-[20px]">
                            {t("auto-sync_explanation")}
                        </TextAnimated>
                    </View>
                </View>

                {/* Enable card */}

                <View className="w-full flex flex-row justify-between gap-3 dark:bg-white/10 bg-white rounded-2xl mt-6 p-3">
                    <View className="w-[80%]">
                        <TextAnimated className="text-lg">
                            {t("auto-sync_enable")}
                        </TextAnimated>
                    </View>

                    <View>
                        <Toggle
                            active={!!setting?.autoSync}
                            onPress={() => setting && setSetting({
                                ...setting,
                                autoSync: !setting.autoSync,
                            })}
                        />
                    </View>
                </View>
            </ScrollView>
        </Container>
    );
}