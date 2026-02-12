import { api } from "@/app/lib/axios";
import { colors } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { Task as TaskType } from "@/types/task";
import { dateGraduation } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable";
import { Toast, ToastProps } from "./toast";

interface Props extends PressableProps {
    task: TaskType;
    longPress?: () => void;
    selected?: boolean;
    loading?: boolean;
    selectedNumber?: number;
}

export const Task = ({ task, longPress, selected = false, loading = false, selectedNumber, ...rest }: Props) => {
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
    const [toast, setToast] = useState<Omit<ToastProps, "onCancel">>({
        show: false,
        message: "",
        top: 0,
        type: "default"
    });
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
                setToast({
                    show: true,
                    message: "Une erreur s'est produite",
                    type: "error",
                });
                return;
            }
            setToast({
                show: true,
                message: "Tâche modifiée ☺️",
                type: "success",
            });
            setUpdateLoading(false);
            setTimeout(() => {
                router.replace("/");
            }, 500);
        }
        catch (error) {
            setUpdateLoading(false);
            setToast({
                show: true,
                message: "Une erreur s'est produite",
                type: "error",
            });
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
            // android_ripple={{
            //     color: task.done ? colors.emerald[100] : colors.red[100],
            //     foreground: true,
            // }}
            onLongPress={() => longPress && longPress()}
            className="relative w-full flex flex-col gap-3 dark:bg-white/10 bg-black/5 rounded-2xl p-5 dark:border-0 border border-black/20 overflow-hidden text-emerald-100"
        >
            <Animated.View
                style={[{
                    width: layout.width,
                    height: layout.height,
                }, animation]}
                className="absolute flex justify-center items-center dark:bg-black/80 bg-white/80 rounded-2xl border-2 dark:border-white/20 border-black/20"
            >
                <View
                    style={{
                        width: 100,
                        height: 100,
                    }}
                    className="flex justify-center items-center rounded-full border-2 dark:border-white/20 border-black/20 dark:bg-white/30 bg-black/30"
                >
                    <Text className="text-3xl dark:text-white text-black font-extrabold tracking-widest">
                        {selectedNumber}
                    </Text>
                </View>
            </Animated.View>
            <Text className="dark:text-white text-lg text-black">
                {task.content}
            </Text>
            <View className="w-full flex flex-row items-center gap-3">
                <Text className="dark:text-white text-lg text-black">Statut :</Text>
                <Text className="dark:text-white text-lg text-black">
                    {
                        task.done
                            ?
                            (
                                <View className="flex flex-row items-center gap-4">
                                    <Text className="text-lg dark:text-white text-black font-bold">faite</Text>
                                    <FontAwesome5 name="check" size={18} color={colors.emerald[500]} />
                                </View>
                            )
                            :
                            (
                                <View className="flex flex-row items-center gap-4">
                                    <Text className="text-lg dark:text-white text-black font-bold">en attente</Text>
                                    <FontAwesome6 name="xmark" size={19} color="red" />
                                </View>
                            )
                    }
                </Text>
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
                        <FontAwesome5 name="check" size={18} color={colors.emerald[500]} />
                    </PressableAnimated>
                )
            }
            <View className="w-full flex flex-row items-center gap-1">
                <Text className="dark:text-white text-lg text-black">Créée</Text>
                <Text className="dark:text-white text-lg text-black">
                    {dateGraduation(task.createdAt)}
                </Text>
            </View>
            <View className="w-full flex flex-row items-center gap-1">
                <Text className="dark:text-white text-lg text-black">Faite ou modifiée</Text>
                <Text className="dark:text-white text-lg text-black">
                    {dateGraduation(task.updatedAt)}
                </Text>
            </View>
            <View className="w-full flex flex-row justify-end items-center gap-3 px-3">
                <PressableAnimated>
                    <Link
                        href={{
                            pathname: "/[id]",
                            params: {
                                id: task.idTask ?? ""
                            }
                        }}
                    >
                        <FontAwesome5 name="edit" size={22} color="rgb(16, 185, 129)" />
                    </Link>
                </PressableAnimated>
            </View>

            <Toast
                show={toast.show}
                message={toast.message}
                top={toast.top}
                type={toast.type}
                onCancel={() => setToast({
                    ...toast,
                    show: false,
                })}
            />
        </Pressable>
    );
}