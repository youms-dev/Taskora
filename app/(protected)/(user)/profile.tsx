import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { Eye } from "@/components/eye";
import { Modal } from "@/components/modal";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { AUTH_STORAGE } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

export default function Profile() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [modalActive, setModalActive] = useState<boolean>(false);
    const [cameraModalActive, setCameraModalActive] = useState<boolean>(false);
    const router = useRouter();

    const handleSignOut = async () => {
        const { getItem, setItem } = useAsyncStorage(AUTH_STORAGE);
        const exists = await getItem();

        if (exists != null) {
            await setItem(JSON.stringify({
                verified: false
            }));
        }
        supabase.auth.signOut();
    }

    return (
        <Container centerX>
            <View className="w-full h-[50px] flex flex-row items-center mb-5 px-3">
                <View className="w-[190px] dark:bg-white bg-black rounded-[50px]">
                    <View className="flex flex-row items-center gap-6 dark:bg-black/85 bg-white/90 rounded-[50px]">
                        <PressableAnimated
                            onPress={() => router.back()}
                            className="size-[50px] dark:bg-black bg-black rounded-full"
                        >
                            <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full border dark:border-white/20 border-white">
                                <Entypo
                                    name="chevron-left"
                                    size={25}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .9)"}
                                />
                            </View>
                        </PressableAnimated>

                        <View className="h-full flex flex-row items-center gap-3">
                            <TextAnimated
                                dark={COLORS.emerald[500]}
                                light={COLORS.emerald[500]}
                                className="text-2xl font-bold"
                            >
                                {t("profile")}
                            </TextAnimated>

                            <AntDesign
                                name="user"
                                size={25}
                                color={COLORS.emerald[500]}
                            />
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="w-full h-full"
                contentContainerClassName="w-full flex items-center pb-[100px]"
            >
                <View>
                    <Avatar
                        size={200}
                        name="Youmbi Le-duc"
                    />

                    <PressableAnimated
                        scale={.8}
                        onPress={() => setCameraModalActive(true)}
                        className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-3 shadow-lg shadow-black"
                    >
                        <FontAwesome
                            name="camera"
                            size={25}
                            color="rgba(0, 0, 0, 1)"
                        />
                    </PressableAnimated>
                </View>

                <View className="w-full flex items-center gap-10 mt-16">
                    <View className="w-full flex flex-row items-center px-3">
                        <View className="flex flex-row gap-8">
                            <View className="translate-y-4">
                                <FontAwesome5
                                    name="user-alt"
                                    size={20}
                                    color={theme == "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"}
                                />
                            </View>

                            <View className="flex gap-2 pr-[120px]">
                                <View className="flex flex-row gap-5">
                                    <TextAnimated className="text-xl">
                                        {t("name")}
                                    </TextAnimated>

                                    <PressableAnimated scale={.8}>
                                        <FontAwesome5
                                            name="user-edit"
                                            size={20}
                                            color={COLORS.emerald[500]}
                                        />
                                    </PressableAnimated>
                                </View>

                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl"
                                >
                                    Lorem ipsum dolor sit amet.
                                </TextAnimated>
                            </View>
                        </View>
                    </View>

                    <View className="w-full flex flex-row items-center px-3">
                        <View className="flex flex-row gap-8">
                            <View className="translate-y-4">
                                <FontAwesome5
                                    name="envelope-open-text"
                                    size={20}
                                    color={theme == "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"}
                                />
                            </View>

                            <View className="flex gap-2 pr-[120px]">
                                <View className="flex flex-row gap-5">
                                    <TextAnimated className="text-xl">
                                        {t("email")}
                                    </TextAnimated>

                                    <PressableAnimated scale={.8}>
                                        <MaterialCommunityIcons
                                            name="email-edit"
                                            size={23}
                                            color={COLORS.emerald[500]}
                                        />
                                    </PressableAnimated>
                                </View>

                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl"
                                >
                                    Lorem ipsum dolor sit amet.
                                </TextAnimated>
                            </View>
                        </View>
                    </View>

                    <View className="w-full px-3">
                        <PressableAnimated
                            scale={1}
                            className="flex flex-row self-start items-center gap-8"
                        >
                            <Octicons
                                name="passkey-fill"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8))" : "rgba(0, 0, 0, .8)"}
                            />

                            <TextAnimated className="text-xl">
                                {t("change_password")}
                            </TextAnimated>
                        </PressableAnimated>
                    </View>

                    <View className="w-full px-3 rounded-2xl">
                        <PressableAnimated
                            onPress={() => setModalActive(true)}
                            className="flex flex-row items-center self-start shrink gap-8"
                        >
                            <FontAwesome5
                                name="sign-out-alt"
                                size={25}
                                color="red"
                            />
                            <Text className="w-max text-red-500 text-xl">
                                {t("logout")}
                            </Text>
                        </PressableAnimated>
                    </View>
                </View>
            </ScrollView>

            <Modal
                height={"25%"}
                active={modalActive}
                onClose={() => setModalActive(false)}
                dragHandler={false}
                contentContainerStyle={{
                    paddingBottom: 80,
                }}
                className="border dark:border-t-white/20 border-t-black/20 border-transparent"
            >
                <View className="w-full flex items-center px-3 mt-5">
                    <TextAnimated className="text-xl">
                        {t("logout_question")}
                    </TextAnimated>
                </View>

                <View className="w-full flex flex-row flex-wrap justify-center items-center gap-3 mt-5">
                    <PressableAnimated
                        scale={.8}
                        onPress={() => setModalActive(false)}
                        className="w-[150px] h-[45px] flex justify-center items-center p-3 border dark:border-white/20 border-black/20 bg-emerald-500 rounded-2xl"
                    >
                        <Text className="text-lg text-black font-bold">
                            {t("discard")}
                        </Text>
                    </PressableAnimated>

                    <PressableAnimated
                        scale={.8}
                        onPress={() => handleSignOut()}
                        className="w-[150px] h-[45px] flex justify-center items-center p-3 border dark:border-white/20 border-black/20 bg-red-500 rounded-2xl"
                    >
                        <Text className="text-lg text-white font-bold">
                            {t("logout_confirmed")}
                        </Text>
                    </PressableAnimated>
                </View>
            </Modal>

            <Modal
                height={"35%"}
                active={cameraModalActive}
                onClose={() => setCameraModalActive(false)}
                contentContainerStyle={{
                    paddingBottom: 80,
                }}
                className=" dark:bg-white/90 bg-white/90"
            >
                <View className="w-full flex items-center gap-6 px-3 mt-5">
                    <PressableAnimated
                        scale={.95}
                        onPress={() => { }}
                        className="self-start flex flex-row items-center gap-8"
                    >
                        <FontAwesome
                            name="camera"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                        <TextAnimated className="text-xl">
                            Caméra
                        </TextAnimated>
                    </PressableAnimated>

                    <PressableAnimated
                        scale={.95}
                        onPress={() => { }}
                        className="self-start flex flex-row items-center gap-[31px]"
                    >
                        <Ionicons
                            name="images"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                        <TextAnimated className="text-xl">
                            Galerie
                        </TextAnimated>
                    </PressableAnimated>

                    <PressableAnimated
                        scale={.95}
                        onPress={() => { }}
                        className="self-start flex flex-row items-center gap-7"
                    >
                        <Eye />
                        <TextAnimated className="text-xl">
                            Voir la photo
                        </TextAnimated>
                    </PressableAnimated>
                </View>
            </Modal>
        </Container>
    );
}