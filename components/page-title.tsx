import { useAuth } from "@/hooks/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { supabase } from "@/lib/supabase";
import { fileDatas } from "@/utils/tools";
import { createId } from "@paralleldrive/cuid2";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ReactNode, useState } from "react";
import { Text, View } from "react-native";
import { Avatar } from "./avatar";
import { PressableAnimated } from "./pressable-animated";

interface Props {
    icon?: ReactNode;
    title: string;
}

/**
 * 
 * @param icon Page title icon
 * 
 * @param title Page title title
 * @returns Page title component
 */

export const PageTitle = ({ icon, title }: Props) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [image, setImage] = useState<string | null>(null);
    const { setToast } = useToast();
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const { user } = useAuth();
    const router = useRouter();

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            setToast("Nous avons besoin de votre permission pour acceder à vos fichiers", "warning");
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
                    return setToast("Fichier corrompu ou illisible !", "error");
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
                setToast("Aucun fichier sélectionné 🥲", "warning");
            }
            setSaveLoading(false);
        }
        catch (error) {
            setSaveLoading(false);
            setToast("Une erreur s'est produite", "error");
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
            setToast("Une erreur s'est produite", "error");
        }
    }

    return (
        <View className="w-full flex flex-row justify-between items-center px-4">
            <View className="w-[70%] flex flex-row items-center gap-3">
                {icon}
                <Text
                    numberOfLines={1}
                    className="max-w-[80%] text-xl text-emerald-500 font-extrabold tracking-widest"
                >
                    {title}
                </Text>
            </View>

            <PressableAnimated
                className="size-[50px] rounded-full p-1"
                onPress={() => router.navigate("/profile")}
            >
                {
                    user && !user.user_metadata.photoUrl && (
                        <Avatar
                            name={user.user_metadata.name}
                            size={50}
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
        </View >
    );
} 