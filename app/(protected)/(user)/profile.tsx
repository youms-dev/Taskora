import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { ConfirmBox } from "@/components/confirm-box";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { LOGOUT } from "@/constants/emitters";
import { NAME_FORMAT_ERROR, NAME_LENGTH_ERROR } from "@/constants/errors";
import { APP_NAME } from "@/constants/names";
import { useAuth } from "@/hooks/auth-provider";
import { useUsers } from "@/hooks/database/use-users";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { emitter } from "@/lib/event-emitter";
import { ApiError } from "@/types/errors";
import { formatName } from "@/utils/tools";
import { Fontisto } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { createId } from "@paralleldrive/cuid2";
import clsx from "clsx";
import * as Camera from "expo-camera";
import { CameraView } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, AppState, BackHandler, Linking, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown, FadeOutUp, SlideOutRight, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";

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
    const nameRef = useRef<TextInput>(null);
    const [editName, setEditName] = useState<boolean>(false);
    const { user, updateAuth, auth, loading: authLoading, refresh } = useAuth();
    const { updateUser } = useUsers();
    const [name, setName] = useState<string>(user?.name ?? "");
    const [loading, setLoading] = useState<boolean>(false);

    const editable = useMemo(() => {
        return (user?.name ?? "").trim().toLowerCase() != name.trim().toLowerCase();
    }, [user, name]);

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
            handleSave(assets[0].uri, assets[0].mimeType ?? "image/png");
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

    const handleSave = useCallback(async (photo: string, type: string) => {
        if (!auth) return;

        setImage(null);
        setCameraActive(false);

        try {
            setSaving(true);

            const fileName = createId() + Date.now();
            const fileType = (() => {
                if (type.indexOf("/") != -1) {
                    return type;
                }
                return `image/${type.split(".").pop() ?? "png"}`;
            })();
            const formData = new FormData();

            formData.append("idUser", auth.user.id);
            formData.append("file", {
                uri: photo,
                name: fileName,
                type: fileType,
            } as any);

            const { data } = await api.patch("/user/update-photo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            });

            updateAuth(data, "photo");
        }
        catch (e) {
            setToast(t("error"), "error");
        }
        finally {
            handleDeleteFromCache(photo);
            setSaving(false);
        }
    }, [auth]);

    const handleDeleteFromCache = useCallback(async (link: string) => {
        try {
            new FileSystem.File(link).delete();
        }
        catch { }
    }, []);

    const removePicture = useCallback(async () => {
        if (!auth || !auth.user.photo) return;

        setModalActive(false);

        try {
            setSaving(true);

            await api.patch("/user/remove-photo", {
                idUser: auth.user.id,
            });

            updateAuth(null, "photo");
        }
        catch (e) {
            setToast(t("error"), "error");
        }
        finally {
            setSaving(false);
        }
    }, [setToast, i18n.language, updateAuth, auth]);

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

    const handleUpdateName = useCallback(async () => {
        if (!auth || !user) return;

        if (name.trim().length == 0) {
            nameRef.current?.focus();
            return;
        }
        else if ((user.name ?? "").trim().toUpperCase() == name.toUpperCase()) {
            return;
        }

        try {
            setLoading(true);

            await api.patch("/user/update-name", {
                idUser: auth.user.id,
                name,
            });

            await updateUser(formatName(name), user.idUser, "name");
            refresh();
            setEditName(false);
        }
        catch (e) {
            const { data } = e as ApiError;

            if (data.message && Array.isArray(data.message)) {
                const messages = data.message as string[];

                if (messages.includes(NAME_FORMAT_ERROR)) {
                    setToast(t("profile_error_format"), "warning", 5000);
                }
                else if (messages.includes(NAME_LENGTH_ERROR)) {
                    setToast(t("profile_error_length"), "warning", 5000);
                }
                else {
                    setToast(t("error"), "error", 5000);
                }
                nameRef.current?.focus();
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
        }
    }, [setToast, i18n.language, updateAuth, user, name, auth]);

    useEffect(() => {
        if (!editName) {
            setName(user?.name ?? "");
        }
        else {
            nameRef.current?.focus();
        }

        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (editName) {
                setEditName(false);
                return true;
            }
            return false;
        });

        return () => remove();
    }, [editName, user]);

    return (
        <Container
            centerX
            safeArea={false}
        >
            {/* Header */}

            <View
                style={{
                    transform: [
                        {
                            translateY: 45,
                        },
                    ]
                }}
                className="absolute w-full h-[50px] flex flex-row items-center mb-5 px-3 z-[100]"
            >
                <View className="w-[190px] dark:bg-white bg-black rounded-[50px]">
                    <View className="flex flex-row items-center gap-6 dark:bg-black/85 bg-white/90 rounded-[50px]">
                        <PressableAnimated
                            onPress={() => {
                                if (editName) {
                                    setEditName(false);
                                }
                                else {
                                    router.back();
                                }
                            }}
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

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                bottomOffset={15}
                className="w-screen h-screen pt-[50px] dark:bg-black bg-transparent"
                contentContainerClassName="items-center"
            >

                {/* Content */}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="w-full h-full"
                    contentContainerClassName="w-full flex items-center pb-[100px]"
                >
                    {/* Section 1 */}

                    <View className={clsx(
                        "flex items-center mt-[70px]",
                        editName && "opacity-50 pointer-events-none",
                    )}>
                        <View className="size-[200px] flex items-center rounded-full">
                            {
                                saving && (
                                    <Animated.View
                                        entering={FadeIn
                                            .duration(300)
                                            .easing(Easing.inOut(Easing.quad))
                                        }
                                        exiting={FadeOut
                                            .duration(300)
                                            .easing(Easing.inOut(Easing.quad))
                                        }
                                        className="absolute size-full flex justify-center items-center z-[1] rounded-full bg-black/50"
                                    >
                                        <ActivityIndicator
                                            size={50}
                                            color={COLORS.emerald[500]}
                                        />
                                    </Animated.View>
                                )
                            }

                            <View
                                style={{
                                    transform: [
                                        {
                                            translateY: 8,
                                        }
                                    ],
                                    filter: "blur(5px)"
                                }}
                                className="absolute bottom-0 size-[200px] bg-black/20 -z-[1] rounded-full"
                            />

                            {/* Avatar */}

                            {
                                !user?.photo && (
                                    <Avatar
                                        size={200}
                                        name={editName && name.trim().length > 0 ?
                                            name
                                            :
                                            user?.name ?? ((user?.email ?? "").split("@").shift() ?? "")
                                        }
                                        background={theme == "light" ? "white" : undefined}
                                    />
                                )
                            }

                            {/* Photo */}

                            {
                                user?.photo && (
                                    <Image
                                        source={{
                                            uri: user.photo.startsWith("https://") ?
                                                user.photo
                                                :
                                                process.env.EXPO_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/files/" + user.photo
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: 9999,
                                            aspectRatio: 1,
                                        }}
                                        contentFit="cover"
                                    />
                                )
                            }
                        </View>

                        {
                            !saving && (
                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => setModalActive(true)}
                                    className="absolute bottom-0 right-0 size-[50px] flex justify-center items-center bg-emerald-500 rounded-full shadow-lg shadow-black z-[2]"
                                >
                                    <FontAwesome
                                        name="camera"
                                        size={25}
                                        color="rgba(0, 0, 0, 1)"
                                    />
                                </PressableAnimated>
                            )
                        }
                    </View>

                    {/* Section 2 */}

                    <View className="w-full flex items-center gap-10 mt-16">

                        {/* Name */}

                        <View className="w-full flex flex-row items-center px-3">
                            {
                                !editName && (
                                    <Animated.View
                                        entering={FadeInUp
                                            .duration(300)
                                            .easing(Easing.inOut(Easing.quad))
                                        }
                                        exiting={FadeOutUp
                                            .duration(300)
                                            .easing(Easing.inOut(Easing.quad))
                                        }
                                        className="flex flex-row gap-8"
                                    >
                                        <View className="translate-y-4">
                                            <FontAwesome5
                                                name="user-alt"
                                                size={20}
                                                color={theme == "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"}
                                            />
                                        </View>

                                        <View className="flex gap-2 pr-[120px]">
                                            <View className="flex flex-row gap-5">
                                                <TextAnimated className="text-xl opacity-80">
                                                    {t("profile_name")}
                                                </TextAnimated>

                                                <PressableAnimated
                                                    scale={.95}
                                                    onPress={() => setEditName(true)}
                                                >
                                                    <FontAwesome5
                                                        name="user-edit"
                                                        size={20}
                                                        color={COLORS.emerald[500]}
                                                    />
                                                </PressableAnimated>
                                            </View>

                                            {
                                                authLoading && !user?.name && (
                                                    <View className="w-full">
                                                        <View className="w-[150px] h-[20px] rounded-3xl overflow-hidden">
                                                            <Skeleton />
                                                        </View>
                                                    </View>
                                                )
                                            }

                                            {
                                                (!authLoading || user) && (
                                                    <TextAnimated className={clsx(
                                                        "text-xl",
                                                        !user?.name && "opacity-60",
                                                    )}>
                                                        {user?.name ?? t("profile_item_1", { name: APP_NAME })}
                                                    </TextAnimated>
                                                )
                                            }
                                        </View>
                                    </Animated.View>
                                )
                            }

                            {/* Input */}

                            {
                                editName && (
                                    <Animated.View
                                        entering={FadeInDown
                                            .duration(300)
                                            .easing(Easing.inOut(Easing.quad))
                                        }
                                        exiting={FadeOutDown
                                            .duration(300)
                                            .easing(Easing.inOut(Easing.quad))
                                        }
                                        className="sm:w-[500px] w-full flex flex-row items-center gap-5"
                                    >
                                        <View className="w-[80%]">
                                            <Input
                                                ref={nameRef}
                                                placeholder="Your name"
                                                value={name}
                                                onChangeText={(e) => setName(e)}
                                                icon={(
                                                    <View
                                                        style={{
                                                            transform: [
                                                                {
                                                                    translateX: 10,
                                                                },
                                                                {
                                                                    translateY: 10,
                                                                },
                                                            ]
                                                        }}
                                                        className="absolute left-0 top-0"
                                                    >
                                                        <PressableAnimated
                                                            scale={.95}
                                                            onPress={() => setEditName(false)}
                                                        >
                                                            <Entypo
                                                                name="cross"
                                                                size={35}
                                                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                                            />
                                                        </PressableAnimated>
                                                    </View>
                                                )}
                                            />
                                        </View>

                                        <PressableAnimated
                                            scale={.95}
                                            disabled={loading || !editable}
                                            onPress={handleUpdateName}
                                            className={clsx(
                                                "size-[40px] flex justify-center items-center shrink-0 rounded-full bg-emerald-500",
                                                (loading || !editable) && "opacity-50",
                                            )}
                                        >
                                            {
                                                loading ?
                                                    (
                                                        <ActivityIndicator
                                                            size={25}
                                                            color="black"
                                                        />
                                                    )
                                                    :
                                                    (
                                                        <AntDesign
                                                            name="check"
                                                            size={25}
                                                            color="black"
                                                        />
                                                    )
                                            }
                                        </PressableAnimated>
                                    </Animated.View>
                                )
                            }
                        </View>

                        {/* Email */}

                        <View className={clsx(
                            "w-full flex flex-row items-center px-3",
                            editName && "opacity-50 pointer-events-none",
                        )}>
                            <Animated.View className="flex flex-row gap-8" >
                                <View className="translate-y-4">
                                    <FontAwesome5
                                        name="envelope-open-text"
                                        size={20}
                                        color={theme == "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"}
                                    />
                                </View>

                                <View className="flex gap-2 pr-[120px]">
                                    <View className="flex flex-row gap-5">
                                        <TextAnimated className="text-xl opacity-80">
                                            {t("profile_email")}
                                        </TextAnimated>

                                        <PressableAnimated
                                            onPress={() => router.navigate({
                                                pathname: "/(protected)/(user)/update-email",
                                            })}
                                            scale={.95}
                                        >
                                            <MaterialCommunityIcons
                                                name="email-edit"
                                                size={23}
                                                color={COLORS.emerald[500]}
                                            />
                                        </PressableAnimated>
                                    </View>

                                    {
                                        authLoading && !user && (
                                            <View className="w-full">
                                                <View className="w-[150px] h-[20px] rounded-3xl overflow-hidden">
                                                    <Skeleton />
                                                </View>
                                            </View>
                                        )
                                    }

                                    {
                                        (!authLoading || user) && (
                                            <TextAnimated className="text-xl">
                                                {user?.email ?? ""}
                                            </TextAnimated>
                                        )
                                    }
                                </View>
                            </Animated.View>
                        </View>

                        {/* Password */}

                        <View className={clsx(
                            "w-full px-3",
                            editName && "opacity-50 pointer-events-none",
                        )}>
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

                        {/* Log out */}

                        <View className={clsx(
                            "w-full px-3 rounded-2xl",
                            editName && "opacity-50 pointer-events-none",
                        )}>
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
            </KeyboardAwareScrollView>

            <ConfirmBox
                message={t("profile_logout_question")}
                active={confirmBoxActive}
                submitLabel={t("profile_logout_confirmed")}
                onCancel={() => setConfirmBoxActive(false)}
                onSubmit={handleSignOut}
            />

            {/* Options */}

            <Modal
                height={screenHeight * (auth?.user.photo ? .25 : .2)}
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

                    {/* Camera */}

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

                    {/* Gallery */}

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

                    {/* Remove */}

                    {
                        auth?.user.photo && (
                            <PressableAnimated
                                scale={.95}
                                onPress={removePicture}
                                className="self-start flex flex-row items-center gap-[34px]"
                            >
                                <Fontisto
                                    name="trash"
                                    size={25}
                                    color={COLORS.red[500]}
                                />

                                <Text
                                    numberOfLines={1}
                                    className="text-xl text-red-500"
                                >
                                    {t("profile_modal_item_3")}
                                </Text>
                            </PressableAnimated>
                        )
                    }
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
                                                onPress={() => handleSave(image.uri, image.format)}
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