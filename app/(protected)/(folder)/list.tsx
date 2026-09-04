import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

export default function FolderList() {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const folderHeight = 60;
    const foldersGap = 10;
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [foldersCount, setFoldersCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const renderItem = useCallback(({ item: folder, index }: { item: FolderType; index: number }) => {
        return (
            <Animated.View
                entering={FadeInUp
                    .delay(index * 100)
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                exiting={FadeInDown
                    .delay(index * 100)
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                className="w-full"
            >
                <TextAnimated className="text-lg">
                    {folder.title}
                </TextAnimated>
            </Animated.View>
        );
    }, []);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: folderHeight,
        offset: index * (folderHeight + foldersGap),
        index,
    }), []);

    const listFooterComponent = useCallback(() => {
        // if (loading) {
        if (true) {
            return (
                <View
                    style={{
                        gap: foldersGap,
                    }}
                    className="w-full flex items-center px-3"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeIn
                                    .delay(i * 100)
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={{
                                    height: folderHeight
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

    const listEmptyComponent = useCallback(() => {
        // if (!loading) {
        if (true) {
            return (
                <View className="w-screen flex justify-center items-center gap-4 pt-10">
                    <MaterialCommunityIcons
                        name="folder-remove"
                        size={120}
                        color={theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)"}
                    />

                    <TextAnimated className="opacity-60 font-bold text-lg tracking-wider">
                        {t("folders_list_empty")}
                    </TextAnimated>
                </View>
            );
        }
        return null;
    }, [loading, i18n.language, theme]);

    return (
        <Container centerX>

            {/* Header */}

            <View className="absolute left-0 top-0 w-full z-[10]">
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, .6, 1]}
                    className="w-full"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .6, 1]}
                        className="w-full flex flex-row justify-between items-center gap-2 px-3 pt-2 pb-8"
                    >
                        <PressableAnimated
                            scale={.95}
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                }
                                else {
                                    router.navigate({
                                        pathname: "/(protected)/(tabs)"
                                    });
                                }
                            }}
                            className="size-[50px] rounded-full dark:bg-black bg-white"
                        >
                            <View className="size-full flex justify-center items-center rounded-full dark:bg-white/10 bg-white border-2 dark:border-white/5 border-white/5">
                                <Entypo
                                    name="chevron-left"
                                    size={30}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                />
                            </View>
                        </PressableAnimated>

                        <View className="w-[80%]">
                            <TextAnimated
                                numberOfLines={1}
                                className="text-xl tracking-wide"
                            >
                                {t("folders_list_title")}
                            </TextAnimated>
                        </View>

                        {/* <PressableAnimated
                            scale={.95}
                            className="w-[30px] flex justify-center items-center"
                        >
                            <FontAwesome6
                                name="ellipsis-vertical"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </PressableAnimated> */}
                    </LinearGradient>
                </LinearGradient>
            </View>

            {/* Content */}

            <FlatList
                horizontal={false}
                showsVerticalScrollIndicator={false}
                data={folders}
                keyExtractor={(item) => item.idFolder}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                ListEmptyComponent={listEmptyComponent}
                ListFooterComponent={listFooterComponent}
                className="w-full h-full"
                contentContainerStyle={{
                    gap: foldersGap,
                }}
                contentContainerClassName="w-full flex px-3 pt-[100px] pb-[50px]"
            />

            {/* Footer */}

            <View
                style={{
                    transform: [
                        {
                            translateY: 20,
                        }
                    ]
                }}
                className="absolute left-0 bottom-0 w-full h-[60px] z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .6, 1]}
                    className="size-full"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0 }}
                        locations={[0, .6, 1]}
                        className="size-full flex flex-row justify-between items-center gap-2 px-3 py-2"
                    />
                </LinearGradient>
            </View>
        </Container>
    );
}