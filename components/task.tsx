import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { TaskType } from "@/types/task";
import { dateGraduation } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Link, useRouter } from "expo-router";
import { memo, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";
import { TextAnimated } from "./text-animated";

export interface TaskProps extends PressableProps {
    task: TaskType;
    longPress?: () => void;
    selected?: boolean;
    loading?: boolean;
    selectedNumber?: number;
}

/**
 * 
 * @param task Task task
 * 
 * @param longPress Task long press
 * 
 * @param selected Whether the task is selected
 * @default false
 * 
 * @param loading Whether the task is loading
 * @default false
 * 
 * @param selectedNumber Selected number
 * 
 * @returns Task component
 */

export const Task = memo(({ task, longPress, selected = false, loading = false, selectedNumber, ...rest }: TaskProps) => {
    const { theme } = useTheme();
    const [layout, setLayout] = useState<{
        width: number;
        height: number;
    }>({
        width: 0,
        height: 0,
    });
    const router = useRouter();
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const { setToast } = useToast();
    const isSelected = useSharedValue<boolean>(false);

    useEffect(() => {
        isSelected.value = selected;
    }, [selected]);

    const animation = useAnimatedStyle(() => ({
        opacity: withTiming(isSelected.value ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.quad)
        }),
        zIndex: selected ? 1 : -1
    }))

    const handleUpdate = async () => {
        try {
            setUpdateLoading(true);
            const res = await api.patch(`/task/update/${task.idTask}`, {
                ...task,
                done: !task.done
            });

            if (res.status !== 200) {
                setToast("Une erreur s'est produite", "error");
                return;
            }
            setToast("Tâche modifiée ☺️", "success");
            setUpdateLoading(false);
            setTimeout(() => {
                router.replace("/");
            }, 500);
        }
        catch (error) {
            setUpdateLoading(false);
            setToast("Une erreur s'est produite", "error");
        }
    }

    return (
        <Pressable
            {...rest}
            onLayout={(e) => setLayout({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
            })}
            delayLongPress={150}
            onLongPress={() => longPress && longPress()}
            className="w-full dark:bg-black bg-white rounded-2xl overflow-hidden border dark:border-white/30 border-black/20"
        >
            <View className="w-full flex items-center gap-3 dark:bg-white/20 bg-white p-5 overflow-hidden rounded-2xl">
                <Animated.View
                    style={[{
                        width: layout.width,
                        height: layout.height,
                    }, animation]}
                    className="absolute flex justify-center items-center dark:bg-black/80 bg-white/80 rounded-2xl"
                >
                    <View
                        style={{
                            width: 100,
                            height: 100,
                        }}
                        className="flex justify-center items-center rounded-full border-2 dark:border-white/20 border-black/20 dark:bg-white/30 bg-black/30"
                    >
                        {
                            selectedNumber && (
                                <TextAnimated className="text-3xl font-extrabold tracking-widest">
                                    {selectedNumber}
                                </TextAnimated>
                            )
                        }
                    </View>
                </Animated.View>

                <TextAnimated className="text-lg">
                    {task.content}
                </TextAnimated>

                <View className="w-full flex flex-row items-center gap-3">
                    <TextAnimated className="text-lg">
                        Statut :
                    </TextAnimated>
                    <View>
                        {
                            task.done
                                ?
                                (
                                    <View className="flex flex-row items-center gap-4">
                                        <TextAnimated className="text-lg font-bold">
                                            faite
                                        </TextAnimated>
                                        <FontAwesome5
                                            name="check"
                                            size={18}
                                            color={COLORS.emerald[500]}
                                        />
                                    </View>
                                )
                                :
                                (
                                    <View className="flex flex-row items-center gap-4">
                                        <TextAnimated className="text-lg font-bold">
                                            en attente
                                        </TextAnimated>
                                        <FontAwesome6
                                            name="xmark"
                                            size={19}
                                            color="red"
                                        />
                                    </View>
                                )
                        }
                    </View>
                </View>
                {
                    updateLoading && (
                        <ActivityIndicator size={25} color={theme === "dark" ? "white" : "black"} />
                    )
                }
                {
                    !updateLoading && !task.done && (
                        <PressableAnimated
                            scale={.9}
                            onPress={() => handleUpdate()}
                            className="flex flex-row items-center gap-4 self-start shrink dark:bg-white/15 bg-black/10 p-3 border dark:border-white/20 border-black/20 rounded-2xl"
                        >
                            <Text className="text-lg dark:text-white text-black">Marquer comme faite ?</Text>
                            <FontAwesome5 name="check" size={18} color={COLORS.emerald[500]} />
                        </PressableAnimated>
                    )
                }
                <View className="w-full flex flex-row items-center gap-1">
                    <TextAnimated className="dark:text-white text-lg">
                        Créée
                    </TextAnimated>
                    <TextAnimated className="dark:text-white text-lg">
                        {dateGraduation(task.createdAt)}
                    </TextAnimated>
                </View>
                <View className="w-full flex flex-row items-center gap-1">
                    <TextAnimated className="text-lg">
                        Faite ou modifiée
                    </TextAnimated>
                    <TextAnimated className="text-lg">
                        {dateGraduation(task.updatedAt)}
                    </TextAnimated>
                </View>
                <View className="w-full flex flex-row justify-end items-center gap-3 px-3">
                    <PressableAnimated>
                        <Link href={{
                            pathname: "/[id]",
                            params: {
                                id: task.idTask ?? ""
                            }
                        }}>
                            <FontAwesome5 name="edit" size={22} color="rgb(16, 185, 129)" />
                        </Link>
                    </PressableAnimated>
                </View>
            </View>
        </Pressable>
    );
});