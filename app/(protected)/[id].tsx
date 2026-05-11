import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Loader } from "@/components/loader";
import { PressableAnimated } from "@/components/pressable-animated";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import { checkLength } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { api } from "../../lib/axios";

export default function Update() {
    const params = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const { setToast } = useToast();
    const [task, setTask] = useState<Task | null>(null);
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const { theme } = useTheme();

    useEffect(() => {
        if (!params || !params.id) {
            router.replace("/");
            return;
        }
    }, [params]);

    const getTask = async () => {
        if (!params.id) return;

        try {
            setLoading(true);
            const res = await api.post(`/task/find/${params.id}`);

            setLoading(false);
            setTask(res.data);
        }
        catch (error) {
            setLoading(false);
            setToast("Une erreur s'est produite", "error");
        }
    }

    useEffect(() => {
        getTask();
    }, []);

    const handleUpdate = async (done: boolean = false) => {
        if (updateLoading || !task) return;
        else if (task.content.length === 0) {
            setToast("Veuillez renseigner la tâche !", "warning");
            return;
        }
        if (!checkLength(task.content, [3, null])) {
            setToast("La longueur minimale requise est de 3", "warning");
            return;
        }
        const contentFormatted = task.content.charAt(0).toUpperCase() + task.content.slice(1);

        try {
            setUpdateLoading(true);
            await api.patch(`/task/update/${params.id}`, {
                ...task,
                content: contentFormatted,
                done
            });

            setToast("Tâche modifiée 😊", "success");
            getTask();
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
        <Container centerX>
            {
                loading && (
                    <View className="w-full h-full flex justify-center items-center">
                        <Loader />
                    </View>
                )
            }
            {
                !loading && task && (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "android" ? "padding" : "height"}
                        className="w-full h-full flex items-center gap-8 pt-8 px-3"
                    >
                        <View className="w-full flex flex-row justify-center">
                            <Text className="text-3xl text-emerald-500 font-bold tracking-widest">Modifiez votre tâche</Text>
                        </View>
                        <Input
                            placeholder="Description"
                            big
                            value={task.content}
                            onChangeText={(e) => setTask({
                                ...task,
                                content: e
                            })}
                        />
                        {
                            updateLoading && (
                                <ActivityIndicator size={30} color={theme === "dark" ? "white" : COLORS.emerald[500]} />
                            )
                        }
                        {
                            !updateLoading && (
                                <PressableAnimated
                                    scale={.9}
                                    onPress={() => handleUpdate(!task.done)}
                                    className="flex flex-row items-center gap-4 self-start shrink dark:bg-white/15 bg-black/10 p-3 border dark:border-white/20 border-black/20 rounded-2xl"
                                >
                                    <Text className="text-lg dark:text-white text-black">
                                        {
                                            task.done ? "Marquer comme en attente" : "Marquer comme faite ?"
                                        }
                                    </Text>
                                    {
                                        task.done && (
                                            <FontAwesome6 name="xmark" size={18} color="red" />
                                        )
                                    }
                                    {
                                        !task.done && (
                                            <FontAwesome5 name="check" size={18} color={COLORS.emerald[500]} />
                                        )
                                    }
                                </PressableAnimated>
                            )
                        }
                        <Button
                            loading={updateLoading}
                            loaderSize={30}
                            onPress={() => handleUpdate()}
                            className="w-[300px] h-[60px]"
                        >
                            <Text className="text-2xl text-black font-bold tracking-widest">Modifier</Text>
                            <FontAwesome5 name="edit" size={25} color="black" />
                        </Button>
                    </KeyboardAvoidingView>
                )
            }
        </Container >
    );
}