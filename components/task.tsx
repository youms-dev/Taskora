import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { TaskType } from "@/types/task";
import { dateGraduation } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Link } from "expo-router";
import { memo, useState } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text, View, ViewProps } from "react-native";
import { PressableAnimated } from "./pressable-animated";
import { TextAnimated } from "./text-animated";

export interface TaskProps extends ViewProps {
    task: TaskType;
    onRefresh?: () => void;
}

/**
 * 
 * @param task Task task
 * 
 * @param onRefresh THe refresh method that will be call when the component will have to refresh himself
 * 
 * @returns Task component
 */

export const Task = memo(({ task, onRefresh, ...rest }: TaskProps) => {
    const { theme } = useTheme();
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const { setToast } = useToast();

    const handleUpdate = async () => {
        try {
            setUpdateLoading(true);
            await api.patch(`/task/update/${task.idTask}`, {
                ...task,
                done: !task.done
            });

            setToast("Tâche modifiée ☺️", "success");
            setUpdateLoading(false);
            onRefresh && onRefresh();
        }
        catch (e) {
            setToast("Une erreur s'est produite", "error");
            setUpdateLoading(false);
            setToast("Une erreur s'est produite", "error");
            console.log(e);
        }
    }

    return (
        <View
            {...rest}
            className="w-full dark:bg-black bg-white rounded-2xl overflow-hidden border dark:border-white/30 border-black/20"
        >
            <View className="w-full flex items-center gap-3 dark:bg-white/10 bg-white p-5 overflow-hidden rounded-2xl">
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
                                id: task.idTask
                            }
                        }}>
                            <FontAwesome5 name="edit" size={22} color="rgb(16, 185, 129)" />
                        </Link>
                    </PressableAnimated>
                </View>
            </View>
        </View>
    );
});