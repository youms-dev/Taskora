import { setSeederFactory } from "typeorm-extension";
import { Setting } from "../entities/setting.entity";

export const SettingFactory = setSeederFactory(Setting, () => {
    const setting = new Setting();

    return setting;
});