import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { Folder } from "../entities/folder.entity";
import { Setting } from "../entities/setting.entity";
import { EntityTable, SyncAction, SyncChanges } from '../entities/sync_changes.entity';
import { Task } from "../entities/task.entity";
import { User } from "../entities/user.entity";

export class MainSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager) {
        try {

            const taskFactory = factoryManager.get(Task);
            const userFactory = factoryManager.get(User);
            const folderFactory = factoryManager.get(Folder);
            const settingFactory = factoryManager.get(Setting);
            const SyncChangesFactory = factoryManager.get(SyncChanges);

            console.log("Seeding ...");

            await dataSource.getRepository(Task).deleteAll();
            await dataSource.getRepository(Folder).deleteAll();
            await dataSource.getRepository(SyncChanges).deleteAll();
            // await dataSource.getRepository(User).deleteAll();
            // await dataSource.getRepository(Setting).deleteAll();

            // const setting = await settingFactory.save();

            // const user = await userFactory.save({
            //     setting,
            // });

            // const folders = await folderFactory.saveMany(5, {
            //     user,
            // });

            // await Promise.all(Array.from({ length: 50 }, (_, index) => {
            //     const nb = Math.random();

            //     taskFactory.save({
            //         user,
            //         folder: nb > .5 ? folders[index % folders.length] : undefined,
            //     });
            // }));
            const user = (await dataSource
                .getRepository(User)
                .findOneBy({})
            );

            if (!user) {
                console.log("No user !");
                return;
            }

            await Promise.all(Array(200).fill(0).map(async (_, i) => {
                const task = await taskFactory.save({
                    user,
                    pinned: i <= 2,
                });

                await dataSource
                    .getRepository(SyncChanges)
                    .save({
                        idEntity: task.idTask,
                        action: SyncAction.INSERT,
                        entity_table: EntityTable.TASK,
                    });
            }));

            console.log("Seeding done !");
        }
        catch (e) {
            console.log("Error :", e);
        }
    }
}