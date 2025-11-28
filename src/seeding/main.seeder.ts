import { Task } from "../entities/task.entity";
import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";

export class MainSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager) {
        const taskFactory = factoryManager.get(Task);

        console.log("Seeding tasks...");
        await taskFactory.saveMany(50);
        console.log("Tasks have been seeded right ☺️");
    }
}