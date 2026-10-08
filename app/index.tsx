import { Container } from '@/components/container';
import { Input } from '@/components/input';
import { TextAnimated } from '@/components/text-animated';
import { APP_NAME } from '@/constants/names';
import { useTheme } from '@/hooks/use-theme';
import { FontAwesome6, Fontisto } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView, useKeyboardHandler } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';

export default function Login() {
  const initialInputsValues = {
    email: "",
    password: "",
  };
  const [inputsValues, setInputsValues] = useState<typeof initialInputsValues>(initialInputsValues);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useTranslation();

  useKeyboardHandler({
    onMove: (e) => {
      "worklet";
      console.log("height :", e.height);
    }
  });

  return (
    <Container centerX safeArea={false}>
      <View className="absolute w-full pointer-events-none">
        <Image
          source={theme == "dark" ?
            require("../assets/images/calendar-dark-transparent.png")
            :
            require("../assets/images/calendar-light-transparent.png")
          }
          style={{
            width: screenWidth,
            height: screenHeight * .4,
          }}
        />
      </View>

      <View className="w-full flex pt-[250px] px-3">
        <View className="w-full flex items-center gap-3 px-5">
          <TextAnimated className="text-3xl font-extrabold">
            {t("login_item_1", { name: APP_NAME })}
          </TextAnimated>

          <TextAnimated className="text-lg text-center">
            {t("login_item_2")}
          </TextAnimated>
        </View>

        <View className="w-full">
          <Input
            label={(t("login_email"))}
            placeholder="email@example.com"
            value={inputsValues.email}
            onChangeText={(e) => setInputsValues(prev => ({
              ...prev,
              email: e,
            }))}
            icon={(
              <View
                style={{
                  transform: [
                    {
                      translateX: 15,
                    },
                    {
                      translateY: 47,
                    },
                  ]
                }}
                className="absolute left-0 top-0"
              >
                <FontAwesome6
                  name="envelope-open-text"
                  size={20}
                  color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                />
              </View>
            )}
          />
        </View>

        <View className="w-full mt-5">
          <Input
            label={(t("login_password"))}
            placeholder="• • • • • • • •"
            value={inputsValues.password}
            onChangeText={(e) => setInputsValues(prev => ({
              ...prev,
              password: e,
            }))}
            eye
            icon={(
              <View
                style={{
                  transform: [
                    {
                      translateX: 15,
                    },
                    {
                      translateY: 47,
                    },
                  ]
                }}
                className="absolute left-0 top-0"
              >
                <Fontisto
                  name="locked"
                  size={20}
                  color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                />
              </View>
            )}
          />
        </View>
      </View>
      <Animated.View
        style={{
          height: 100,
          marginBottom: 500,
        }}
        className="w-full bg-emerald-900"
      />
    </Container>
  );
}
