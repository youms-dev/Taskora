import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useFolders } from "@/hooks/database/use-folders";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, FOLDERS_CHANGED } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { Entypo, FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, GestureResponderEvent, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type ContextMenuPositionType = {
    x: number;
    y: number;
} | null;

type WindowDimensionsType = {
    width: number;
    height: number;
};

export default function FolderList() {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const folderHeight = 60;
    const foldersGap = 20;
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [foldersCount, setFoldersCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const fetchLimit = 10;
    const { setToast, setDismiss } = useToast();
    const { getFolders, getFoldersCount, deleteFolders } = useFolders();
    const position = useSharedValue<ContextMenuPositionType>(null);
    const contextMenuWidth = 200;
    const contextMenuHeight = useSharedValue<number>(0);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const windowDimensions = useSharedValue<WindowDimensionsType>({
        width: screenWidth,
        height: screenHeight,
    });
    const [folderSelected, setFolderSelect] = useState<FolderType | null>(null);
    const [selected, setSelected] = useState<FolderType[]>([]);
    const selectedShared = useSharedValue<boolean>(false);
    const selectLimit = 50;
    const foldersTmp = useRef<FolderType[]>([]);
    const deleteLoading = useRef<boolean>(false);

    const selectMap = useMemo(() => new Map(
        selected.map(f => [f.idFolder, f]),
    ), [selected]);

    const onFolderLongPress = useCallback((e: GestureResponderEvent, folder: FolderType) => {
        if (selectedShared.value) return;
        const { pageX, pageY } = e.nativeEvent;
        let x = pageX;
        let y = pageY;

        if (x > (screenWidth / 2)) {
            x = x - contextMenuWidth;
        }

        if (y > (screenHeight * .7)) {
            y = y - contextMenuHeight.value;
        }

        position.value = {
            x,
            y,
        };
        setFolderSelect(folder);
    }, [screenWidth, screenHeight]);

    const onFolderPress = useCallback((folder: FolderType) => {
        if (!selectedShared.value) return;
        const picked = selectMap.get(folder.idFolder);

        if (picked) {
            if (selectMap.size == 1) {
                handleClose();
            }
            else {
                setSelected(prev => [...prev.filter(f => f.idFolder != folder.idFolder)]);
            }
        }
        else {
            setSelected(prev => [...prev, folder]);
        }
    }, [selectMap]);

    const renderItem = useCallback(({ item: folder, index }: { item: FolderType; index: number }) => {
        return (
            <Animated.View style={{
                opacity: !folderSelected ?
                    1
                    :
                    (folderSelected.idFolder == folder.idFolder ? 1 : .5),
            }}>
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
                    className="w-full rounded-xl"
                >
                    <Pressable
                        delayLongPress={150}
                        onLongPress={(e) => onFolderLongPress(e, folder)}
                        onPress={() => onFolderPress(folder)}
                        className="w-full flex flex-row items-center gap-4"
                    >
                        {
                            selectMap.size > 0 && (
                                <View className="h-full pointer-events-none">
                                    <Checkbox
                                        size={30}
                                        borderWidth={1}
                                        borderRadius={10}
                                        checked={selectMap.has(folder.idFolder)}
                                    />
                                </View>
                            )
                        }

                        <View className={clsx(selectMap.size > 0 ? "max-w-[85%]" : "w-full")}>
                            <TextAnimated className="text-lg">
                                {folder.title}
                            </TextAnimated>
                        </View>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        );
    }, [folderSelected, selectMap, onFolderLongPress, onFolderPress]);

    const listFooterComponent = useCallback(() => {
        if (loading && !deleteLoading.current) {
            return (
                <View
                    style={{
                        gap: foldersGap,
                    }}
                    className="w-full flex items-center"
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
        if (!loading && !deleteLoading.current) {
            return (
                <View className="w-full flex justify-center items-center gap-4 pt-10">
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

    const handleGetFolders = useCallback(async () => {
        if (loading || deleteLoading.current) return;

        try {
            setLoading(true);
            const data = await getFolders(folders.length, fetchLimit) as FolderType[];

            setFolders(prev => [...prev, ...data.filter(item => !prev.includes(item))]);
            setLoading(false);
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error");
            console.log(e);
        }
    }, [loading, i18n.language, folders.length]);

    const handleGetFoldersCount = useCallback(async () => {
        try {
            const data = await getFoldersCount() as number;

            setFoldersCount(data);
        }
        catch (e) {
            console.log(e);
        }
    }, [loading, i18n.language, folders.length]);

    useEffect(() => {
        handleGetFoldersCount();
        handleGetFolders();
    }, []);

    const onEndReached = useCallback(async () => {
        if (loading || folders.length >= foldersCount) return;
        handleGetFolders();
    }, [loading, folders.length, foldersCount]);

    const contextMenuAnimation = useAnimatedStyle(() => ({
        left: position.value?.x ?
            withTiming(position.value.x, {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
            :
            withDelay(
                200,
                withTiming(0, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
        top: position.value?.y ?
            withTiming(position.value.y, {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
            :
            withDelay(
                200,
                withTiming(0, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
        opacity: position.value ?
            withDelay(
                200,
                withTiming(1, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                })
            )
            :
            withTiming(0, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            }),
        transform: [
            {
                scale: position.value ?
                    withDelay(
                        200,
                        withTiming(1, {
                            duration: 300,
                            easing: Easing.inOut(Easing.quad),
                        }),
                    )
                    :
                    withTiming(0, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
            }
        ],
        pointerEvents: position.value ? "auto" : "none",
    }));

    useEffect(() => {
        windowDimensions.value.width = screenWidth;
        windowDimensions.value.height = screenHeight;
    }, [screenWidth, screenHeight]);

    const chevronSelectAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: (position.value || selectedShared.value) ?
                    withTiming(0, {
                        duration: 300,
                        easing: Easing.inOut(Easing.linear),
                    })
                    :
                    withSpring(1, {
                        stiffness: 50,
                        damping: 5,
                        mass: 1,
                    })
            }
        ]
    }));

    const xMarkSelectAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: !position.value && !selectedShared.value ?
                    withTiming(0, {
                        duration: 300,
                        easing: Easing.inOut(Easing.linear),
                    })
                    :
                    withSpring(1, {
                        stiffness: 50,
                        damping: 5,
                        mass: 1,
                    })
            }
        ]
    }));

    const handleClose = useCallback(() => {
        position.value = null;
        setFolderSelect(null);
        setSelected([]);
    }, []);

    const handleReturnButtonPress = useCallback(() => {
        if (folderSelected || selectMap.size > 0) {
            handleClose();
        }
        else {
            if (router.canGoBack()) {
                router.back();
            }
            else {
                router.navigate({
                    pathname: "/(protected)/(tabs)"
                });
            }
        }
    }, [folderSelected, selectMap]);

    const toolsBarAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: -20,
            },
            {
                translateY: withTiming(selectedShared.value ? -40 : 100, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
        ],
        pointerEvents: selectedShared.value ? "auto" : "none",
        opacity: selectedShared.value ?
            withTiming(1, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            })
            :
            withTiming(0, {
                duration: 100,
                easing: Easing.inOut(Easing.quad),
            })
    }));

    useEffect(() => {
        selectedShared.value = selected.length > 0;
    }, [selected]);

    useEffect(() => {
        const onBackPress = () => {
            if (position.value || selectedShared.value) {
                handleClose();

                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => remove();
    }, []);

    const handleCheckBoxPress = useCallback(() => {
        if (!selectedShared.value) return;

        if (selected.length == folders.length) {
            handleClose();
        }
        else {
            const data = [...folders]
                .map((f, i) => i >= selectLimit ? null : f)
                .filter(f => f != null);

            setSelected(data);
        }
    }, [selected, folders]);

    const areAllSelected = useMemo(() => {
        if (selectMap.size == 0) return false;

        if (selectMap.size == folders.length) {
            return true;
        }

        return false;
    }, [selected, folders]);

    const handleDeleteFolders = useCallback(async (init: boolean = true, entry: FolderType[] = []) => {
        if ((deleteLoading.current && init) || (selectMap.size == 0 && !folderSelected)) return;
        if (init) {
            setLoading(true);
            deleteLoading.current = true;

            const data = folderSelected ?
                [folderSelected]
                :
                [...selected];

            foldersTmp.current = [...folders];
            if (folderSelected) {
                setFolders(prev => [...prev.filter(f => f.idFolder != folderSelected.idFolder)]);
                setFoldersCount(prev => prev - 1);
            }
            else {
                setFolders(prev => [...prev.filter(f => !selectMap.has(f.idFolder))]);
                setFoldersCount(prev => prev - data.length);
            }
            handleClose();

            setDismiss(
                () => {
                    handleDeleteFolders(false, data);
                },
                () => {
                    foldersTmp.current.length > 0 && setFolders([...foldersTmp.current]);
                    setFoldersCount(prev => prev + data.length);
                    foldersTmp.current = [];
                    setLoading(false);
                    deleteLoading.current = false;
                }
            );

            return;
        }

        try {
            await deleteFolders(entry.map(f => f.idFolder));
            event.emit(FOLDERS_CHANGED);
            setLoading(false);
            deleteLoading.current = false;
            setToast(t("folders_list_folders_deleted", { many: entry.length > 1 ? "s" : "" }), "success");
        }
        catch (e) {
            foldersTmp.current.length > 0 && setFolders([...foldersTmp.current]);
            setFoldersCount(prev => prev + entry.length);
            setToast(t("sqlite_error"), "error");
            foldersTmp.current = [];
            setLoading(false);
            deleteLoading.current = false;
            console.log(e);
        }
    }, [selected, folders, i18n.language, setDismiss, setToast, selectMap, folderSelected]);

    const tapGesture = useMemo(() => {
        return (
            Gesture.Tap()
                .maxDistance(5)
                .maxDuration(100)
                .onEnd(({ x, y }) => {
                    if (position.value) {
                        if (
                            (
                                x >= position.value.x
                                &&
                                x <= (position.value.x + contextMenuWidth)
                            )
                            &&
                            (
                                y >= position.value.y
                                &&
                                y <= (position.value.y + contextMenuHeight.value)
                            )
                        ) {
                            return;
                        }

                        scheduleOnRN(setFolderSelect, null);
                        position.value = null;
                    }
                })
        );
    }, []);

    const handlePress = useCallback((value: "edit" | "duplicate") => {
        if (!folderSelected) return;
        router.navigate({
            pathname: "/(protected)/(folder)/create",
            params: {
                folder: JSON.stringify(folderSelected),
                action: value,
            }
        });
        handleClose();
    }, [folderSelected]);

    return (
        <Container centerX>
            <GestureDetector gesture={tapGesture}>
                <View className="size-full flex items-center">

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
                                    ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 0)"]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                locations={[0, .6, 1]}
                                className="w-full flex flex-row justify-between items-center gap-2 px-3 pt-2 pb-8"
                            >
                                <PressableAnimated
                                    scale={.95}
                                    onPress={handleReturnButtonPress}
                                    className="size-[50px] rounded-full dark:bg-black bg-white"
                                >
                                    <View className="size-full flex justify-center items-center rounded-full dark:bg-white/10 bg-white border-2 dark:border-white/5 border-white/5">
                                        <Animated.View
                                            style={xMarkSelectAnimation}
                                            className="absolute"
                                        >
                                            <FontAwesome6
                                                name="xmark"
                                                size={25}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                            />
                                        </Animated.View>

                                        <Animated.View style={chevronSelectAnimation}>
                                            <Entypo
                                                name="chevron-left"
                                                size={30}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                            />
                                        </Animated.View>
                                    </View>
                                </PressableAnimated>

                                <View className="w-[85%]">
                                    <TextAnimated
                                        numberOfLines={1}
                                        className="text-xl tracking-wide"
                                    >
                                        {t("folders_list_title")}
                                    </TextAnimated>
                                </View>
                            </LinearGradient>
                        </LinearGradient>
                    </View>

                    {/* Context menu */}

                    <Animated.View
                        onLayout={(e) => contextMenuHeight.value = e.nativeEvent.layout.height}
                        style={[
                            contextMenuAnimation,
                            {
                                width: contextMenuWidth,
                            }
                        ]}
                        className="absolute dark:bg-black bg-white rounded-xl z-[10]"
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
                            className="absolute left-0 top-0 size-full dark:bg-black/50 bg-black/30 rounded-xl"
                        />

                        <View className="size-full flex items-center gap-5 px-5 py-4 rounded-xl dark:bg-white/10 bg-white border-2 dark:border-white/5 border-black/5">
                            <PressableAnimated
                                scale={.95}
                                onPress={() => {
                                    if (folderSelected) {
                                        setFolderSelect(null);
                                        setSelected([folderSelected]);
                                    }
                                    position.value = null;
                                }}
                                className="w-full flex flex-row items-center gap-[16px]"
                            >
                                <View>
                                    <FontAwesome6
                                        name="list-check"
                                        size={20}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </View>

                                <View className="max-w-[75%]">
                                    <TextAnimated className="text-lg">
                                        {t("folders_list_select")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>

                            <PressableAnimated
                                scale={.95}
                                onPress={() => handlePress("edit")}
                                className="w-full flex flex-row items-center gap-4"
                            >
                                <View>
                                    <MaterialCommunityIcons
                                        name="folder-edit"
                                        size={24}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </View>

                                <View className="max-w-[75%]">
                                    <TextAnimated className="text-lg">
                                        {t("folders_list_edit")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>

                            <PressableAnimated
                                scale={.95}
                                onPress={() => handlePress("duplicate")}
                                className="w-full flex flex-row items-center gap-5"
                            >
                                <View>
                                    <Ionicons
                                        name="duplicate"
                                        size={22}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </View>

                                <View className="max-w-[75%]">
                                    <TextAnimated className="text-lg">
                                        {t("folders_list_duplicate")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>

                            <PressableAnimated
                                scale={.95}
                                onPress={() => handleDeleteFolders()}
                                className="w-full flex flex-row items-center gap-5"
                            >
                                <View>
                                    <Entypo
                                        name="trash"
                                        size={22}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </View>

                                <View className="max-w-[75%]">
                                    <TextAnimated className="text-lg">
                                        {t("folders_list_delete")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>
                        </View>
                    </Animated.View>

                    {/* Content */}

                    <FlatList
                        horizontal={false}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={.1}
                        updateCellsBatchingPeriod={0}
                        scrollEventThrottle={16}
                        maxToRenderPerBatch={fetchLimit}
                        data={folders}
                        keyExtractor={(item) => item.idFolder}
                        renderItem={renderItem}
                        ListEmptyComponent={listEmptyComponent}
                        ListFooterComponent={listFooterComponent}
                        onEndReached={onEndReached}
                        className="w-full h-full"
                        contentContainerStyle={{
                            gap: foldersGap,
                        }}
                        contentContainerClassName="w-full flex px-5 pt-[100px] pb-[50px]"
                    />

                    {/* Tools bar */}

                    <Animated.View
                        style={toolsBarAnimation}
                        className="absolute right-0 bottom-0 w-[250px] dark:bg-black bg-white rounded-xl z-[20]"
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
                            className="absolute left-0 top-0 size-full dark:bg-black/50 bg-black/30 rounded-xl"
                        />

                        <View className="w-full flex flex-row justify-between items-center gap-3 px-3 dark:bg-white/10 bg-white rounded-xl py-3 border-2 dark:border-white/5 border-black/5">
                            <View className="max-w-[60%]">
                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl"
                                >
                                    {t("folders_list_selected_count", { many: selected.length > 1 ? "s" : "" })} ({selected.length})
                                </TextAnimated>
                            </View>

                            <View className="flex flex-row items-center gap-4">
                                <View>
                                    <Checkbox
                                        borderWidth={1}
                                        checked={areAllSelected}
                                        onPress={handleCheckBoxPress}
                                    />
                                </View>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => handleDeleteFolders()}
                                    className="w-[30px] flex justify-center items-center"
                                >
                                    <View>
                                        <Entypo
                                            name="trash"
                                            size={25}
                                            color={COLORS.red[500]}
                                        />
                                    </View>
                                </PressableAnimated>
                            </View>
                        </View>
                    </Animated.View>

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
                </View>
            </GestureDetector>
        </Container>
    );
}