import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { TextAnimated } from "@/components/text-animated";
import { TextGradient } from "@/components/text-gradient";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import FontAwesome from "@expo/vector-icons/FontAwesome6";
import Fontisto from "@expo/vector-icons/Fontisto";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function NotFound() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Container center>
      <View className="w-full h-full flex justify-center items-center gap-8 px-3">
        <Fontisto
          name="compass-alt"
          size={120}
          color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
        />

        <TextAnimated className="text-xl text-center">
          {t("not-found_title")}
        </TextAnimated>

        <Button
          scale={.95}
          loaderSize={25}
          onPress={() => router.replace("/tasks")}
        >
          <FontAwesome
            name="arrow-left"
            size={20}
          />
          <Text className="text-2xl font-extrabold tracking-widest">
            {t("not-found_go_back_home")}
          </Text>
        </Button>

        <View className="absolute bottom-0 w-full flex items-center px-3">
          <TextGradient
            colors={[COLORS.emerald[500], theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"]}
            className="text-4xl font-bold tracking-widest"
          >
            Taskora
          </TextGradient>
        </View>
      </View>
    </Container>
  );
}