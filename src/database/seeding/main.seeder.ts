import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { Folder } from "../entities/folder.entity";
import { Setting } from "../entities/setting.entity";
import { Task } from "../entities/task.entity";
import { User } from "../entities/user.entity";

export class MainSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager) {
        try {
            const taskFactory = factoryManager.get(Task);
            const userFactory = factoryManager.get(User);
            const folderFactory = factoryManager.get(Folder);
            const settingFactory = factoryManager.get(Setting);

            console.log("Seeding ...");

            await dataSource.getRepository(Task).deleteAll();
            await dataSource.getRepository(Folder).deleteAll();
            await dataSource.getRepository(User).deleteAll();
            await dataSource.getRepository(Setting).deleteAll();

            const setting = await settingFactory.save();

            const user = await userFactory.save({
                setting,
            });

            const folders = await folderFactory.saveMany(5, {
                user,
            });

            await Promise.all(Array.from({ length: 50 }, (_, index) => {
                const nb = Math.random();

                taskFactory.save({
                    user,
                    folder: nb > .5 ? folders[index % folders.length] : undefined,
                });
            }));

            console.log("Seed done !");
        }
        catch (e) {
            console.log("Error :", e);
        }
    }
}