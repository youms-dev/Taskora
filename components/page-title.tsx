import { colors } from "@/constants/colors";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button } from "./Button";
import * as ImagePicker from "expo-image-picker";
import { Modal } from "./modal";
import { Toast, ToastType } from "./toast";
import { PressableAnimated } from "./pressable";
import { supabase } from "@/app/lib/supabase";
import { fileDatas } from "@/utils/tools";
import { createId } from "@paralleldrive/cuid2";
import { File } from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { useAuth } from "@/hooks/auth-provider";
import { Picture } from "./picture";
import { api } from "@/app/lib/axios";

interface Props {
    page: number;
}

export const PageTitle = ({ page }: Props) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [image, setImage] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type?: ToastType;
        top?: number;
    }>({
        show: false,
        message: "",
        type: "default",
    });
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const { user } = useAuth();

    const pageDatas = [
        {
            name: "Liste des tâches",
            icon: "list-check"
        },
        {
            name: "Paramètres",
            icon: "gears"
        },
    ]

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            setToast({
                show: true,
                message: "Nous avons besoin de votre permission pour acceder à vos fichiers",
                type: "warning",
                top: -100
            });
            return;
        }

        const { canceled, assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        try {
            setSaveLoading(true);
            if (!canceled && assets) {
                setImage(assets[0].uri);
                const file = assets[0];
                const { name, ext } = fileDatas(String(file.fileName));
                const date = new Date();
                const base64 = new File(file.uri).base64Sync();

                if (!name || !ext) {
                    return setToast({
                        show: true,
                        message: "Fichier corrompu ou illisible !",
                        type: "error",
                        top: -100
                    });
                }

                if (user && user.user_metadata.photoUrl) {
                    await supabase.storage.from("files").remove([user.user_metadata.photoUrl]);
                }
                const newName = name + date.getMilliseconds() + createId() + "." + ext;
                const { data } = await supabase.storage.from("files").upload(newName, decode(base64), {
                    upsert: true,
                });

                if (data) {
                    await api.patch(`/user/update/${user?.id}`, {
                        photoUrl: data.path,
                    });
                    await supabase.auth.refreshSession();
                }
            }
            else {
                setToast({
                    show: true,
                    message: "Aucun fichier sélectionné 🥲",
                    type: "warning",
                    top: -100
                });
            }
            setSaveLoading(false);
        }
        catch (error) {
            setSaveLoading(false);
            setToast({
                show: true,
                message: "Une erreur s'est produite",
                type: "error",
                top: -100
            });
        }
    };

    const removePicture = async () => {
        if (!user || !user.user_metadata.photoUrl) return;
        try {
            setSaveLoading(true);
            await api.patch(`/user/update/${user?.id}`, {
                photoUrl: false,
            });
            await supabase.storage.from("files").remove([user.user_metadata.photoUrl]);
            await supabase.auth.refreshSession();
            setSaveLoading(false);
        }
        catch (error) {
            setSaveLoading(false);
            setToast({
                show: true,
                message: "Une erreur s'est produite",
                type: "error",
                top: -100
            });
        }
    }

    return (
        <View className="w-full flex flex-row justify-between items-center px-4">

            <View className="w-3/4 flex flex-row items-center gap-3">
                <FontAwesome6
                    name={pageDatas[page].icon}
                    size={22}
                    color={colors.emerald[500]}
                />
                <Text
                    className="relative w-max text-3xl text-emerald-500 font-extrabold tracking-widest underline"
                >
                    {pageDatas[page].name}

                </Text>
            </View>
            <PressableAnimated
                className="size-[60px] rounded-full p-1"
                onPress={() => setVisible(true)}
            >
                {
                    user && !user.user_metadata.photoUrl && (
                        <Picture
                            name={user.user_metadata.name}
                            size={50}
                            textSize={22}
                        />
                    )
                }
                {
                    user && user.user_metadata.photoUrl && (
                        <Image
                            source={{ uri: process.env.EXPO_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/files/" + user.user_metadata.photoUrl }}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 9999,
                            }}
                            contentFit="cover"
                        />
                    )
                }
            </PressableAnimated>

            <Modal
                visible={visible}
                onClose={() => setVisible(false)}
            >
                <View className="w-full h-full flex flex-col items-center">
                    <View className="w-full flex flex-row items-center gap-3 px-3">
                        <FontAwesome5 name="user-tie" size={20} color={colors.emerald[500]} />
                        <Text className="text-3xl text-emerald-500">Profile</Text>
                    </View>
                    <View className="w-full flex flex-col justify-center items-center mt-10">
                        <View className="size-[250px] rounded-[9999px] p-4">
                            {
                                user && !user.user_metadata.photoUrl && (
                                    <Picture
                                        name={user.user_metadata.name}
                                        size={"full"}
                                        textSize={90}
                                    />
                                )
                            }
                            {
                                user && user.user_metadata.photoUrl && (
                                    <Image
                                        source={{ uri: process.env.EXPO_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/files/" + user.user_metadata.photoUrl }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderWidth: 1,
                                            borderRadius: 9999,
                                        }}
                                        contentFit="cover"
                                    />
                                )
                            }
                        </View>
                        {
                            user && user.user_metadata.photoUrl && (
                                <View className="w-full flex flex-row justify-center px-3 mt-5">
                                    <Button
                                        className="w-[300px] h-[50px]"
                                        background="bg-red-500"
                                        loaderSize={35}
                                        loading={saveLoading}
                                        onPress={() => removePicture()}
                                    >
                                        <FontAwesome6 name="xmark" size={30} color="black" />
                                        <Text className="text-2xl text-black font-bold">Retirer</Text>
                                    </Button>
                                </View>
                            )
                        }
                        <View className="w-full flex flex-row justify-center px-3 mt-5">
                            <Button
                                className="w-[300px] h-[50px]"
                                loaderSize={35}
                                loading={saveLoading}
                                onPress={() => pickImage()}
                            >
                                <FontAwesome name="photo" size={30} color="black" />
                                <Text className="text-2xl text-black font-bold">Choisir une photo</Text>
                            </Button>
                        </View>
                        <Toast
                            show={toast.show}
                            message={toast.message}
                            type={toast.type}
                            top={toast.top}
                            onCancel={() => setToast({
                                ...toast,
                                show: false,
                            })}
                        />
                    </View>
                </View>
            </Modal>
        </View >
    );
} 