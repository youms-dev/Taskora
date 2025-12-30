import { Button } from '@/components/Button';
import { Container } from '@/components/container';
import { Input } from '@/components/input';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { Toast, ToastProps } from '@/components/toast';
import { checkLength, checkPattern } from '@/utils/tools';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';
import { EMAIL_REGEX } from '@/constants/regex';
import { EMAIL_LENGTH, PASSWORD_LENGTH } from '@/constants/lengths';
import { api } from '../lib/axios';
import { ApiError } from "@/types/errors";

export default function Register() {
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
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const { height } = Dimensions.get("window");
  const { theme } = useTheme();
  const [toast, setToast] = useState<Omit<ToastProps, "onCancel">>({
    show: false,
    message: "",
    top: 0,
    type: "default"
  });
  const [count, setCount] = useState<{
    value: number;
    valid: boolean;
  }>({
    value: 0,
    valid: false,
  });

  const handleSubmit = async () => {
    setLoading(true);
    if (inputsValues.email.trim().length == 0 || inputsValues.password.value.trim().length == 0) {
      setToast({
        show: true,
        message: "Veuillez remplir tous les champs",
        type: "warning",
      });
      setLoading(false);
      return;
    }
    else if (!checkLength(inputsValues.email.trim(), [EMAIL_LENGTH.min, EMAIL_LENGTH.max ?? 100])) {
      setToast({
        show: true,
        message: `L'email doit être entre ${EMAIL_LENGTH.min} et ${EMAIL_LENGTH.max ?? 100} caractères`,
        type: "warning",
      });
      setLoading(false);
      return;
    }
    else if (!checkPattern(inputsValues.email.trim(), EMAIL_REGEX)) {
      setToast({
        show: true,
        message: "Format de l'email invalide",
        type: "warning",
      });
      setLoading(false);
      return;
    }
    else if (!checkLength(inputsValues.password.value.trim(), [PASSWORD_LENGTH.min, PASSWORD_LENGTH.max ?? 100])) {
      setToast({
        show: true,
        message: `Le mot de passe doit être entre ${PASSWORD_LENGTH.min} et ${PASSWORD_LENGTH.max ?? 100} caractères`,
        type: "warning",
      });
      setLoading(false);
      return;
    }
    const emailFormatted = inputsValues.email.toLowerCase();

    try {
      await api.post("/user/create", {
        email: emailFormatted,
      });

      const { data: { user, session }, error } = await supabase.auth.signUp({
        email: emailFormatted,
        password: inputsValues.password.value,
      });

      if (error) {
        setToast({
          show: true,
          message: "Une erreur s'est produite",
          type: "error",
        });
        setLoading(false);
        return;
      }
      else if (!user && !session) {
        setToast({
          show: true,
          message: "Une erreur s'est produite",
          type: "error",
        });
        setLoading(false);
        return;
      }

      setToast({
        show: true,
        message: "Bienvenue 😉🎉",
        type: "success",
      });
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
    catch (e) {
      const error = e as ApiError;

      if (error.status && error.status == 409) {
        setToast({
          show: true,
          message: "Cet utilisateur existe déjà",
          type: "error",
        });
      }
      else {
        setToast({
          show: true,
          message: "Une erreur s'est produite",
          type: "error",
        });
      }
      setLoading(false);
    }
  };

  return (
    <Container center>
      <KeyboardAvoidingView
        behavior={Platform.OS == "android" ? "padding" : "height"}
        className="relative w-11/12 flex items-center gap-5"
      >
        <View className="w-full flex justify-center items-center mb-5">
          <Text className="text-5xl text-emerald-500 font-bold animate-bounce">Inscription</Text>
        </View>
        <View className='w-full flex items-center'>
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
        </View>
        <View className='w-full flex items-center mt-6'>
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
            onChangeText={(e) => {
              if (e.length >= 8) {
                setCount({
                  value: e.length,
                  valid: true,
                });
              }
              else {
                setCount({
                  value: e.length,
                  valid: false,
                });
              }

              setInputsValues({
                ...inputsValues,
                password: {
                  ...inputsValues.password,
                  value: e,
                }
              });
            }
            }
          />
        </View>

        <View className="w-full flex flex-row items-center gap-3">
          <Text className='text-lg dark:text-white text-black'>Compteur :</Text>
          <Text className={clsx(
            'text-lg font-extrabold',
            count.valid ? "text-emerald-500" : "text-amber-500"
          )}>
            {count.value}
          </Text>
        </View>

        <View className="flex justify-center items-center w-full mt-4">
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

        <View className="w-full flex flex-row justify-center items-center mt-2">
          <Text className='text-lg dark:text-white text-black'>Vous avez déjà un compte ? </Text>
          <Link
            href={"/login"}
            replace
            className='text-lg text-emerald-500 font-bold'
          >Connectez-vous</Link>
        </View>

        <LinearGradient
          colors={[colors.emerald[500], theme === "dark" ? "black" : "white"]}
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
      <Toast
        show={toast.show}
        message={toast.message}
        top={toast.top}
        type={toast.type}
        onCancel={() => setToast({
          ...toast,
          show: false,
        })}
      />
    </Container>
  );
}
