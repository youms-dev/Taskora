import { COLORS } from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { PressableProps, View } from "react-native";
import { PressableAnimated } from "./pressable-animated";
import { TextAnimated } from "./text-animated";

interface Props extends Pick<PressableProps, "onPress"> {
    name: string;
    loading: boolean;
    icon: string;
}

export const OAuthButton = ({ name, loading, icon, ...rest }: Props) => {
    const { t } = useTranslation();

    return (
        <PressableAnimated
            {...rest}
            scale={.95}
            disabled={loading}
            className={clsx(
                "w-full dark:bg-black bg-white rounded-full",
                loading && "opacity-50",
            )}
        >
            <View
                style={{
                    transform: [
                        {
                            translateY: 5,
                        },
                    ],
                    filter: "blur(4px)",
                }}
                className="absolute size-full bg-black/20 rounded-2xl"
            />

            <View className="w-full h-[55px] flex flex-row justify-between items-center gap-3 dark:bg-white/10 bg-white rounded-2xl border-2 dark:border-white/5 border-black/5 px-3 py-2">
                <FontAwesome5
                    name={icon}
                    size={30}
                    color={COLORS.emerald[500]}
                />

                <View className="w-[75%]">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg font-medium"
                    >
                        {t("auth_item_1", { name })}
                    </TextAnimated>
                </View>
            </View>
        </PressableAnimated>
    );
}