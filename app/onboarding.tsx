import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { PressableAnimated } from "@/components/pressable";
import { Toast, ToastProps } from "@/components/toast";
import { APP_NAME } from "@/constants/names";
import { NAME_REGEX } from "@/constants/regex";
import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/types/errors";
import { checkLength, checkPattern, fileDatas } from "@/utils/tools";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { createId } from "@paralleldrive/cuid2";
import { decode } from "base64-arraybuffer";
import clsx from "clsx";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { api } from "../lib/axios";
import { supabase } from "../lib/supabase";

export default function Onboarding() {
    const [page, setPage] = useState<number>(0);
    const pagerRef = useRef<PagerView>(null);
    const [value, setValue] = useState<string>("");
    const { theme } = useTheme();
    const [image, setImage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<ToastProps>({
        show: false,
        message: "",
        type: "default",
        onCancel: () => { }
    });
    const { user } = useAuth();

    const changePage = (value: number, animation = false) => {
        if (!pagerRef.current || loading) return;
        if (page == 1 && validateName() || page != 1) {
            if (animation) pagerRef.current.setPage(value);
            else pagerRef.current.setPageWithoutAnimation(value);
        }
        else {
            pagerRef.current.setScrollEnabled(false);
        }
    }

    const validateName = () => {
        let name = value.trim();

        if (!pagerRef.current) return false;
        if (name.length == 0) {
            if (page == 1) pagerRef.current.setScrollEnabled(false);
            setToast({
                show: true,
                message: "Veuillez renseigner votre nom !",
                type: "warning",
                onCancel: () => setToast({
                    ...toast,
                    show: false
                })
            });
            return false;
        }
        else {
            if (!checkLength(name, [3, 30])) {
                setToast({
                    show: true,
                    message: "Le nom doit comporter au minimum 3 caractères et au maximum 30 !",
                    type: "warning",
                    onCancel: () => setToast({
                        ...toast,
                        show: false
                    })
                });
                pagerRef.current.setScrollEnabled(false);
                return false;
            }
            else if (!checkPattern(name, NAME_REGEX)) {
                setToast({
                    show: true,
                    message: "Nom invalide !",
                    type: "warning",
                    onCancel: () => setToast({
                        ...toast,
                        show: false
                    })
                });
                pagerRef.current.setScrollEnabled(false);
                return false;
            }
            else {
                setToast({
                    show: true,
                    message: "Nom valide 😉",
                    type: "success",
                    onCancel: () => setToast({
                        ...toast,
                        show: false
                    })
                });
                pagerRef.current.setScrollEnabled(true);
                return true;
            }
        }
    }

    useEffect(() => {
        if (!pagerRef.current) return;
        if (page == 1 && !validateName()) {
            pagerRef.current.setScrollEnabled(false);
        }
        else {
            pagerRef.current.setScrollEnabled(true);
        }
    }, [page, value]);

    useEffect(() => {
        if (!pagerRef.current) return;
        if (loading) {
            pagerRef.current.setScrollEnabled(false);
        }
        else {
            pagerRef.current.setScrollEnabled(true);
        }
    }, [loading]);

    const pickPicture = async () => {
        const { granted } = await requestMediaLibraryPermissionsAsync();

        if (!granted) {
            setToast({
                show: true,
                message: "Nous avons besoin de votre permission pour acceder aux photos 🥲",
                type: "default",
                onCancel: () => setToast({
                    ...toast,
                    show: false
                })
            });
            return;
        }
        const { assets, canceled } = await launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (assets && !canceled) {
            setImage(assets[0].uri);
        }
        else {
            setToast({
                show: true,
                message: "Aucune photo n'a été sélectionnée 🥲",
                type: "default",
                onCancel: () => setToast({
                    ...toast,
                    show: false
                })
            });
        }
    }

    const complete = async () => {
        setLoading(true);
        if (!validateName()) {
            validateName();
            if (pagerRef.current) pagerRef.current.setPage(1);
            setLoading(false);
            return;
        };

        try {
            const nameFormatted = value.trim().charAt(0).toUpperCase() + value.trim().slice(1);
            
            if (image.trim().length == 0) {
                await api.patch(`/user/update/${user?.id}`, {
                    name: nameFormatted,
                });
            }
            else {
                const { name: fileName, ext: fileExt } = fileDatas(new File(image).name);
                const base64 = new File(image).base64Sync();
    
                if (!fileName || !fileExt) {
                    return setToast({
                        show: true,
                        message: "Fichier corrompu ou illisible !",
                        type: "error",
                        top: -100,
                        onCancel: () => setToast({
                            ...toast,
                            show: false,
                        })
                    });
                }
    
                const date = new Date();
                const newName = fileName + date.getMilliseconds() + createId() + "." + fileExt;
                const { data } = await supabase.storage.from("files").upload(newName, decode(base64), {
                    upsert: true,
                });
                await api.patch(`/user/update/${user?.id}`, {
                    name: nameFormatted,
                    photoUrl: data?.path,
                });
            }
            setToast({
                show: true,
                message: "Bienvenue ☺️",
                type: "success",
                onCancel: () => setToast({
                    ...toast,
                    show: false,
                }),
            });
            setTimeout(async () => {
                await supabase.auth.refreshSession();
                setImage("");
                setValue("");
                setLoading(false);
            }, 500);
        }
        catch (e) {
            const error = e as ApiError;
            console.clear()
            console.log(error);
            setLoading(false);
            setToast({
                show: true,
                message: "Une erreur s'est produite",
                type: "error",
                onCancel: () => setToast({
                    ...toast,
                    show: false,
                }),
            });
        }
    }

    return (
        <Container centerX>
            <View className="w-full h-full flex items-center">
                <View className="w-full h-[10%] flex flex-row justify-center items-center gap-3 p-3">
                    <View className="size-[70px] p-1 rounded-full">
                        <Image
                            source={require("../assets/images/logo.png")}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderWidth: 2,
                                borderRadius: 9999
                            }}
                        />
                    </View>
                    <Text
                        numberOfLines={1}
                        className="text-2xl dark:text-white text-black font-extrabold"
                    >
                        {APP_NAME}
                    </Text>
                </View>

                <PagerView
                    ref={pagerRef}
                    initialPage={0}
                    onPageSelected={(e) => setPage(e.nativeEvent.position)}
                    style={{
                        width: "100%",
                        height: "80%",
                    }}
                >
                    <View className="w-full h-full flex justify-center items-center gap-4 px-5">
                        <Text className="text-6xl animate-bounce">🙂</Text>
                        <Text className="w-full text-2xl dark:text-white text-black">
                            Bienvenue sur
                            &nbsp;
                            <Text className="text-emerald-500 font-['papyrus']">{APP_NAME}</Text>,
                        </Text>
                        <Text className="w-full text-2xl dark:text-white text-black">
                            votre pense bête portable 😅.
                        </Text>
                        <Text className="w-full text-2xl dark:text-white text-black">
                            L&rsquo;application qui vous permettra de gérer vos différentes tâches de manière simple et efficace.
                        </Text>
                        <Text className="w-full text-2xl dark:text-white text-black">
                            🛡️ Ajoutez, modifiez ou supprimez vos tâches ici en toute sécurité 🔏.
                        </Text>
                        <Button
                            scale={.7}
                            onPress={() => changePage(1, true)}
                            className="w-[250px] h-[60px] mt-10"
                        >
                            <Text className="text-2xl text-black font-bold">Suivant</Text>
                            <FontAwesome6 name="arrow-right" size={25} color="black" />
                        </Button>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "android" ? "padding" : "height"}
                        className="w-full h-full flex justify-center items-center gap-5 p-3"
                    >
                        <Text className="text-2xl text-white">Tout d&rsquo;abord commençons par enregistrer le nom par lequel nous allons vous appeler ☺️</Text>
                        <View
                            className="w-full flex items-center"
                        >
                            <Input
                                placeholder="John Doe"
                                cursorColor={theme === "dark" ? "white" : "black"}
                                icon={{
                                    name: "user-tie",
                                }}
                                value={value}
                                onChangeText={(e) => setValue(e)}
                            />
                        </View>
                        <Button
                            scale={.7}
                            onPress={() => validateName() && pagerRef.current && pagerRef.current.setPage(2)}
                            className="w-[250px] h-[60px] mt-10"
                        >
                            <Text className="text-2xl text-black font-bold">Suivant</Text>
                            <FontAwesome6 name="arrow-right" size={25} color="black" />
                        </Button>
                    </KeyboardAvoidingView>

                    <ScrollView
                        contentContainerClassName=" flex items-center gap-5 p-5"
                        className="w-full h-full"
                    >
                        <Text className="w-full text-2xl dark:text-white text-black">Vous aimeriez sûrement avoir une photo de profile</Text>
                        <Text className="w-full text-2xl dark:text-white text-black italic">(facultatif)</Text>
                        <View className="relative size-[300px] rounded-full p-2">
                            <PressableAnimated
                                scale={.6}
                                onPress={() => pickPicture()}
                                className="absolute bottom-[4px] right-0 size-[50px] flex justify-center items-center bg-emerald-500 rounded-full border-2 dark:border-white border-black z-[1]"
                            >
                                <FontAwesome6 name="image" size={30} color="black" />
                            </PressableAnimated>
                            <Image
                                source={image.trim().length == 0 ? require("../assets/images/logo.png") : image}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderWidth: 2,
                                    borderColor: "transparent",
                                    borderRadius: 9999,
                                    aspectRatio: 1 / 1
                                }}
                            />
                        </View>
                        <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 px-2">
                            {
                                image.trim().length > 0 && (
                                    <Button
                                        background="bg-red-500"
                                        scale={.7}
                                        onPress={() => setImage("")}
                                        className="w-[150px] h-[60px]"
                                    >
                                        <FontAwesome6 name="xmark" size={25} color="black" />
                                        <Text className="text-2xl text-black font-bold">Retirer</Text>
                                    </Button>
                                )
                            }
                            <Button
                                scale={.7}
                                onPress={() => changePage(3, true)}
                                className="w-[280px] h-[60px]"
                            >
                                <Text className="text-2xl text-black font-bold">Suivant</Text>
                                <FontAwesome6 name="arrow-right" size={25} color="black" />
                            </Button>
                        </View>
                    </ScrollView>

                    <View className="w-full h-full flex justify-center items-center gap-8 p-5">
                        <Text className="w-full text-5xl animate-bounce text-center">😊</Text>
                        <Text className="w-full text-2xl dark:text-white text-black">Voilà; tout est fin prêt.</Text>
                        <Text className="w-full text-2xl dark:text-white text-black">Profitez de votre application.</Text>
                        <Text className="w-full text-5xl animate-bounce text-center">😉</Text>
                        <Button
                            scale={.7}
                            loading={loading}
                            loaderSize={35}
                            onPress={() => complete()}
                            className="w-[280px] h-[60px]"
                        >
                            <Text className="text-2xl text-black font-bold">Terminer</Text>
                            <FontAwesome6 name="check" size={28} color="black" />
                        </Button>
                    </View>
                </PagerView>

                <View className="w-full h-[10%] flex flex-row justify-center items-center gap-5">
                    <PressableAnimated
                        scale={.8}
                        onPress={() => changePage(0)}
                        className={clsx(
                            "size-[20px] rounded-full",
                            page >= 0 ? "bg-emerald-500" : "dark:bg-white bg-black"
                        )}
                    />
                    <PressableAnimated
                        scale={.8}
                        onPress={() => changePage(1)}
                        className={clsx(
                            "size-[20px] rounded-full",
                            page >= 1 ? "bg-emerald-500" : "dark:bg-white bg-black"
                        )}
                    />
                    <PressableAnimated
                        scale={.8}
                        onPress={() => changePage(2)}
                        className={clsx(
                            "size-[20px] rounded-full",
                            page >= 2 ? "bg-emerald-500" : "dark:bg-white bg-black"
                        )}
                    />
                    <PressableAnimated
                        scale={.8}
                        onPress={() => changePage(3)}
                        className={clsx(
                            "size-[20px] rounded-full",
                            page == 3 ? "bg-emerald-500" : "dark:bg-white bg-black"
                        )}
                    />
                </View>
            </View>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                top={toast.top}
                onCancel={toast.onCancel}
            />
        </Container>
    );
}