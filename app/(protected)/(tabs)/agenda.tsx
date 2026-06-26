import { Calendar } from "@/components/calendar/calendar";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import Fontisto from "@expo/vector-icons/Fontisto";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function Agenda() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    return (
        <Container centerX>
            <View className="w-full flex items-center">
                <PageTitle>
                    <View className="h-full flex flex-row items-center gap-2">
                        <Fontisto
                            name="calendar"
                            size={25}
                            color={COLORS.emerald[500]}
                        />
                        <Text className="text-2xl font-bold text-emerald-500">
                            {t("agenda_page_title")}
                        </Text>
                    </View>
                </PageTitle>
            </View>

            <Calendar />
        </Container>
    );
}