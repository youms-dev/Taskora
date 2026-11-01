import { config } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import { SeederOptions } from "typeorm-extension";
import { FolderFactory } from "./database/factories/folder.factory";
import { SettingFactory } from "./database/factories/setting.factory";
import { TaskFactory } from "./database/factories/task.factory";
import { UserFactory } from "./database/factories/user.factory";
import { MainSeeder } from "./database/seeding/main.seeder";

config({
    path: [".env", ".env.development"],
    quiet: true,
});

const options: DataSourceOptions & SeederOptions = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: ["error"],
    entities: [__dirname + "/database/entities/*.entity{.ts,.js}"],
    migrations: [__dirname + "/database/migrations/*{.js,.ts}"],
    seeds: [MainSeeder],
    factories: [UserFactory, TaskFactory, FolderFactory, SettingFactory],
}

export const dataSource = new DataSource(options);