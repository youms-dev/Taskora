import { Container } from '@/components/container';
import { Input } from '@/components/input';
import { PressableAnimated } from '@/components/pressable-animated';
import { TextAnimated } from '@/components/text-animated';
import { COLORS } from '@/constants/colors';
import { APP_NAME } from '@/constants/names';
import { useTheme } from '@/hooks/use-theme';
import { Entypo, FontAwesome5, FontAwesome6, Fontisto } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function Register() {
  const initialInputsValues = {
    email: "",
    password: "",
    confirm: "",
  };
  const [inputsValues, setInputsValues] = useState<typeof initialInputsValues>(initialInputsValues);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  return (
    <Container centerX safeArea={false}>
      <View
        style={{
          transform: [
            {
              translateX: 15,
            },
            {
              translateY: 40,
            },
          ]
        }}
        className="absolute left-0 top-0 dark:bg-black bg-white rounded-full z-[10]"
      >
        <View
          style={{
            transform: [
              {
                translateY: 8,
              },
            ],
            filter: "blur(5px)",
          }}
          className="absolute size-full dark:bg-black/50 bg-black/30 rounded-full"
        />

        <PressableAnimated
          scale={.95}
          onPress={() => router.dismissTo({
            pathname: "/",
          })}
          className="size-[50px] flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5"
        >
          <Entypo
            name="chevron-left"
            size={25}
            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
          />
        </PressableAnimated>
      </View>

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

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        bottomOffset={15}
        className="w-full"
        contentContainerClassName="px-3 pb-[60px]"
      >
        <View
          style={{
            marginTop: screenHeight * .3
          }}
          className="w-full flex items-center gap-3 px-5"
        >
          <TextAnimated className="text-3xl font-extrabold text-center">
            {t("register_item_1", { name: APP_NAME })}
          </TextAnimated>

          <TextAnimated className="text-lg text-center">
            {t("register_item_2")}
          </TextAnimated>
        </View>

        <View className="w-full">
          <Input
            label={(t("register_email"))}
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
            label={(t("register_password"))}
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

        <View className="w-full flex flex-row items-center px-3 mt-5">
          <TextAnimated className="text-lg">
            {t("register_counter")} :
            &nbsp;
            <Text className="text-emerald-500 font-bold">
              {inputsValues.confirm.length}
            </Text>
          </TextAnimated>
        </View>

        <View className="w-full flex flex-row justify-center px-3 mt-[45px]">
          <PressableAnimated
            scale={.95}
            disabled={loading}
            className={clsx(
              "sm:w-[250px] w-3/4 h-[50px] flex justify-center items-center bg-emerald-500 rounded-2xl",
              loading && "opacity-50",
            )}
          >
            {
              loading ?
                (
                  <ActivityIndicator
                    size={30}
                    color="black"
                  />
                )
                :
                (
                  <Text
                    numberOfLines={1}
                    className="text-2xl text-black/80 font-medium">
                    {t("register_submit")}
                  </Text>
                )
            }
          </PressableAnimated>
        </View>

        <View className="w-full flex flex-row justify-center px-3 mt-[45px]">
          <TextAnimated className="text-lg">
            {t("register_item_3")}
            &nbsp;
            <Link
              href={{
                pathname: "/",
              }}
              replace
            >
              <Text className="text-emerald-500">
                {t("register_item_4")}
              </Text>
            </Link>
          </TextAnimated>
        </View>

        {/* 0Auth */}

        <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 px-3 mt-10">
          <PressableAnimated
            scale={.95}
            disabled={loading}
            className={clsx(
              "dark:bg-black bg-white rounded-full",
              loading && "opacity-50",
            )}
          >
            <View className="size-[60px] flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5">
              <FontAwesome5
                name="google"
                size={25}
                color={COLORS.emerald[500]}
              />
            </View>
          </PressableAnimated>

          <PressableAnimated
            scale={.95}
            disabled={loading}
            className={clsx(
              "dark:bg-black bg-white rounded-full",
              loading && "opacity-50",
            )}
          >
            <View className="size-[60px] flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5">
              <FontAwesome5
                name="facebook-f"
                size={25}
                color={COLORS.emerald[500]}
              />
            </View>
          </PressableAnimated>

          <PressableAnimated
            scale={.95}
            disabled={loading}
            className={clsx(
              "dark:bg-black bg-white rounded-full",
              loading && "opacity-50",
            )}
          >
            <View className="size-[60px] flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5">
              <FontAwesome5
                name="linkedin-in"
                size={25}
                color={COLORS.emerald[500]}
              />
            </View>
          </PressableAnimated>
        </View>
      </KeyboardAwareScrollView>

      <LinearGradient
        colors={theme == "dark" ?
          ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
          :
          ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
        }
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        locations={[0, .6, 1]}
        style={{
          transform: [
            {
              translateY: 2,
            }
          ]
        }}
        className="absolute left-0 bottom-0 w-full h-[60px]"
      >
        <LinearGradient
          colors={theme == "dark" ?
            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
            :
            ["rgba(0, 0, 0, .1)", "rgba(0, 0, 0, .1)", "rgba(0, 0, 0, 0)"]
          }
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          locations={[0, .6, 1]}
          className="size-full"
        />
      </LinearGradient>
    </Container>
  );
}
