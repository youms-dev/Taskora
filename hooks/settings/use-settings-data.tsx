import { SplashScreen } from "@/components/spash-screen";
import { SettingType } from "@/types/setting";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSettings } from "../database/use-setting";

type ContextType = {
    setting: Required<SettingType> | null;
    loading: boolean;
    setSetting: (entry: Required<SettingType>) => void;
    handleGetSetting: () => void;
}

const Context = createContext<ContextType>({
    setting: null,
    loading: false,
    setSetting: () => { },
    handleGetSetting: () => { },
});

interface Props {
    children: ReactNode;
}

export const SettingsProvider = ({ children }: Props) => {
    const [setting, setSetting] = useState<Required<SettingType> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { getSetting, setSetting: editSetting } = useSettings();
    const loadingRef = useRef<boolean>(false);

    const handleGetSetting = useCallback(async () => {
        if (loadingRef.current) return;
        try {
            setLoading(true);
            const data = await getSetting() as Required<SettingType>;

            setSetting(data);
            setLoading(false);
        }
        catch (e) {
            setLoading(false);
            console.log(e);
        }
    }, []);

    const handleSetSetting = useCallback(async (entry: Required<SettingType>) => {
        const prev = setting;

        setSetting(entry);
        if (loadingRef.current) return;
        setLoading(true);
        try {
            await editSetting(entry);
            setSetting(entry);
            setLoading(false);
        }
        catch (e) {
            setSetting(prev);
            setLoading(false);
            console.log(e);
        }
    }, [setting]);

    useEffect(() => {
        handleGetSetting();
    }, []);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    return (
        <Context.Provider value={{
            setting,
            handleGetSetting,
            loading,
            setSetting: handleSetSetting,
        }}>
            {
                !setting ? (
                    <SplashScreen />
                )
                    :
                    children
            }
        </Context.Provider>
    );
}

export const useSettingsData = () => useContext(Context);