import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Container center>
      <View className="transition-default w-full max-h-full flex flex-col justify-center items-center gap-5">
        <Text className="transition-default text-6xl animate-bounce">🥲</Text>
        <Text className="transition-default text-white text-2xl">Cette page n'existe pas</Text>
        <Button
          loaderSize={25}
          className="w-[300px] h-[60px]"
          onPress={() => router.replace("/index")}
        >
          <FontAwesome name="arrow-left" size={20} />
          <Text className="transition-default text-2xl font-extrabold">Accueil</Text>
        </Button>
      </View>
    </Container>
  );
}