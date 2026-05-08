import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function Profile() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    return (
        <Container centerX>
            <View className="w-full flex flex-row items-center gap-3 px-3 py-2  mb-5">
                <AntDesign
                    name="user"
                    size={25}
                    color={COLORS.emerald[500]}
                />

                <TextAnimated
                    dark={COLORS.emerald[500]}
                    light={COLORS.emerald[500]}
                    className="text-2xl font-bold"
                >
                    {t("profile")}
                </TextAnimated>
            </View>

            <ScrollView
                className="w-full h-full"
                contentContainerClassName="w-full flex items-center pb-[100px]"
            >
                <View>
                    <Avatar
                        size={200}
                        name={{
                            value: "Youmbi Le-duc",
                            size: 100,
                        }}
                    />

                    <PressableAnimated
                        scale={.8}
                        className="absolute bottom-0 right-0"
                    >
                        <MaterialIcons
                            name="mode-edit"
                            size={35}
                            color={COLORS.emerald[500]}
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
                </View>
            </ScrollView>
        </Container>
    );
}