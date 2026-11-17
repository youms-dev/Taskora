import { Avatar } from "@/components/avatar";
import { ConfirmBox } from "@/components/confirm-box";
import { Container } from "@/components/container";
import { Eye } from "@/components/eye";
import { Modal } from "@/components/modal";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { AUTH_STORAGE } from "@/constants/async-storage";
import { COLORS } from "@/constants/colors";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, BackHandler, Linking, ScrollView, Text, useWindowDimensions, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { emitter } from "@/lib/event-emitter";
import { LOGOUT } from "@/constants/emitters";
import { useToast } from "@/hooks/use-toast";
import { fileDatas } from "@/utils/tools";
import * as FileSystem from "expo-file-system";
import { api } from "@/lib/axios";
import { decode } from "base64-arraybuffer";
import * as Camera from "expo-camera";
import { CameraView } from "expo-camera";
import Animated, { Easing, FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { Button } from "@/components/button";

export default function Profile() {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const [confirmBoxActive, setConfirmBoxActive] = useState<boolean>(false);
    const [modalActive, setModalActive] = useState<boolean>(false);
    const router = useRouter();
    const { setToast } = useToast();
    const [saving, setSaving] = useState<boolean>(false);
    const [cameraStatus, requestCameraPermission] = Camera.useCameraPermissions();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const cameraRef = useRef<CameraView>(null);
    const [image, setImage] = useState<Camera.CameraCapturedPicture | null>(null);
    const settingOpen = useRef<boolean>(false);

    const handleSignOut = useCallback(async () => {
        emitter.emit(LOGOUT);
    }, []);

    const pickImage = useCallback(async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            setToast(t("profile_gallery_permission_denied"), "warning", 5000);
            return;
        }

        const { canceled, assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            shape: "oval",
            aspect: [1, 1],
            quality: 1,
        });

        if (!canceled && assets) {
            handleSave(assets[0].uri);
        }
        else {
            setToast(t("profile_no_image_picked"), "warning");
        }
    }, [setToast, i18n.language]);

    const handleCamera = useCallback(async () => {
        if (!cameraStatus) return;
        if (!cameraStatus.granted && cameraStatus.canAskAgain) {
            const response = await requestCameraPermission();

            if (!response.granted) {
                setToast(t("profile_camera_permission_denied"), "warning", 5000);
                return;
            }
        }
        else if (!cameraStatus.granted) {
            settingOpen.current = true;
            await Linking.openSettings();
            return;
        }

        setModalActive(false);
        setCameraActive(true);
    }, [cameraStatus]);

    const takePicture = useCallback(async () => {
        if (!cameraRef.current) return;
        const camera = cameraRef.current;

        const data = await camera.takePictureAsync();

        setImage(data);
    }, []);

    const handleSave = useCallback(async (photo: string) => {
        try {
            setSaving(true);
            console.log(photo);
            // setImage(assets[0].uri);
            // const file = assets[0];
            // const { name, ext } = fileDatas(String(file.fileName));
            // const date = new Date();
            // const base64 = new FileSystem.File(file.uri).base64Sync();

            // if (!name || !ext) {
            //     return setToast("Fichier corrompu ou illisible !", "error");
            // }

            // if (user && user.user_metadata.photoUrl) {
            //     await supabase.storage.from("files").remove([user.user_metadata.photoUrl]);
            // }
            // const newName = name + date.getMilliseconds() + createId() + "." + ext;
            // const { data } = await supabase.storage.from("files").upload(newName, decode(base64), {
            //     upsert: true,
            // });

            // if (data) {
            //     await api.patch(`/user/update/${user?.id}`, {
            //         photoUrl: data.path,
            //     });
            //     await supabase.auth.refreshSession();
            // }
        }
        catch (error) {
            setToast(t("error"), "error");
        }
        finally {
            handleDeleteFromCache(photo);
            setCameraActive(false);
            setImage(null);
            setSaving(false);
        }
    }, []);

    const handleDeleteFromCache = useCallback(async (link: string) => {
        try {
            new FileSystem.File(link).delete();
        }
        catch { }
    }, []);

    const removePicture = useCallback(async () => {
        // if (!user || !user.user_metadata.photoUrl) return;
        try {
            // setSaving(true);
            // await api.patch(`/user/update/${user?.id}`, {
            //     photoUrl: false,
            // });
            // await supabase.storage.from("files").remove([user.user_metadata.photoUrl]);
            // await supabase.auth.refreshSession();
            // setSaving(false);
        }
        catch (e) {
            setToast(t("error"), "error");
        }
        finally {
            setSaving(false);
        }
    }, [setToast, i18n.language]);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (image) {
                handleDeleteFromCache(image.uri);
                setImage(null);
                return true;
            }
            else if (cameraActive) {
                setCameraActive(false);
                return true;
            }
            return false;
        });

        return () => remove();
    }, [cameraActive, image]);

    useEffect(() => {
        const { remove } = AppState.addEventListener("change", async (state) => {
            if (state == "active" && settingOpen.current) {
                await requestCameraPermission();
                settingOpen.current = false;
            }
        });

        return () => remove();
    }, []);

    const imageContainerAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withSequence(
                    withTiming(0, {
                        duration: 0,
                    }),
                    withTiming(1, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad),
                    }),
                )
            }
        ]
    }));

    return (
        <Container
            centerX
            safeArea={false}
        >
            <View className="w-screen h-screen flex items-center pt-[50px] dark:bg-black bg-transparent">
                {/* Header */}

                <View className="w-full h-[50px] flex flex-row items-center mb-5 px-3">
                    <View className="w-[190px] dark:bg-white bg-black rounded-[50px]">
                        <View className="flex flex-row items-center gap-6 dark:bg-black/85 bg-white/90 rounded-[50px]">
                            <PressableAnimated
                                onPress={() => router.back()}
                                className="size-[50px] dark:bg-black bg-black rounded-full"
                            >
                                <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full border dark:border-white/10 border-white">
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
                                    {t("profile_title")}
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

                {/* Content */}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="w-full h-full"
                    contentContainerClassName="w-full flex items-center pb-[100px]"
                >
                    {/* Section 1 */}

                    <View className="flex items-center">
                        <View className="flex items-center">
                            <View
                                style={{
                                    transform: [
                                        {
                                            translateY: 8,
                                        }
                                    ],
                                    filter: "blur(5px)"
                                }}
                                className="absolute bottom-0 size-[200px] bg-black/10 -z-[1] rounded-full"
                            />

                            <Avatar
                                size={200}
                                name="Youmbi Le-duc"
                                background={theme == "light" ? "white" : undefined}
                            />
                        </View>

                        <PressableAnimated
                            scale={.95}
                            onPress={() => setModalActive(true)}
                            className="absolute bottom-0 right-0 size-[50px] flex justify-center items-center bg-emerald-500 rounded-full shadow-lg shadow-black"
                        >
                            <FontAwesome
                                name="camera"
                                size={25}
                                color="rgba(0, 0, 0, 1)"
                            />
                        </PressableAnimated>
                    </View>

                    {/* Section 2 */}

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
                                            {t("profile_name")}
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
                                            {t("profile_email")}
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
                                    {t("profile_change_password")}
                                </TextAnimated>
                            </PressableAnimated>
                        </View>

                        <View className="w-full px-3 rounded-2xl">
                            <PressableAnimated
                                onPress={() => setConfirmBoxActive(true)}
                                className="flex flex-row items-center self-start shrink gap-8"
                            >
                                <FontAwesome5
                                    name="sign-out-alt"
                                    size={25}
                                    color="red"
                                />

                                <Text className="w-max text-red-500 text-xl">
                                    {t("profile_logout")}
                                </Text>
                            </PressableAnimated>
                        </View>
                    </View>
                </ScrollView>
            </View>

            <ConfirmBox
                message={t("profile_logout_question")}
                active={confirmBoxActive}
                submitLabel={t("profile_logout_confirmed")}
                onCancel={() => setConfirmBoxActive(false)}
                onSubmit={handleSignOut}
            />

            {/* Options */}

            <Modal
                height={screenHeight * .25}
                active={modalActive}
                onClose={() => setModalActive(false)}
                dragHandlerContainerBackground={theme == "dark" ? "rgba(255, 255, 255, .1)" : "white"}
                animationDuration={500}
                closeAnimationDuration={500}
                backdropBackground="rgba(0, 0, 0, .2)"
                className="dark:bg-black bg-white"
                contentContainerClassName="w-full min-h-full dark:bg-white/10 bg-white pt-5 px-3"
            >
                <View className="w-full flex items-center gap-6 px-3 mt-5">
                    <PressableAnimated
                        scale={.95}
                        onPress={handleCamera}
                        className="self-start flex flex-row items-center gap-8"
                    >
                        <FontAwesome
                            name="camera"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />

                        <TextAnimated
                            numberOfLines={1}
                            className="text-xl"
                        >
                            {t("profile_modal_item_1")}
                        </TextAnimated>
                    </PressableAnimated>

                    <PressableAnimated
                        scale={.95}
                        onPress={() => {
                            setModalActive(false);
                            pickImage();
                        }}
                        className="self-start flex flex-row items-center gap-[31px]"
                    >
                        <Ionicons
                            name="images"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />

                        <TextAnimated
                            numberOfLines={1}
                            className="text-xl"
                        >
                            {t("profile_modal_item_2")}
                        </TextAnimated>
                    </PressableAnimated>

                    <PressableAnimated
                        scale={.95}
                        onPress={() => { }}
                        className="self-start flex flex-row items-center gap-7"
                    >
                        <Eye />

                        <TextAnimated
                            numberOfLines={1}
                            className="text-xl"
                        >
                            {t("profile_modal_item_3")}
                        </TextAnimated>
                    </PressableAnimated>
                </View>
            </Modal>

            {/* Camera */}

            {
                cameraActive && (
                    <Animated.View
                        entering={FadeIn
                            .duration(300)
                            .easing(Easing.inOut(Easing.quad))
                        }
                        exiting={FadeOut
                            .duration(300)
                            .easing(Easing.inOut(Easing.quad))
                        }
                        style={{
                            width: screenWidth,
                            height: screenHeight,
                        }}
                        className="absolute left-0 top-0 flex items-center z-[100]"
                    >
                        {
                            !image && (
                                <>
                                    <View
                                        style={{
                                            transform: [
                                                {
                                                    translateX: 10,
                                                },
                                                {
                                                    translateY: 45,
                                                },
                                            ]
                                        }}
                                        className="absolute left-0 top-0 size-[50px] rounded-full z-[10]"
                                    >
                                        <PressableAnimated
                                            scale={.95}
                                            onPress={() => setCameraActive(false)}
                                            className="size-full bg-black rounded-full"
                                        >
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateY: 6,
                                                        },
                                                    ],
                                                    filter: "blur(5px)",
                                                }}
                                                className="absolute left-0 top-0 size-full bg-black/50 rounded-full"
                                            />

                                            <View className="size-full flex justify-center items-center rounded-full bg-white/10">
                                                <Entypo
                                                    name="cross"
                                                    size={35}
                                                    color="rgba(255, 255, 255, .8)"
                                                />
                                            </View>
                                        </PressableAnimated>
                                    </View>

                                    <CameraView
                                        ref={cameraRef}
                                        facing="front"
                                        mirror
                                        style={{
                                            width: screenWidth,
                                            height: screenHeight,
                                        }}
                                    />

                                    <View
                                        style={{
                                            transform: [
                                                {
                                                    translateY: -50,
                                                },
                                            ],
                                        }}
                                        className="absolute bottom-0 size-[80px] rounded-full z-[10]"
                                    >
                                        <PressableAnimated
                                            scale={.95}
                                            onPress={takePicture}
                                            className="size-full rounded-full"
                                        >
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateY: 6,
                                                        },
                                                    ],
                                                    filter: "blur(5px)",
                                                }}
                                                className="absolute left-0 top-0 size-full bg-black/50 rounded-full"
                                            />

                                            <View className="size-full bg-white rounded-full" />
                                        </PressableAnimated>
                                    </View>
                                </>
                            )
                        }

                        {
                            image && (
                                <Animated.View
                                    exiting={SlideOutRight
                                        .duration(300)
                                        .easing(Easing.inOut(Easing.quad))
                                    }
                                    className="size-full"
                                >
                                    <Animated.View
                                        style={imageContainerAnimation}
                                        className="size-full flex justify-center items-center bg-black rounded-2xl"
                                    >
                                        <Image
                                            source={{ uri: image.uri }}
                                            style={{
                                                width: screenWidth,
                                                height: screenHeight,
                                                aspectRatio: image.width / image.height,
                                            }}
                                            contentFit="contain"
                                        />

                                        <View
                                            style={{
                                                transform: [
                                                    {
                                                        translateY: -50,
                                                    }
                                                ]
                                            }}
                                            className="absolute bottom-0 w-full flex flex-row flew-wrap justify-center items-center gap-3 self-end z-[10]"
                                        >
                                            <Button
                                                scale={.95}
                                                width={150}
                                                height={50}
                                                loaderSize={30}
                                                loading={saving}
                                                backgroundColor={COLORS.red[500]}
                                                onPress={() => {
                                                    handleDeleteFromCache(image.uri);
                                                    setImage(null);
                                                }}
                                            >
                                                <Text
                                                    numberOfLines={1}
                                                    className="text-2xl text-white font-bold"
                                                >
                                                    {t("profile_camera_item_1")}
                                                </Text>
                                            </Button>

                                            <Button
                                                scale={.95}
                                                width={150}
                                                height={50}
                                                loaderSize={30}
                                                loading={saving}
                                                onPress={() => handleSave(image.uri)}
                                            >
                                                <Text
                                                    numberOfLines={1}
                                                    className="text-2xl text-black font-bold"
                                                >
                                                    {t("profile_camera_item_2")}
                                                </Text>
                                            </Button>
                                        </View>
                                    </Animated.View>
                                </Animated.View>
                            )
                        }
                    </Animated.View>
                )
            }

        </Container>
    );
}