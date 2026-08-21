import { useFolders } from "@/hooks/database/use-folders";
import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { useToast } from "@/hooks/use-toast";

interface Props {
    selected: FolderType | null;
    onSelect: (entry: FolderType | null) => void;
}

export const FoldersList = memo(({ selected, onSelect }: Props) => {
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [count, setCount] = useState<number>(0);
    const folderHeight = 30;
    const foldersGap = 15;
    const { width: screenWidth } = useWindowDimensions();
    const [loading, setLoading] = useState<boolean>(false);
    const { theme } = useTheme();
    const { i18n, t } = useTranslation();
    const { getFolders, getFoldersCount } = useFolders();
    const limit = 10;
    const [init, setInit] = useState<boolean>(true);
    const { setToast } = useToast();

    const renderItem = useCallback(({ item: folder, index }: { item: FolderType; index: number }) => {
        return (
            <Animated.View
                entering={FadeInUp
                    .delay(index * 100)
                    .springify()
                    .stiffness(50)
                    .damping(5)
                    .mass(1)
                }
                style={{
                    height: folderHeight,
                }}
                className="w-full"
            >
                <Pressable
                    onPress={() => {
                        if (selected?.idFolder == folder.idFolder) {
                            onSelect(null);
                        }
                        else {
                            onSelect(folder);
                        }
                    }}
                    className="w-full h-full flex flex-row justify-between items-center"
                >
                    <View className="max-w-[70%]">
                        <TextAnimated
                            numberOfLines={1}
                            className="text-xl"
                        >
                            {folder.title.charAt(0).toUpperCase() + folder.title.slice(1).toLowerCase()}
                        </TextAnimated>
                    </View>

                    <View className="size-[25px] rounded-full dark:bg-white/10 bg-black/10 p-2">
                        {
                            selected?.idFolder == folder.idFolder && (
                                <View className="size-full bg-emerald-500 rounded-full" />
                            )
                        }
                    </View>
                </Pressable>
            </Animated.View>
        );
    }, [selected, onSelect]);

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        width: screenWidth,
                        height: 30,
                        gap: foldersGap,
                    }}
                    className="flex items-center px-5"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <View
                                key={i}
                                className="w-full h-full rounded-2xl overflow-hidden dark:bg-black/0 bg-black/20"
                            >
                                <Skeleton />
                            </View>
                        ))
                    }
                </View>
            )
        }
        return null;
    }, [folders, screenWidth, loading]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: folderHeight + foldersGap,
        offset: index * (folderHeight + foldersGap),
        index,
    }), [folders]);

    const listEmptyComponent = useCallback(() => {
        if (!loading && folders.length == 0 && !init) {
            return (
                <View className="w-screen h-[200px] flex justify-center items-center gap-4 pt-10">
                    <MaterialCommunityIcons
                        name="folder-remove"
                        size={100}
                        color={theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)"}
                    />
                    <Text className="dark:text-white/50 text-black/50 font-bold text-lg tracking-wider text-center">
                        {t("create_no_folders")}
                    </Text>
                </View>
            );
        }
        return null;
    }, [i18n.language, folders, theme, loading, init]);

    const handleGetFolders = useCallback(async () => {
        if (loading) return;
        try {
            setLoading(true);
            const data = await getFolders(folders.length, limit) as FolderType[];

            setFolders(data);
            setLoading(false);
            setInit(false);
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error", 5000);
        }
    }, [folders, loading, count]);
    
    const handleGetFoldersCount = useCallback(async () => {
        try {
            const data = await getFoldersCount() as number;
            
            setCount(data);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error", 5000);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            handleGetFoldersCount();
            handleGetFolders();
        }, 500);

        return () => clearTimeout(timeout);
    }, []);

    const onEndReached = useCallback(() => {
        if (!loading && folders.length < count) {
            handleGetFolders();
        }
        return null;
    }, [loading, count, folders]);

    return (
        <FlatList
            horizontal={false}
            showsVerticalScrollIndicator={false}
            data={folders}
            keyExtractor={(item) => item.idFolder}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            updateCellsBatchingPeriod={0}
            scrollEventThrottle={16}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            ListFooterComponent={listFooterComponent}
            ListEmptyComponent={listEmptyComponent}
            onEndReachedThreshold={.1}
            onEndReached={onEndReached}
            className="w-full h-full"
            contentContainerStyle={{
                gap: foldersGap,
            }}
            contentContainerClassName="w-full flex items-center pb-[100px] px-5"
        />
    );
});