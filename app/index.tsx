import { OAuthButton } from '@/components/0auth-button';
import { Container } from '@/components/container';
import { Input } from '@/components/input';
import { PressableAnimated } from '@/components/pressable-animated';
import { TextAnimated } from '@/components/text-animated';
import { TextGradient } from '@/components/text-gradient';
import { COLORS } from '@/constants/colors';
import { EMAIL_FORMAT_ERROR, EMAIL_LENGTH_ERROR, PASSWORD_LENGTH_ERROR } from '@/constants/errors';
import { APP_NAME } from '@/constants/names';
import { AUTH_STORE } from '@/constants/secure-store';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/axios';
import { AuthType } from '@/types/auth';
import { AUTH_PROVIDER } from '@/types/enums';
import { ApiError } from '@/types/errors';
import { FontAwesome6, Fontisto } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import clsx from 'clsx';
import * as Device from "expo-device";
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Platform, Text, TextInput, useWindowDimensions, Vibration, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { Easing, FadeInDown, FadeInUp, FadeOutDown, FadeOutUp, SlideInRight, SlideOutLeft, SlideOutRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import "../config/task-manager";

export default function Login() {
  const initialInputsValues = {
    email: "",
    password: "",
    code: "",
  };
  const [inputsValues, setInputsValues] = useState<typeof initialInputsValues>(initialInputsValues);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [with0Auth, setWith0Auth] = useState<boolean>(true);
  const loadingRef = useRef<boolean>(false);
  const { setToast } = useToast();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [_2fa, set_2fa] = useState<boolean>(false);
  const codeRef = useRef<TextInput>(null);
  const [codeFocus, setCodeFocus] = useState<boolean>(false);
  const rotation = useSharedValue<number>(0);

  const handle0AuthSignIn = useCallback(async (provider: AUTH_PROVIDER) => {
    if (loadingRef.current) return;
    try {
      setLoading(true);
      loadingRef.current = true;

      await GoogleSignin.signOut();
      const { data: authData, type } = await GoogleSignin.signIn();

      if (type == "cancelled") {
        setLoading(false);
        loadingRef.current = false;
        setToast(t("auth_canceled"), "error");

        return;
      }
      else if (!authData.user?.email) {
        setLoading(false);
        loadingRef.current = false;
        setToast(t("auth_error"), "error");

        return;
      }

      const authStore = await SecureStore.getItemAsync(AUTH_STORE);
      let session: AuthType | null = null;

      if (authStore) {
        session = JSON.parse(authStore);
      }

      const { data } = await api.post("/auth/oauth-login", {
        email: authData.user.email,
        deviceName: Device.deviceName,
        deviceBrand: Device.brand,
        deviceType: Platform.OS.toUpperCase(),
        provider,
        idDevice: session?.idDevice,
      });

      if (data._2FA) {
        set_2fa(true);
        setInputsValues(prev => ({
          ...prev,
          email: authData.user.email,
        }));
      }
      else if ("password" in data && data.password) {
        setToast(t("login_password_found"), "default", 5000);
        setInputsValues(prev => ({
          ...prev,
          email: authData.user.email,
        }));
        setWith0Auth(false);
      }
    }
    catch (e) {
      const { status } = e as ApiError;

      if (status == 429) {
        setToast(t("login_429"), "error", 5000);
      }
      else if (status == 404) {
        setToast(t("login_oauth_not_found"), "error", 5000);
      }
      else {
        setToast(t("error"), "error");
      }
    }
    finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [i18n.language, setToast]);

  const handleLogin = useCallback(async () => {
    if (loadingRef.current) return;

    if (inputsValues.email.trim().length == 0) {
      emailRef.current?.focus();
      return;
    }
    else if (inputsValues.password.trim().length == 0) {
      passwordRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      loadingRef.current = true;

      const authStore = await SecureStore.getItemAsync(AUTH_STORE);
      let session: AuthType | null = null;

      if (authStore) {
        session = JSON.parse(authStore);
      }

      const { data } = await api.post("/auth/login", {
        email: inputsValues.email,
        password: inputsValues.password,
        deviceName: Device.deviceName,
        deviceBrand: Device.brand,
        deviceType: Platform.OS.toUpperCase(),
        idDevice: session?.idDevice,
      });

      if (data._2FA) {
        set_2fa(true);
      }
      else if ("password" in data && data.password == false) {
        setToast(t("login_no_password"), "default", 5000);
        setWith0Auth(true);
        setInputsValues(initialInputsValues);
      }
    }
    catch (e) {
      const { status, data } = e as ApiError;

      if (status == 429) {
        setToast(t("login_429"), "error", 5000);
      }
      else if (status == 404) {
        setToast(t("login_404"), "error", 5000);
      }
      else if (status == 400 && data.message && Array.isArray(data.message)) {
        const messages = data.message as Array<string>;

        if (messages.includes(EMAIL_LENGTH_ERROR)) {
          setToast(t("login_error_email_length"), "error", 5000);
          emailRef.current?.focus();
        }
        else if (messages.includes(EMAIL_FORMAT_ERROR)) {
          setToast(t("login_error_email_format"), "error", 5000);
          emailRef.current?.focus();
        }
        else if (messages.includes(PASSWORD_LENGTH_ERROR)) {
          setToast(t("login_error_password_length"), "error", 5000);
          passwordRef.current?.focus();
        }
        else {
          setToast(t("error"), "error");
        }
      }
      else {
        setToast(t("error"), "error");
      }
    }
    finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [i18n.language, inputsValues, setToast, _2fa]);

  const handleResendCode = useCallback(async () => {
    if (loadingRef.current) return;

    if (inputsValues.email.trim().length == 0) {
      set_2fa(false);
      return;
    }

    try {
      setLoading(true);
      loadingRef.current = true;

      await api.post("/auth/login/2fa/resend-code", {
        email: inputsValues.email,
      });

      setToast(t("login_code_resent"), "success");
    }
    catch (e) {
      const { status } = e as ApiError;

      if (status == 429) {
        setToast(t("login_429"), "error", 5000);
      }
    }
    finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [i18n.language, inputsValues, setToast]);

  const handleCheckCode = useCallback(async () => {
    if (loadingRef.current) return;

    if (inputsValues.code.trim().length == 0) {
      codeRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      loadingRef.current = true;

      const authStore = await SecureStore.getItemAsync(AUTH_STORE);
      let session: AuthType | null = null;

      if (authStore) {
        session = JSON.parse(authStore);
      }

      const { data } = await api.post("/auth/login/2fa/check-code", {
        email: inputsValues.email,
        code: Number(inputsValues.code),
        deviceName: Device.deviceName,
        deviceBrand: Device.brand,
        deviceType: Platform.OS.toUpperCase(),
        idDevice: session?.idDevice,
      });

      await SecureStore.setItemAsync(AUTH_STORE, JSON.stringify(data));

      setInputsValues(initialInputsValues);
      set_2fa(false);
    }
    catch (e) {
      const { status } = e as ApiError;

      console.log(e);
      if (status == 429) {
        setToast(t("login_429"), "error", 5000);
      }
      else if (status == 404) {
        setToast(t("login_code_404"), "error", 5000);
      }
      else if (status == 400) {
        setToast(t("login_code_400"), "error", 5000);
      }
      else {
        setToast(t("error"), "error", 5000);
      }
    }
    finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [i18n.language, inputsValues, setToast]);

  useEffect(() => {
    const { remove } = Keyboard.addListener("keyboardDidHide", () => {
      codeRef.current?.blur();
    });

    return () => remove();
  }, []);

  const rotateAnimation = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${rotation.value}deg`,
      }
    ]
  }));

  useEffect(() => {
    if (loading) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
    else {
      rotation.value = 0;
    }
  }, [loading]);

  return (
    <Container centerX safeArea={false}>

      {/* Banner */}

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

      {/* Without 2fa */}

      {
        !_2fa && (
          <Animated.View
            entering={FadeInUp
              .duration(300)
              .easing(Easing.inOut(Easing.quad))
            }
            exiting={SlideOutLeft
              .duration(200)
              .easing(Easing.inOut(Easing.quad))
            }
            className="w-full"
          >
            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              bottomOffset={15}
              className="w-full"
              contentContainerClassName="px-3 pb-[60px]"
            >
              {/* Section 1 */}

              <View
                style={{
                  marginTop: screenHeight * .3
                }}
                className="w-full flex items-center gap-3 px-5"
              >
                <TextAnimated className="text-3xl font-extrabold text-center">
                  {t("login_item_1", { name: APP_NAME })}
                </TextAnimated>

                <TextAnimated className="text-lg text-center">
                  {t("login_item_2")}
                </TextAnimated>
              </View>

              {/* 0Auth */}

              {
                with0Auth && (
                  <Animated.View
                    entering={FadeInDown
                      .duration(300)
                      .easing(Easing.inOut(Easing.quad))
                    }
                    exiting={FadeOutDown
                      .duration(300)
                      .easing(Easing.inOut(Easing.quad))
                    }
                    className="w-full flex items-center mt-10"
                  >
                    <View className="sm:w-[400px] w-full flex items-center gap-5 px-10 mb-5">

                      {/* Google */}

                      <OAuthButton
                        name="Google"
                        icon="google"
                        loading={loading}
                        onPress={() => handle0AuthSignIn(AUTH_PROVIDER.GOOGLE)}
                      />
                    </View>

                    <View className="w-full flex flex-row justify-between items-center mt-8 px-3">
                      <LinearGradient
                        colors={theme == "dark" ?
                          ["rgba(0, 0, 0, 1)", COLORS.emerald[700]]
                          :
                          ["rgba(255, 255, 255, 1)", COLORS.emerald[500]]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        locations={[.3, .8]}
                        className="w-[40%] h-[2px]"
                      >
                        <LinearGradient
                          colors={theme == "dark" ?
                            ["rgba(255, 255, 255, .1)", COLORS.emerald[700]]
                            :
                            ["rgba(0, 0, 0, .2)", COLORS.emerald[500]]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          locations={[.3, .8]}
                          className="size-full"
                        />
                      </LinearGradient>

                      <View className="w-[20%] px-2">
                        <TextAnimated
                          numberOfLines={1}
                          ellipsizeMode="clip"
                          className="text-lg text-center"
                        >
                          {t("auth_item_2")}
                        </TextAnimated>
                      </View>

                      <LinearGradient
                        colors={theme == "dark" ?
                          ["rgba(0, 0, 0, 1)", COLORS.emerald[700]]
                          :
                          ["rgba(255, 255, 255, 1)", COLORS.emerald[500]]
                        }
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 0 }}
                        locations={[.3, .8]}
                        className="w-[40%] h-[2px]"
                      >
                        <LinearGradient
                          colors={theme == "dark" ?
                            ["rgba(255, 255, 255, .1)", COLORS.emerald[700]]
                            :
                            ["rgba(0, 0, 0, .2)", COLORS.emerald[500]]
                          }
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 0 }}
                          locations={[.3, .8]}
                          className="size-full"
                        />
                      </LinearGradient>
                    </View>

                    <View className="w-full flex flex-row justify-center px-3 mt-8">
                      <PressableAnimated
                        scale={.95}
                        onPress={() => setWith0Auth(false)}
                      >
                        <TextGradient
                          colors={[theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)", COLORS.emerald[500]]}
                          className="text-xl font-bold tracking-widest"
                        >
                          {t("auth_item_3")}
                        </TextGradient>
                      </PressableAnimated>
                    </View>
                  </Animated.View>
                )
              }

              {/* Email and password */}

              {
                !with0Auth && (
                  <Animated.View
                    entering={FadeInDown
                      .duration(300)
                      .easing(Easing.inOut(Easing.quad))
                    }
                    exiting={FadeOutDown
                      .duration(300)
                      .easing(Easing.inOut(Easing.quad))
                    }
                    className="w-full flex items-center"
                  >
                    <View className="w-full">
                      <Input
                        ref={emailRef}
                        label={(t("login_email"))}
                        placeholder="email@example.com"
                        autoCapitalize="none"
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
                            className="absolute left-0 top-0 pointer-events-none"
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
                        ref={passwordRef}
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
                            className="absolute left-0 top-0 pointer-events-none"
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

                    <View className="w-full flex flex-row justify-end px-3 mt-6">
                      <Link href={{
                        pathname: "/register",
                      }}>
                        <TextAnimated className="text-lg">
                          {t("login_item_5")}
                        </TextAnimated>
                      </Link>
                    </View>

                    <View className="w-full flex flex-row justify-center mt-10 mb-3">
                      <View className="sm:w-[500px] w-full flex flex-row justify-center gap-3 px-3">
                        <PressableAnimated
                          scale={.95}
                          disabled={loading}
                          onPress={() => setWith0Auth(true)}
                          className={clsx(
                            "w-[35%] h-[50px] rounded-2xl dark:bg-black bg-white",
                            loading && "opacity-50",
                          )}
                        >
                          <View className="w-full h-full flex justify-center items-center dark:bg-white/10 bg-black/80 px-3 rounded-2xl border dark:border-white/5 border-white/5">
                            {
                              loading ?
                                (
                                  <ActivityIndicator
                                    size={30}
                                    color="rgba(255, 255, 255, .8)"
                                  />
                                )
                                :
                                (
                                  <Text
                                    numberOfLines={1}
                                    ellipsizeMode="clip"
                                    className="text-2xl text-white/80 font-medium">
                                    {t("auth_item_4")}
                                  </Text>
                                )
                            }
                          </View>
                        </PressableAnimated>

                        <PressableAnimated
                          scale={.95}
                          disabled={loading}
                          onPress={handleLogin}
                          className={clsx(
                            "w-[60%] h-[50px] flex justify-center items-center bg-emerald-500 rounded-2xl px-3",
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
                                  ellipsizeMode="clip"
                                  className="text-2xl text-black/80 font-medium">
                                  {t("login_submit")}
                                </Text>
                              )
                          }
                        </PressableAnimated>
                      </View>
                    </View>
                  </Animated.View>
                )
              }

              <View className="w-full flex flex-row justify-center px-3 mt-6">
                <TextAnimated className="text-lg">
                  {t("login_item_3")}
                  &nbsp;
                  <Link href={{
                    pathname: "/register",
                  }}>
                    <Text className="text-emerald-500 font-medium">
                      {t("login_item_4")}
                    </Text>
                  </Link>
                </TextAnimated>
              </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        )
      }

      {/* With 2fa */}

      {
        _2fa && (
          <Animated.View
            entering={SlideInRight
              .duration(300)
              .easing(Easing.inOut(Easing.quad))
            }
            exiting={SlideOutRight
              .duration(200)
              .easing(Easing.inOut(Easing.quad))
            }
            className="w-full"
          >
            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              bottomOffset={15}
              className="w-full"
              contentContainerClassName="px-3 pb-[60px]"
            >

              {/* Section 1 */}

              <View
                style={{
                  marginTop: screenHeight * .35
                }}
                className="w-full flex items-center gap-3"
              >
                <TextAnimated className="text-xl text-center">
                  {t("login_item_6")}
                </TextAnimated>

                <TextAnimated className="text-xl text-center">
                  {t("login_item_7")}
                </TextAnimated>

                <Text className="text-xl font-bold text-emerald-500">
                  {inputsValues.email.trim().toLowerCase()}
                </Text>
              </View>

              {/* Section 2 */}

              <View className="w-full flex items-center mt-5">
                <View className="w-full flex flex-row flex-wrap justify-center gap-5 px-3">
                  {
                    Array(5).fill(0).map((_, i) => {
                      const isFocus = (codeFocus && (inputsValues.code.trim().length == i || (inputsValues.code.trim().length == 5 && i == 4)));

                      return (
                        <PressableAnimated
                          key={i}
                          scale={.95}
                          onPress={() => codeRef.current?.focus()}
                          className="w-[45px] h-[60px] flex justify-center items-center dark:bg-black bg-white rounded-2xl"
                        >
                          {
                            isFocus && (
                              <View
                                style={{
                                  transform: [
                                    {
                                      translateY: 6,
                                    },
                                  ],
                                  filter: "blur(5px)",
                                }}
                                className="absolute size-full bg-black/10 rounded-2xl"
                              />
                            )
                          }

                          <View className={clsx(
                            "size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-2xl border",
                            isFocus ? "border-emerald-500/50" : "dark:border-white/5 border-black/5",
                          )}>
                            {
                              inputsValues.code[i]?.trim().length > 0 && (
                                <Animated.Text
                                  entering={FadeInDown
                                    // .duration(300)
                                    // .easing(Easing.inOut(Easing.quad))
                                    .springify()
                                    .stiffness(60)
                                    .mass(1)
                                    .damping(5)
                                  }
                                  exiting={FadeOutUp
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                  }
                                  className="text-3xl font-bold text-emerald-500"
                                >
                                  {inputsValues.code[i]}
                                </Animated.Text>
                              )
                            }
                          </View>
                        </PressableAnimated>
                      )
                    })
                  }
                </View>

                <TextInput
                  ref={codeRef}
                  keyboardType="number-pad"
                  onFocus={() => setCodeFocus(true)}
                  onBlur={() => setCodeFocus(false)}
                  value={inputsValues.code}
                  onChangeText={(e) => {
                    if (isNaN(Number(e))) {
                      Vibration.vibrate(100);
                      return;
                    }
                    setInputsValues({
                      ...inputsValues,
                      code: e.slice(0, 5),
                    });
                  }}
                  style={{
                    transform: [
                      {
                        translateY: 70
                      }
                    ],
                  }}
                  className="absolute size-0 pointer-events-none -z-[100]"
                />
              </View>

              <View className="w-full mt-5">
                <PressableAnimated
                  scale={.95}
                  disabled={loading}
                  onPress={handleResendCode}
                  className="flex flex-row flex-wrap items-center gap-5"
                >
                  <TextAnimated className={clsx(
                    "text-lg",
                    loading && "opacity-50",
                  )}>
                    {t("login_item_8")}
                  </TextAnimated>

                  <Animated.View
                    style={rotateAnimation}
                    className={clsx(
                      loading && "opacity-50",
                    )}
                  >
                    <FontAwesome6
                      name="rotate-right"
                      size={22}
                      color={loading ?
                        COLORS.emerald[500]
                        :
                        theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
                      }
                    />
                  </Animated.View>
                </PressableAnimated>
              </View>

              {/* Section 3 */}

              <View className="w-full flex flex-row justify-center mt-[60px] mb-3">
                <View className="sm:w-[500px] w-full flex flex-row justify-center gap-3 px-3">
                  <PressableAnimated
                    scale={.95}
                    disabled={loading}
                    onPress={() => set_2fa(false)}
                    className={clsx(
                      "w-[35%] h-[50px] rounded-2xl dark:bg-black bg-white",
                      loading && "opacity-50",
                    )}
                  >
                    <View className="w-full h-full flex justify-center items-center dark:bg-white/10 bg-black/80 px-3 rounded-2xl border dark:border-white/5 border-white/5">
                      {
                        loading ?
                          (
                            <ActivityIndicator
                              size={30}
                              color="rgba(255, 255, 255, .8)"
                            />
                          )
                          :
                          (
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="clip"
                              className="text-2xl text-white/80 font-medium">
                              {t("auth_item_4")}
                            </Text>
                          )
                      }
                    </View>
                  </PressableAnimated>

                  <PressableAnimated
                    scale={.95}
                    disabled={loading}
                    onPress={handleCheckCode}
                    className={clsx(
                      "w-[60%] h-[50px] flex justify-center items-center bg-emerald-500 rounded-2xl px-3",
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
                            ellipsizeMode="clip"
                            className="text-2xl text-black/80 font-medium">
                            {t("login_submit")}
                          </Text>
                        )
                    }
                  </PressableAnimated>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        )
      }

      <LinearGradient
        colors={theme == "dark" ?
          ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
          :
          ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, .9)", "rgba(255, 255, 255, 0)"]
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
            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
            :
            ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 0)"]
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
