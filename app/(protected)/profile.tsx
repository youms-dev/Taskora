import { Container } from "@/components/container";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function Profile() {
    const { t } = useTranslation();

    return (
        <Container centerX>
            <View className="w-full flex flex-row items-center gap-3 px-3 py-2">
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
        </Container>
    );
}