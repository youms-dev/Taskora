import { api } from "@/lib/axios";
import { SettingType } from "@/types/database/setting";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth-provider";
import { useSettings } from "../database/use-setting";
import { useToast } from "../use-toast";

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
    const { user } = useAuth();
    const { setToast } = useToast();
    const { t, i18n } = useTranslation();

    const handleGetSetting = useCallback(async () => {
        if (loadingRef.current || !user) return;
        try {
            setLoading(true);
            loadingRef.current = true;

            const data = await getSetting(user.idUser) as Required<SettingType>;

            setSetting(data);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [user]);

    const handleUpdateSetting = useCallback(async (entry: Required<SettingType>) => {
        const prev = setting;

        setSetting(entry);

        if (loadingRef.current) return;

        try {
            setLoading(true);

            if (prev?._2FA != entry._2FA) {
                await api.patch("/setting/toggle-2fa");
                await editSetting(entry);
            }
            else {
                await editSetting(entry);
            }

            handleGetSetting();
        }
        catch (e) {
            setToast(t("error"));
            setSetting(prev);
        }
        finally {
            setLoading(false);
        }
    }, [setting, i18n.language]);

    useEffect(() => {
        handleGetSetting();
    }, []);

    return (
        <Context.Provider value={{
            setting,
            handleGetSetting,
            loading,
            setSetting: handleUpdateSetting,
        }}>
            {children}
        </Context.Provider>
    );
}

export const useSettingsData = () => useContext(Context);