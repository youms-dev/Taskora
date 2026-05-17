import { Button } from '@/components/Button';
import { Container } from '@/components/container';
import { Eye } from '@/components/eye';
import { Input } from '@/components/input';
import { PressableAnimated } from '@/components/pressable-animated';
import { TextGradient } from '@/components/text-gradient';
import { COLORS } from '@/constants/colors';
import { EMAIL_LENGTH, PASSWORD_LENGTH } from '@/constants/lengths';
import { EMAIL_REGEX } from '@/constants/regex';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { checkLength, checkPattern } from '@/utils/tools';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Login() {
  const initialInputsValues = {
    email: '',
    password: {
      visible: false,
      value: '',
    },
  };
  const [inputsValues, setInputsValues] = useState<{
    email: string;
    password: {
      visible: boolean;
      value: string;
    };
  }>(initialInputsValues);
  const [eyeClosed, setEyeClosed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { theme } = useTheme();
  const { setToast } = useToast();
  const [size, setSize] = useState<number>(0);

  const handleSubmit = async () => {
    setLoading(true);
    if (inputsValues.email.trim().length == 0 || inputsValues.password.value.trim().length == 0) {
      setToast("Veuillez remplir tous les champs", "warning");
      setLoading(false);
      return;
    }
    else if (!checkLength(inputsValues.email.trim(), [EMAIL_LENGTH.min, EMAIL_LENGTH.max ?? 100])) {
      setToast(`L'email doit être entre ${EMAIL_LENGTH.min} et ${EMAIL_LENGTH.max ?? 100} caractères`, "warning");
      setLoading(false);
      return;
    }
    else if (!checkPattern(inputsValues.email.trim(), EMAIL_REGEX)) {
      setToast("Format de l'email invalide", "warning");
      setLoading(false);
      return;
    }
    else if (!checkLength(inputsValues.password.value.trim(), [PASSWORD_LENGTH.min, PASSWORD_LENGTH.max ?? 100])) {
      setToast(`Le mot de passe doit être entre ${PASSWORD_LENGTH.min} et ${PASSWORD_LENGTH.max ?? 100} caractères`, "warning");
      setLoading(false);
      return;
    }
    const emailFormatted = inputsValues.email.toLowerCase();

    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: emailFormatted,
        password: inputsValues.password.value,
      });

      if (error && error.status == 400) {
        setToast("Identifiants invalides", "error");
        setLoading(false);
        return;
      }
      else if (error && (error.status != 400 || !error.status)) {
        setToast("Une erreur s'est produite", "error");
        setLoading(false);
        return;
      }
      else if (!user && !session) {
        setToast("Une erreur s'est produite", "error");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    catch (error) {
      setToast("Une erreur s'est produite", "error");
      setLoading(false);
    }
  };

  return (
    <Container center>
      <KeyboardAvoidingView
        behavior={Platform.OS == "android" ? "height" : "padding"}
        className="w-full sm:w-[500px] flex items-center gap-12 px-3"
      >
        <View className="px-3">
          <View className="flex justify-center items-center">
            <TextGradient
              colors={[COLORS.emerald[500], theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"]}
              className="text-5xl font-bold"
            >
              Connexion
            </TextGradient>

            <LinearGradient
              colors={[theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)", COLORS.emerald[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[.4, 1]}
              style={{
                transform: [
                  {
                    perspective: 1200,
                  },
                  {
                    rotateX: "60deg",
                  },
                  {
                    translateY: 25,
                  }
                ],
                filter: "blur(10px)"
              }}
              className="absolute bottom-0 w-full h-[10px] rounded-2xl"
            />
          </View>
        </View>
        <Input
          label='Email'
          placeholder="example@email.com"
          keyboardType='email-address'
          autoCapitalize='none'
          paddingRight={35}
          icon={(
            <View
              style={{
                transform: [
                  {
                    translateX: -16,
                  },
                  {
                    translateY: 6,
                  },
                ],
              }}
              className="absolute right-0 -z-10"
            >
              <FontAwesome5
                name="envelope-open-text"
                size={25}
                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
              />
            </View>
          )}
          value={inputsValues.email}
          onChangeText={(e) => setInputsValues({
            ...inputsValues,
            email: e
          })}
        />

        <Input
          label='Mot de passe'
          placeholder="Mot de passe"
          secureTextEntry={!inputsValues.password.visible}
          paddingRight={50}
          icon={(
            <View
              style={{
                position: "absolute",
                right: 0,
                transform: [
                  {
                    translateX: -16,
                  },
                  {
                    translateY: 12,
                  },
                ],
              }}
            >
              <Eye
                closed={eyeClosed}
                onPress={() => {
                  setEyeClosed(!eyeClosed);
                  setInputsValues({
                    ...inputsValues,
                    password: {
                      ...inputsValues.password,
                      visible: !inputsValues.password.visible,
                    },
                  });
                }}
              />
            </View>
          )}
          value={inputsValues.password.value}
          onChangeText={(e) => setInputsValues({
            ...inputsValues,
            password: {
              ...inputsValues.password,
              value: e,
            }
          })}
        />

        <View className="flex justify-center items-center w-full">
          <Button
            loaderSize={25}
            loading={loading}
            scale={.8}
            onPress={() => handleSubmit()}
            className="w-[300px] h-[60px]"
          >
            <Text className='text-2xl font-extrabold'>Soumettre</Text>
          </Button>
        </View>

        <View className='w-full flex flex-row flex-wrap justify-center items-center gap-8 px-3'>
          <PressableAnimated className="size-[60px] flex justify-center items-center bg-emerald-500 p-2 rounded-2xl">
            <FontAwesome5
              name="google"
              size={40}
              color="back"
            />
          </PressableAnimated>

          <PressableAnimated className="size-[60px] flex justify-center items-center bg-emerald-500 p-2 rounded-2xl">
            <FontAwesome5
              name="facebook-f"
              size={40}
              color="back"
            />
          </PressableAnimated>

          <PressableAnimated className="size-[60px] flex justify-center items-center bg-emerald-500 p-2 rounded-2xl">
            <FontAwesome5
              name="linkedin-in"
              size={40}
              color="back"
            />
          </PressableAnimated>
        </View>

        <View className="w-full flex flex-row justify-center items-center">
          <Text className='text-lg dark:text-white text-black'>Pas encore de compte ? </Text>
          <Link
            href={"/register"}
            replace
            className='text-lg text-emerald-500 font-bold'
          >Inscrivez-vous</Link>
        </View>

        <LinearGradient
          colors={[COLORS.emerald[500], "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, .12]}
          onLayout={(e) => setSize(e.nativeEvent.layout.height)}
          className="absolute animate-pulse -z-10"
          style={{
            bottom: -(size + size * .01),
            width: "210%",
            height: "210%",
            borderRadius: 9999
          }}
        />
      </KeyboardAvoidingView>
    </Container >
  );
}
