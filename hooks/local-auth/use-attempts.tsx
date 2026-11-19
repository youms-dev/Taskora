import { ATTEMPTS_STORAGE } from "@/constants/async-storage";
import { LOGOUT } from "@/constants/emitters";
import { emitter } from "@/lib/event-emitter";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, RefObject, useCallback, useContext, useEffect, useRef, useState } from "react";

const INITIAL_VALUE = 10;

const Context = createContext<{
    attempts: number;
    decrement: () => void;
    reset: () => void;
    attemptsRef: RefObject<number>;
}>({
    attempts: INITIAL_VALUE,
    decrement: () => { },
    reset: () => { },
    attemptsRef: {
        current: INITIAL_VALUE,
    },
});

interface Props {
    children: ReactNode;
}

export const AttemptsProvider = ({ children }: Props) => {
    const [attempts, setAttempts] = useState<number>(INITIAL_VALUE);
    const { setItem, getItem, removeItem } = useAsyncStorage(ATTEMPTS_STORAGE);
    const attemptsRef = useRef<typeof attempts>(attempts);

    const decrement = useCallback(async () => {
        if (attemptsRef.current > 1) {
            const value = attemptsRef.current - 1;

            attemptsRef.current = value;
            setAttempts(value);
            await setItem(String(attemptsRef.current));
        }
        else {
            emitter.emit(LOGOUT);
            return;
        }
    }, []);

    const reset = useCallback(async () => {
        setAttempts(INITIAL_VALUE);
        attemptsRef.current = INITIAL_VALUE;
        await removeItem();
    }, []);

    useEffect(() => {
        const getAttempts = async () => {
            const value = await getItem();

            if (value) {
                setAttempts(Number(value));
                attemptsRef.current = Number(value);
            }
        }

        getAttempts();
    }, []);

    return (
        <Context.Provider value={{
            attempts,
            decrement,
            reset,
            attemptsRef,
        }}>
            {children}
        </Context.Provider>
    );
};

export const useAttempts = () => useContext(Context);