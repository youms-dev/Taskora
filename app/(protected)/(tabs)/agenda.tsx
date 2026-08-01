import { Calendar } from "@/components/agenda/calendar";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { event, EXPAND_NAVBAR, MINIMIZE_NAVBAR } from "@/lib/event-emitter";
import Fontisto from "@expo/vector-icons/Fontisto";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function Agenda() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname == "/agenda") {
            event.emit(MINIMIZE_NAVBAR);
        }

        return () => {
            event.emit(EXPAND_NAVBAR);
        }
    }, [pathname]);

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