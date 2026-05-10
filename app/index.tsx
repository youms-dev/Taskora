import { Button } from '@/components/Button';
import { Container } from '@/components/container';
import { Input } from '@/components/input';
import { COLORS } from '@/constants/colors';
import { EMAIL_LENGTH, PASSWORD_LENGTH } from '@/constants/lengths';
import { EMAIL_REGEX } from '@/constants/regex';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { checkLength, checkPattern } from '@/utils/tools';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
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
  const [eye, setEye] = useState<'eye' | 'eye-slash'>('eye');
  const [loading, setLoading] = useState<boolean>(false);
  const { height } = Dimensions.get("window");
  const { theme } = useTheme();
  const { setToast } = useToast();

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
        behavior={Platform.OS == "android" ? "padding" : "height"}
        className="w-11/12 flex items-center gap-12"
      >
        <View className="flex justify-center items-center w-full">
          <Text className="text-5xl text-emerald-500 font-bold animate-bounce">Connexion</Text>
        </View>
        <Input
          placeholder="Email"
          keyboardType='email-address'
          autoCapitalize='none'
          icon={{
            name: 'envelope-circle-check',
            touchable: false,
          }}
          value={inputsValues.email}
          onChangeText={(e) => setInputsValues({
            ...inputsValues,
            email: e
          })}
        />
        <Input
          placeholder="Mot de passe"
          secureTextEntry={!inputsValues.password.visible}
          icon={{
            name: eye,
            scale: .3,
            touchable: () => {
              setInputsValues({
                ...inputsValues,
                password: {
                  ...inputsValues.password,
                  visible: !inputsValues.password.visible,
                },
              });

              if (!inputsValues.password.visible) {
                setEye('eye-slash');
              } else {
                setEye('eye');
              }
            },
          }}
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
            className='w-[300px] h-[60px]'
          >

            <Text className='text-2xl font-extrabold'>Soumettre</Text>
          </Button>
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
          colors={[COLORS.emerald[500], theme === "dark" ? "black" : "white"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, .2]}
          className="absolute animate-pulse"
          style={{
            bottom: -(height - (height * 1) / 100),
            width: "210%",
            height: "210%",
            borderRadius: 9999
          }}
        >
        </LinearGradient>
      </KeyboardAvoidingView>
    </Container>
  );
}
